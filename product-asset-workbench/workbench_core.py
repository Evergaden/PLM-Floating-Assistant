# -*- coding: utf-8 -*-
"""Core services for Product Asset Workbench.

The desktop UI is deliberately thin: this module owns PLM backup synchronisation,
repeatable file output, asset rendering and the legacy image-pack archive flow.
Keeping those operations outside Qt makes them testable and safe to run in a
background worker.
"""

from __future__ import annotations

import base64
import gzip
import io
import json
import math
import os
import re
import shutil
import subprocess
import zipfile
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Callable, Iterable
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw, ImageFont
from openpyxl import load_workbook
from openpyxl.drawing.image import Image as ExcelImage


APP_DIR = Path(__file__).resolve().parent
CONFIG_FILE = APP_DIR / "config.json"
LEGACY_CONFIG_FILE = APP_DIR / "config.txt"
RULES_FILE = APP_DIR / "rules.txt"
PLM_BACKUP_URL = "https://velvet.qzz.io/backup/load"
PLM_ASSET_BASE_URL = "https://velvet.qzz.io"
PLM_EXCEL_TEMPLATE_URL = PLM_ASSET_BASE_URL + "/assets/v1/excel-template.xlsx"
PLM_PARAMETER_LOGO_URL = PLM_ASSET_BASE_URL + "/parameter-logo?brand="
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}
PLM_TEMPLATE_CACHE = Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "Product Asset Workbench" / "excel-template.xlsx"
_BRAND_LOGO_CACHE: dict[str, Image.Image | None] = {}

DEFAULT_CONFIG = {
    "backup_url": PLM_BACKUP_URL,
    "backup_key": "",
    "asset_root": str(Path.home() / "Documents" / "PLM Product Assets"),
    "folder_pattern": "{sku}_{brand}_{name}",
    "use_existing_folders": True,
    "delete_zip": False,
    "use_rules": True,
    "resize_images": False,
    "photoshop_path": "",
}


class WorkbenchError(RuntimeError):
    """A human-readable failure that can be shown by the desktop UI."""


@dataclass(slots=True)
class ProductRecord:
    sku: str
    brand: str = ""
    name: str = ""
    english_name: str = ""
    finalized_at: str = ""
    finalized_at_ms: int = 0
    status: str = "已定稿"
    sku_image_url: str = ""
    reference_url: str = ""
    package_length: str = ""
    package_width: str = ""
    package_height: str = ""
    product_length: str = ""
    product_width: str = ""
    product_height: str = ""
    net_content: str = ""
    gross_weight: str = ""
    ingredients: str = ""
    shelf_life: str = ""
    pack_qty: str = ""
    package_code: str = ""
    print_code: str = ""
    product_type: str = ""
    developer_name: str = ""
    purchase_price: str = ""
    single_bottle: bool = False
    omit_product_size: bool = False
    raw: dict[str, Any] = field(default_factory=dict)

    @property
    def display_name(self) -> str:
        return " ".join(part for part in (self.brand, self.name) if part).strip() or self.sku

    @property
    def dimensions(self) -> str:
        return dimension_text(self.package_length, self.package_width, self.package_height)


@dataclass(slots=True)
class AssetOptions:
    excel: bool = True
    english_detail: bool = True
    size_image: bool = True
    use_existing_folders: bool = True
    folder_pattern: str = "{sku}_{brand}_{name}"
    overwrite_existing: bool = False


@dataclass(slots=True)
class AssetResult:
    sku: str
    folder: Path
    created_files: list[Path] = field(default_factory=list)
    skipped_files: list[Path] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def load_config() -> dict[str, Any]:
    """Load the JSON config, migrating the old key=value config when present."""
    config = dict(DEFAULT_CONFIG)
    try:
        saved = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
        if isinstance(saved, dict):
            config.update({key: saved[key] for key in DEFAULT_CONFIG if key in saved})
            return config
    except (OSError, json.JSONDecodeError):
        pass

    try:
        for line in LEGACY_CONFIG_FILE.read_text(encoding="utf-8").splitlines():
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            if key == "search_root":
                config["asset_root"] = value
            elif key in {"delete_zip", "use_rules", "resize_images"}:
                config[key] = value.strip().lower() == "true"
            elif key == "photoshop_path":
                config[key] = value
    except OSError:
        pass
    return config


def save_config(config: dict[str, Any]) -> None:
    payload = {key: config.get(key, DEFAULT_CONFIG[key]) for key in DEFAULT_CONFIG}
    CONFIG_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def clean_text(value: Any) -> str:
    return str(value or "").replace("\r", " ").replace("\n", " ").strip()


def first_text(data: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = clean_text(data.get(key))
        if value and value != "--":
            return value
    return ""


def dimension_text(*values: Any) -> str:
    parts = [clean_text(value) for value in values if clean_text(value) and clean_text(value) != "--"]
    return " × ".join(parts) + (" cm" if parts else "")


def _decode_cloud_payload(payload: dict[str, Any]) -> dict[str, Any]:
    if payload.get("compression") != "gzip-base64":
        return payload
    encoded = payload.get("data")
    if not isinstance(encoded, str):
        raise WorkbenchError("PLM 云备份格式不完整，缺少压缩数据。")
    try:
        return json.loads(gzip.decompress(base64.b64decode(encoded)).decode("utf-8"))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        raise WorkbenchError(f"无法读取压缩的 PLM 云备份：{error}") from error


def _record_from_sources(ledger: dict[str, Any], cached: dict[str, Any]) -> ProductRecord:
    merged = {**cached, **{key: value for key, value in ledger.items() if value not in (None, "", [], {})}}
    sku = first_text(ledger, "sku") or first_text(cached, "sku")
    if not sku:
        raise WorkbenchError("PLM 记录缺少 SKU。")
    copywriting = cached.get("copywriting") if isinstance(cached.get("copywriting"), dict) else {}
    ingredients = (
        first_text(merged, "ingredientChinese", "copywritingIngredientChinese", "ingredients")
        or first_text(copywriting, "ingredientChinese", "ingredientChineseText", "ingredients")
        or first_text(merged, "ingredientEnglish", "copywritingIngredientEnglish")
    )
    return ProductRecord(
        sku=sku.upper(),
        brand=first_text(merged, "brand"),
        name=first_text(merged, "name", "productName", "chineseName"),
        english_name=first_text(
            merged,
            "englishName",
            "productEnglishName",
            "englishProductName",
            "productNameEnglish",
        ) or first_text(copywriting, "englishProductName", "productName"),
        finalized_at=first_text(ledger, "finalizedAt", "finalizedDate", "updatedAt"),
        finalized_at_ms=int(ledger.get("finalizedAtMs") or ledger.get("updatedAtMs") or 0),
        status=first_text(ledger, "status") or "已定稿",
        sku_image_url=first_text(merged, "skuImageUrl", "skuImageFallbackUrl", "productListImageUrl", "productListImageFallbackUrl"),
        reference_url=first_text(merged, "referenceUrl", "benchmarkLink", "benchmarkUrl"),
        package_length=first_text(merged, "packageLength"),
        package_width=first_text(merged, "packageWidth"),
        package_height=first_text(merged, "packageHeight"),
        product_length=first_text(merged, "productLength"),
        product_width=first_text(merged, "productWidth"),
        product_height=first_text(merged, "productHeight"),
        net_content=first_text(merged, "netContent"),
        gross_weight=first_text(merged, "grossWeight", "copywritingGrossWeight"),
        ingredients=ingredients,
        shelf_life=first_text(merged, "shelfLife", "shelfLifeText"),
        pack_qty=first_text(merged, "packQty", "packCount", "cartonQty", "packageQty"),
        package_code=first_text(merged, "packageCode"),
        print_code=first_text(merged, "printCode"),
        product_type=first_text(merged, "aiProductType", "productType", "category"),
        developer_name=first_text(merged, "developerName"),
        purchase_price=first_text(merged, "purchasePrice"),
        single_bottle=bool(merged.get("singleBottle")),
        omit_product_size=bool(merged.get("omitEstimatedProductSize")),
        raw=merged,
    )


def fetch_finalized_products(
    backup_key: str,
    backup_url: str = PLM_BACKUP_URL,
    timeout: int = 30,
) -> tuple[list[ProductRecord], str]:
    """Fetch finalized products from the same cloud backup used by PLM Assistant.

    Only the user's backup key is sent to the configured HTTPS endpoint.  The
    endpoint response is the standard assistant backup format; no PLM password
    or browser session cookie is used by this application.
    """
    backup_key = clean_text(backup_key)
    if len(backup_key) < 4:
        raise WorkbenchError("请输入 PLM 助手中使用的云备份密钥（至少 4 位）。")
    url = clean_text(backup_url) or PLM_BACKUP_URL
    separator = "&" if "?" in url else "?"
    request = Request(
        url + separator + urlencode({"backupKey": backup_key}),
        headers={"Accept": "application/json", "User-Agent": "PLM-Asset-Workbench/3"},
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
    except Exception as error:  # urllib exposes several platform-specific errors
        raise WorkbenchError(f"无法连接 PLM 云备份：{error}") from error
    if not data.get("found"):
        raise WorkbenchError("未找到这个备份密钥的数据。请先在 PLM 助手的“云备份”中上传一次。")
    payload = data.get("payload")
    if not isinstance(payload, dict):
        raise WorkbenchError("PLM 云备份返回了无效内容。")
    payload = _decode_cloud_payload(payload)
    items = payload.get("items") if isinstance(payload.get("items"), dict) else {}
    ledger = payload.get("dailyLedger") if isinstance(payload.get("dailyLedger"), list) else []
    records: dict[str, ProductRecord] = {}
    for row in ledger:
        if not isinstance(row, dict):
            continue
        if not clean_text(row.get("finalizedAt")) or clean_text(row.get("status")) == "作废":
            continue
        sku = first_text(row, "sku").upper()
        if not sku:
            continue
        cached = items.get(sku) or items.get(first_text(row, "sku")) or {}
        cached = cached if isinstance(cached, dict) else {}
        record = _record_from_sources(row, cached)
        previous = records.get(record.sku)
        if previous is None or record.finalized_at_ms >= previous.finalized_at_ms:
            records[record.sku] = record
    products = sorted(records.values(), key=lambda item: (item.finalized_at_ms, item.finalized_at), reverse=True)
    return products, clean_text(data.get("updatedAt"))


def sanitize_component(value: str, max_length: int = 120) -> str:
    text = re.sub(r'[\\/:*?"<>|\x00-\x1f]+', "_", clean_text(value))
    text = re.sub(r"\s+", " ", text).strip(" ._")
    return text[:max_length].rstrip(" .") or "未命名"


def format_product_folder(record: ProductRecord, pattern: str) -> str:
    values = {
        "sku": record.sku,
        "brand": sanitize_component(record.brand, 48),
        "name": sanitize_component(record.name or record.english_name, 100),
    }
    try:
        name = clean_text(pattern).format(**values)
    except (KeyError, ValueError):
        name = "{sku}_{brand}_{name}".format(**values)
    return sanitize_component(name)


def find_target_folders(root: Path, sku: str) -> list[Path]:
    if not root.is_dir():
        return []
    try:
        return sorted(
            [path for path in root.iterdir() if path.is_dir() and sku.upper() in path.name.upper()],
            key=lambda path: path.name.lower(),
        )
    except OSError:
        return []


def resolve_product_folder(root: Path, record: ProductRecord, options: AssetOptions) -> Path:
    root.mkdir(parents=True, exist_ok=True)
    if options.use_existing_folders:
        matches = find_target_folders(root, record.sku)
        if matches:
            return matches[0]
    target = root / format_product_folder(record, options.folder_pattern)
    target.mkdir(parents=True, exist_ok=True)
    return target


def find_transparent_product_image(folder: Path) -> Path | None:
    """Return the designer-prepared cutout from a product's root folder.

    The product workspace keeps ``透明.png`` beside SKU.png, PSD and AI source
    files.  It is the preferred image for English parameter and size images;
    URL downloads from PLM are only a fallback.
    """
    preferred = [folder / "透明.png", folder / "透明图.png"]
    for path in preferred:
        if path.is_file():
            return path
    try:
        return next((path for path in folder.glob("透明.*") if path.suffix.lower() in IMAGE_EXTENSIONS), None)
    except OSError:
        return None


def _load_local_image(path: Path | None) -> Image.Image | None:
    if not path or not path.is_file():
        return None
    try:
        with Image.open(path) as source:
            return source.convert("RGBA")
    except (OSError, ValueError):
        return None


def describe_product_workspace(root: Path | str, record: ProductRecord, options: AssetOptions) -> dict[str, Any]:
    """Describe the exact delivery folders without writing any files."""
    root_path = Path(root)
    matches = find_target_folders(root_path, record.sku) if options.use_existing_folders else []
    product_folder = matches[0] if matches else root_path / format_product_folder(record, options.folder_pattern)
    pack_folder = product_folder / "套图"
    asset_folder = pack_folder / product_folder.name
    transparent = find_transparent_product_image(product_folder)
    outputs = {
        "excel": pack_folder / f"{product_folder.name}.xlsx",
        "english": asset_folder / "英文参数图" / "英文参数图.jpg",
        "size": asset_folder / "产品参数图" / "尺寸.jpg",
    }
    missing: list[str] = []
    if not transparent:
        missing.append("透明.png")
    if not record.english_name:
        missing.append("英文名称")
    if not record.net_content:
        missing.append("净含量")
    if not record.gross_weight:
        missing.append("毛重")
    if not record.ingredients:
        missing.append("成分")
    if not record.reference_url:
        missing.append("对标链接")
    if not (record.package_length and record.package_width and record.package_height):
        missing.append("包装尺寸")
    if not (record.product_length and record.product_width and record.product_height):
        missing.append("产品尺寸")
    return {
        "productFolder": product_folder,
        "assetFolder": asset_folder,
        "transparentImage": transparent,
        "outputs": outputs,
        "missing": missing,
        "existing": {key: path.exists() for key, path in outputs.items()},
    }


def _font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = (
        [r"C:\Windows\Fonts\msyhbd.ttc", r"C:\Windows\Fonts\arialbd.ttf"]
        if bold
        else [r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\arial.ttf"]
    )
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _line_wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> str:
    words = clean_text(text).split()
    if not words:
        return ""
    lines: list[str] = []
    line = ""
    for word in words:
        candidate = word if not line else f"{line} {word}"
        if line and draw.textlength(candidate, font=font) > max_width:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return "\n".join(lines)


def _download_product_image(url: str) -> Image.Image | None:
    if not url or not re.match(r"^https?://", url, re.I):
        return None
    try:
        request = Request(url, headers={"User-Agent": "PLM-Asset-Workbench/3"})
        with urlopen(request, timeout=15) as response:
            raw = response.read(8 * 1024 * 1024 + 1)
        if len(raw) > 8 * 1024 * 1024:
            return None
        return Image.open(io.BytesIO(raw)).convert("RGBA")
    except Exception:
        return None


def _contain(image: Image.Image, width: int, height: int) -> Image.Image:
    copy = image.copy()
    copy.thumbnail((width, height), Image.Resampling.LANCZOS)
    return copy


def _paste_product_image(canvas: Image.Image, product: Image.Image | None, box: tuple[int, int, int, int]) -> None:
    left, top, right, bottom = box
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(box, radius=34, fill="#F4F8FC", outline="#D7E1ED", width=3)
    if product is None:
        draw.rounded_rectangle((left + 120, top + 120, right - 120, bottom - 120), radius=52, fill="#DDEAF4")
        draw.ellipse((left + 180, top + 170, right - 180, bottom - 300), fill="#A9C6DE")
        draw.rounded_rectangle((left + 220, bottom - 430, right - 220, bottom - 170), radius=30, fill="#BFD5E6")
        draw.text((left + 80, bottom - 100), "PLM PRODUCT IMAGE", font=_font(28, True), fill="#69839B")
        return
    thumb = _contain(product, right - left - 64, bottom - top - 64)
    x = left + ((right - left) - thumb.width) // 2
    y = top + ((bottom - top) - thumb.height) // 2
    canvas.alpha_composite(thumb, (x, y))


def _draw_dimension_arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], label: str, vertical: bool = False) -> None:
    color = "#1976D2"
    draw.line([start, end], fill=color, width=7)
    if vertical:
        for point, direction in ((start, 1), (end, -1)):
            x, y = point
            draw.polygon([(x, y), (x - 14, y + 24 * direction), (x + 14, y + 24 * direction)], fill=color)
        text_x = start[0] + 24
        text_y = (start[1] + end[1]) // 2
    else:
        for point, direction in ((start, 1), (end, -1)):
            x, y = point
            draw.polygon([(x, y), (x + 24 * direction, y - 14), (x + 24 * direction, y + 14)], fill=color)
        text_x = (start[0] + end[0]) // 2
        text_y = start[1] - 54
    draw.rounded_rectangle((text_x - 14, text_y - 8, text_x + 220, text_y + 44), radius=16, fill="#E8F3FF")
    draw.text((text_x, text_y), label or "—", font=_font(28, True), fill=color)


def _preferred_product_image(record: ProductRecord, source_image: Image.Image | None) -> Image.Image | None:
    return source_image or _download_product_image(record.sku_image_url)


def generate_english_detail(record: ProductRecord, output: Path, source_image: Image.Image | None = None) -> list[str]:
    """Generate a 1600px English parameter image beside the existing assets."""
    image = Image.new("RGBA", (1600, 1600), "#FFFFFF")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, 1600, 22), fill="#1672A6")
    draw.text((92, 76), record.brand or "PRODUCT", font=_font(82, True), fill="#1E7FB9")
    draw.rectangle((92, 214, 820, 346), outline="#182E42", width=5)
    title = _line_wrap(draw, (record.english_name or record.name or record.sku).upper(), _font(45, True), 660)
    draw.multiline_text((122, 246), title, font=_font(45, True), fill="#182E42", spacing=4)
    draw.text((96, 380), f"SKU  {record.sku}", font=_font(25, True), fill="#668096")

    product_image = _preferred_product_image(record, source_image)
    _paste_product_image(image, product_image, (850, 145, 1504, 1394))
    facts = [
        ("NAME", record.english_name or record.name),
        ("NET CONTENT", record.net_content),
        ("PACKAGE SIZE", dimension_text(record.package_length, record.package_width, record.package_height)),
        ("PRODUCT SIZE", dimension_text(record.product_length, record.product_width, record.product_height)),
        ("MATERIAL CODE", record.package_code),
    ]
    y = 488
    for label, value in facts:
        draw.rectangle((92, y, 354, y + 84), fill="#122D45")
        draw.text((120, y + 24), label, font=_font(25, True), fill="#FFFFFF")
        draw.line((354, y + 83, 778, y + 83), fill="#31495D", width=2)
        draw.multiline_text((385, y + 18), _line_wrap(draw, value or "NEEDS MANUAL CHECK", _font(27), 370), font=_font(27), fill="#132E46", spacing=2)
        y += 150
    draw.text((94, 1510), "Generated from the PLM finalized-product queue. Verify product copy before publishing.", font=_font(20), fill="#7890A2")
    output.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(output, quality=95, subsampling=0)
    return ["未找到本地透明.png 或可访问的 PLM 商品图，英文参数图已使用示意占位图。"] if product_image is None else []


def generate_size_image(record: ProductRecord, output: Path, source_image: Image.Image | None = None) -> list[str]:
    """Generate the 1600px size image expected under 产品参数图/尺寸.jpg."""
    canvas = Image.new("RGBA", (1600, 1600), "#FFFFFF")
    draw = ImageDraw.Draw(canvas)
    draw.text((80, 74), record.brand or "PRODUCT", font=_font(74, True), fill="#1E7FB9")
    draw.rectangle((80, 210, 760, 322), outline="#182E42", width=4)
    draw.text((112, 244), (record.english_name or record.name or record.sku).upper(), font=_font(39, True), fill="#182E42")
    draw.text((110, 360), "PRODUCT DIMENSIONS", font=_font(27, True), fill="#668096")
    draw.rounded_rectangle((80, 420, 940, 1390), radius=40, fill="#F7FAFD", outline="#D9E5EE", width=3)
    product_image = _preferred_product_image(record, source_image)
    _paste_product_image(canvas, product_image, (140, 485, 810, 1240))
    _draw_dimension_arrow(draw, (160, 1315), (792, 1315), record.package_length or record.product_length, vertical=False)
    _draw_dimension_arrow(draw, (860, 520), (860, 1165), record.package_height or record.product_height, vertical=True)
    draw.text((1050, 450), "MEASUREMENTS", font=_font(34, True), fill="#1A75A8")
    measurements = [
        ("PACKAGE L × W × H", dimension_text(record.package_length, record.package_width, record.package_height)),
        ("PRODUCT L × W × H", dimension_text(record.product_length, record.product_width, record.product_height)),
        ("NET CONTENT", record.net_content),
        ("PACKAGE CODE", record.package_code),
    ]
    y = 530
    for label, value in measurements:
        draw.rounded_rectangle((1040, y, 1510, y + 150), radius=20, fill="#EAF5FB")
        draw.text((1070, y + 24), label, font=_font(21, True), fill="#6A8AA1")
        draw.multiline_text((1070, y + 68), _line_wrap(draw, value or "NEEDS MANUAL CHECK", _font(27, True), 395), font=_font(27, True), fill="#173B56", spacing=3)
        y += 172
    draw.text((80, 1518), "Dimensions are sourced from PLM. Verify physical samples before production.", font=_font(20), fill="#7890A2")
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output, quality=95, subsampling=0)
    return ["未找到本地透明.png 或可访问的 PLM 商品图，尺寸图已使用示意占位图。"] if product_image is None else []


def generate_excel(record: ProductRecord, output: Path) -> None:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Product Information"
    sheet.sheet_view.showGridLines = False
    sheet.merge_cells("A1:C1")
    sheet["A1"] = "PRODUCT INFORMATION"
    sheet["A1"].font = Font(name="Aptos Display", size=18, bold=True, color="FFFFFF")
    sheet["A1"].fill = PatternFill("solid", fgColor="0E2A45")
    sheet["A1"].alignment = Alignment(horizontal="left", vertical="center")
    sheet.row_dimensions[1].height = 34
    sheet.merge_cells("A2:C2")
    sheet["A2"] = f"PLM Assistant sync • SKU {record.sku} • generated {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    sheet["A2"].font = Font(name="Aptos", size=10, color="4E687D")
    sheet["A2"].fill = PatternFill("solid", fgColor="EAF5FB")
    sheet["A2"].alignment = Alignment(vertical="center")
    sheet.row_dimensions[2].height = 24
    sheet["A4"], sheet["B4"], sheet["C4"] = "Field", "Value", "PLM source"
    header_fill = PatternFill("solid", fgColor="1672A6")
    for cell in sheet[4]:
        cell.font = Font(name="Aptos", bold=True, color="FFFFFF")
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
    data = [
        ("SKU", record.sku, "Product / ledger"),
        ("Brand", record.brand, "Product"),
        ("Chinese product name", record.name, "Product"),
        ("English product name", record.english_name, "Product"),
        ("Finalized at", record.finalized_at, "Daily ledger"),
        ("Status", record.status, "Daily ledger"),
        ("Product type", record.product_type, "Product"),
        ("Net content", record.net_content, "Material list"),
        ("Package L × W × H", dimension_text(record.package_length, record.package_width, record.package_height), "Material list"),
        ("Product L × W × H", dimension_text(record.product_length, record.product_width, record.product_height), "Product info"),
        ("Package material code", record.package_code, "Material list"),
        ("Print material code", record.print_code, "Material list"),
        ("Purchase price", record.purchase_price, "Daily ledger"),
        ("Developer", record.developer_name, "Product"),
        ("PLM reference", record.reference_url, "Product"),
    ]
    thin = Side(style="thin", color="D8E3EC")
    for row_index, row in enumerate(data, start=5):
        for col_index, value in enumerate(row, start=1):
            cell = sheet.cell(row=row_index, column=col_index, value=value or "—")
            cell.font = Font(name="Aptos", size=11, color="173B56")
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            cell.border = Border(bottom=thin)
            if col_index == 1:
                cell.font = Font(name="Aptos", size=11, bold=True, color="24526E")
                cell.fill = PatternFill("solid", fgColor="F5F9FC")
            elif col_index == 3:
                cell.font = Font(name="Aptos", size=10, color="6E899C")
        sheet.row_dimensions[row_index].height = 28
    widths = {"A": 28, "B": 64, "C": 20}
    for column, width in widths.items():
        sheet.column_dimensions[column].width = width
    sheet.freeze_panes = "A5"
    output.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(output)


def _assistant_font(size: int) -> ImageFont.ImageFont:
    for path in (r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\ARIAL.TTF"):
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _assistant_number(value: Any) -> float:
    matched = re.search(r"\d+(?:\.\d+)?", clean_text(value))
    return float(matched.group(0)) if matched else 0.0


def _assistant_number_text(value: Any) -> str:
    return f"{_assistant_number(value):g}"


def _assistant_dimension_label(value: Any) -> str:
    return f"{_assistant_number_text(value)}cm/{(_assistant_number(value) / 2.54):.2f}".rstrip("0").rstrip(".") + "inch"


def _assistant_template_path() -> Path:
    local_copy = APP_DIR.parent / "cloudflare" / "plm-cloud-backup" / "static" / "assets" / "v1" / "excel-template.xlsx"
    for candidate in (local_copy, PLM_TEMPLATE_CACHE):
        if candidate.is_file() and candidate.stat().st_size > 1000:
            return candidate
    try:
        request = Request(PLM_EXCEL_TEMPLATE_URL, headers={"User-Agent": "PLM-Asset-Workbench/3"})
        with urlopen(request, timeout=30) as response:
            content = response.read(2 * 1024 * 1024)
        if len(content) <= 1000:
            raise WorkbenchError("PLM Excel template is incomplete")
        PLM_TEMPLATE_CACHE.parent.mkdir(parents=True, exist_ok=True)
        PLM_TEMPLATE_CACHE.write_bytes(content)
        return PLM_TEMPLATE_CACHE
    except OSError as error:
        raise WorkbenchError(f"无法获取 PLM 悬浮助手 Excel 模板：{error}") from error


def _assistant_alpha_bounds(alpha: Image.Image, x0: int, x1: int, y0: int, y1: int) -> dict[str, float] | None:
    pixels = alpha.load()
    width, height = alpha.size
    left, top, right, bottom = min(width, x1), min(height, y1), -1, -1
    for y in range(max(0, y0), min(height, y1)):
        for x in range(max(0, x0), min(width, x1)):
            if pixels[x, y] <= 12:
                continue
            left, top, right, bottom = min(left, x), min(top, y), max(right, x), max(bottom, y)
    if right < left:
        return None
    return {"left": left, "top": top, "right": right + 1, "bottom": bottom + 1, "width": right - left + 1, "height": bottom - top + 1}


def _assistant_analyse(image: Image.Image, record: ProductRecord) -> dict[str, Any]:
    source_width, source_height = image.size
    scale = min(1.0, 900 / max(source_width, source_height))
    scaled = image.resize((max(1, round(source_width * scale)), max(1, round(source_height * scale))), Image.Resampling.LANCZOS)
    alpha = scaled.getchannel("A")
    width, height = scaled.size
    if record.single_bottle:
        rect = _assistant_alpha_bounds(alpha, 0, width, 0, height)
        if not rect:
            raise WorkbenchError("透明 PNG 中没有可识别的单瓶产品")
        return {"box": None, "product": {key: value / scale for key, value in rect.items()}, "sourceWidth": source_width, "sourceHeight": source_height, "sidePixels": 0.0, "showSide": False}
    pixels = alpha.load()
    occupancy = [sum(1 for y in range(0, height, 2) if pixels[x, y] > 12) for x in range(width)]
    start, end = round(width * 0.32), round(width * 0.72)
    split = min(range(start, end), key=lambda x: occupancy[x])
    box = _assistant_alpha_bounds(alpha, 0, split, 0, height)
    product = _assistant_alpha_bounds(alpha, split, width, 0, height)
    if not box or not product:
        raise WorkbenchError("透明 PNG 需同时包含纸盒与产品；无法自动分开")
    box = {key: value / scale for key, value in box.items()}
    product = {key: value / scale for key, value in product.items()}
    front = _assistant_number(record.package_length)
    package_height = _assistant_number(record.package_height)
    expected_front = box["height"] * front / package_height if front and package_height else box["width"]
    side_pixels = max(0.0, box["width"] - expected_front)
    # The standard PLM parameter-image preset renders the front of the carton.
    # Perspective callouts remain a manual-only exception in the floating helper.
    return {"box": box, "product": product, "sourceWidth": source_width, "sourceHeight": source_height, "sidePixels": side_pixels, "showSide": False}


def _assistant_fit(analysis: dict[str, Any], area: dict[str, float]) -> dict[str, float]:
    scale = min(area["width"] / analysis["sourceWidth"], area["height"] / analysis["sourceHeight"])
    return {"scale": scale, "x": area["x"] + (area["width"] - analysis["sourceWidth"] * scale) / 2, "y": area["y"] + (area["height"] - analysis["sourceHeight"] * scale) / 2}


def _assistant_map_rect(rect: dict[str, float], fit: dict[str, float]) -> dict[str, float]:
    return {
        "left": fit["x"] + rect["left"] * fit["scale"],
        "right": fit["x"] + rect["right"] * fit["scale"],
        "top": fit["y"] + rect["top"] * fit["scale"],
        "bottom": fit["y"] + rect["bottom"] * fit["scale"],
        "width": rect["width"] * fit["scale"],
        "height": rect["height"] * fit["scale"],
    }


def _assistant_text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> float:
    return draw.textlength(text, font=font)


def _assistant_fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, start_size: int, min_size: int) -> ImageFont.ImageFont:
    for size in range(start_size, min_size - 1, -1):
        font = _assistant_font(size)
        if _assistant_text_width(draw, text, font) <= max_width:
            return font
    return _assistant_font(min_size)


def _assistant_rotated_text(image: Image.Image, position: tuple[float, float], text: str, font: ImageFont.ImageFont, angle: float) -> None:
    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    bbox = probe.textbbox((0, 0), text, font=font)
    width, height = bbox[2] - bbox[0], bbox[3] - bbox[1]
    label = Image.new("RGBA", (width + 20, height + 20), (0, 0, 0, 0))
    ImageDraw.Draw(label).text((10, 10 - bbox[1]), text, font=font, fill="#111111")
    label = label.rotate(-angle, expand=True, resample=Image.Resampling.BICUBIC)
    image.alpha_composite(label, (round(position[0] - label.width / 2), round(position[1] - label.height / 2)))


def _assistant_vertical_dimension(image: Image.Image, rect: dict[str, float], value: Any, side: str) -> None:
    if not _assistant_number(value):
        return
    draw = ImageDraw.Draw(image)
    x = rect["left"] - 36 if side == "left" else rect["right"] + 36
    draw.line((x, rect["top"], x, rect["bottom"]), fill="#111111", width=4)
    draw.line((x - 16, rect["top"], x + 16, rect["top"]), fill="#111111", width=4)
    draw.line((x - 16, rect["bottom"], x + 16, rect["bottom"]), fill="#111111", width=4)
    label, font = _assistant_dimension_label(value), _assistant_font(42)
    gap = 58 if rect["height"] > _assistant_text_width(draw, label, font) + 48 else 82
    _assistant_rotated_text(image, (x + (-gap if side == "left" else gap), (rect["top"] + rect["bottom"]) / 2), label, font, 90)


def _assistant_horizontal_dimension(image: Image.Image, rect: dict[str, float], value: Any, below: bool) -> None:
    if not _assistant_number(value):
        return
    draw = ImageDraw.Draw(image)
    y = rect["bottom"] + 36 if below else rect["top"] - 36
    draw.line((rect["left"], y, rect["right"], y), fill="#111111", width=4)
    draw.line((rect["left"], y - 16, rect["left"], y + 16), fill="#111111", width=4)
    draw.line((rect["right"], y - 16, rect["right"], y + 16), fill="#111111", width=4)
    label = _assistant_dimension_label(value)
    font = _assistant_font(42)
    gap = 20 if rect["width"] > _assistant_text_width(draw, label, font) + 48 else 38
    draw.text(((rect["left"] + rect["right"]) / 2, y + (gap if below else -gap)), label, font=font, fill="#111111", anchor="mt" if below else "mb")


def _assistant_side_dimension(image: Image.Image, rect: dict[str, float], side_pixels: float, value: Any) -> None:
    if not _assistant_number(value) or side_pixels < 8:
        return
    draw = ImageDraw.Draw(image)
    depth = min(rect["width"] * 0.3, max(30.0, side_pixels))
    x1, y1, x2, y2 = rect["left"] - 12, rect["top"] + 12, rect["left"] + depth, rect["top"] - 30
    draw.line((x1, y1, x2, y2), fill="#111111", width=4)
    draw.line((x1 - 9, y1 - 14, x1 + 9, y1 + 14), fill="#111111", width=4)
    draw.line((x2 - 9, y2 - 14, x2 + 9, y2 + 14), fill="#111111", width=4)
    _assistant_rotated_text(image, ((x1 + x2) / 2 - 12, (y1 + y2) / 2 - 60), _assistant_dimension_label(value), _assistant_font(40), -math.degrees(math.atan2(y2 - y1, x2 - x1)))


def _assistant_draw_product_module(canvas: Image.Image, source: Image.Image, analysis: dict[str, Any], record: ProductRecord, area: dict[str, float]) -> None:
    fit = _assistant_fit(analysis, area)
    layer = Image.new("RGBA", (1600, 1600), (0, 0, 0, 0))
    resized = source.resize((round(analysis["sourceWidth"] * fit["scale"]), round(analysis["sourceHeight"] * fit["scale"])), Image.Resampling.LANCZOS)
    layer.alpha_composite(resized, (round(fit["x"]), round(fit["y"])))
    box = _assistant_map_rect(analysis["box"], fit) if analysis["box"] else None
    product = _assistant_map_rect(analysis["product"], fit) if analysis["product"] else None
    if record.single_bottle and product:
        _assistant_vertical_dimension(layer, product, record.product_height, "right")
        _assistant_horizontal_dimension(layer, product, record.product_length, False)
    elif not record.single_bottle:
        if box:
            _assistant_vertical_dimension(layer, box, record.package_height, "left")
            front = {**box, "left": box["left"] + (analysis["sidePixels"] * fit["scale"] if analysis["showSide"] else 0)}
            _assistant_horizontal_dimension(layer, front, record.package_length, True)
            if analysis["showSide"]:
                _assistant_side_dimension(layer, box, analysis["sidePixels"] * fit["scale"], record.package_width)
        if product:
            _assistant_vertical_dimension(layer, product, record.product_height, "right")
            _assistant_horizontal_dimension(layer, product, record.product_length, False)
    clip_left = area.get("clipLeft")
    if clip_left:
        canvas.alpha_composite(layer.crop((round(clip_left), 0, 1600, 1600)), (round(clip_left), 0))
    else:
        canvas.alpha_composite(layer)


def _assistant_feature(record: ProductRecord) -> str:
    haystack = " ".join((record.product_type, record.name, record.english_name)).lower()
    rules = (("serum|essence", "Anti-wrinkle & glow"), ("eye cream|eye treatment", "Brightens & smooths"), ("face cream|moisturizer", "Hydrates & firms"), ("sunscreen|sun cream", "Daily UV protection"), ("body lotion|body cream", "Softens & moisturizes"), ("shampoo|conditioner", "Cleanses & nourishes"), ("capsule|supplement", "Daily nutrition support"))
    return next((phrase for pattern, phrase in rules if re.search(pattern, haystack)), "Everyday care & comfort")


def _assistant_local_brand_logo(brand: str) -> Image.Image | None:
    """Rasterize the same SVG logo asset bundled with the PLM floating helper."""
    key = re.sub(r"[^a-z0-9]", "", clean_text(brand).lower())
    source = APP_DIR.parent / "cloudflare" / "plm-cloud-backup" / "src" / "parameter-logo-assets.js"
    if not key or not source.is_file():
        return None
    try:
        text = source.read_text(encoding="utf-8")
        matched = re.search(r'"' + re.escape(key) + r'"\s*:\s*"(data:image/svg\+xml;base64,[^"]+)"', text)
        if not matched:
            return None
        svg = base64.b64decode(matched.group(1).split(",", 1)[1])
        from PySide6.QtCore import QByteArray, QBuffer, QIODevice, Qt
        from PySide6.QtGui import QImage, QPainter
        from PySide6.QtSvg import QSvgRenderer
        renderer = QSvgRenderer(QByteArray(svg))
        size = renderer.defaultSize()
        if not size.width() or not size.height():
            return None
        width = 1000
        height = max(1, round(width * size.height() / size.width()))
        image = QImage(width, height, QImage.Format.Format_RGBA8888)
        image.fill(Qt.GlobalColor.transparent)
        painter = QPainter(image)
        renderer.render(painter)
        painter.end()
        encoded = QByteArray()
        buffer = QBuffer(encoded)
        buffer.open(QIODevice.OpenModeFlag.WriteOnly)
        image.save(buffer, "PNG")
        return Image.open(io.BytesIO(bytes(encoded))).convert("RGBA")
    except Exception:
        return None


def _assistant_brand_logo(brand: str) -> Image.Image | None:
    key = clean_text(brand).lower()
    if not key:
        return None
    if key in _BRAND_LOGO_CACHE:
        return _BRAND_LOGO_CACHE[key]
    # The Worker endpoint requires the same private API key held by the browser
    # userscript.  The desktop app therefore reads its local assistant asset when
    # present and otherwise uses the exact assistant fallback (plain brand text).
    logo = _assistant_local_brand_logo(brand)
    _BRAND_LOGO_CACHE[key] = logo
    return logo


def _assistant_draw_brand_header(canvas: Image.Image, record: ProductRecord) -> None:
    logo = _assistant_brand_logo(record.brand)
    if logo:
        ratio = min(500 / logo.width, 120 / logo.height)
        logo = logo.resize((max(1, round(logo.width * ratio)), max(1, round(logo.height * ratio))), Image.Resampling.LANCZOS)
        canvas.alpha_composite(logo, (round(443 - logo.width / 2), round(240 - logo.height / 2)))
        return
    brand = clean_text(record.brand)
    if brand and not re.fullmatch(r"(?:AMZ|ODM|OEM|DOWMOO)", brand, re.I):
        draw = ImageDraw.Draw(canvas)
        draw.text((443, 240), brand, font=_assistant_fit_font(draw, brand, 500, 70, 38), fill="#080808", anchor="mm")


def _assistant_dashed_line(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int]) -> None:
    x, y = start
    while x < end[0]:
        draw.line((x, y, min(x + 8, end[0]), y), fill="#111111", width=2)
        x += 13


def generate_english_detail(record: ProductRecord, output: Path, source_image: Image.Image | None = None) -> list[str]:
    if source_image is None:
        return ["未生成英文参数图：需提供产品目录中的透明.png"]
    analysis = _assistant_analyse(source_image, record)
    canvas = Image.new("RGBA", (1600, 1600), "#FFFFFF")
    draw = ImageDraw.Draw(canvas)
    _assistant_draw_brand_header(canvas, record)
    title = clean_text(record.english_name).upper()
    draw.rectangle((75, 393, 811, 537), outline="#111111", width=4)
    draw.text((443, 465), title, font=_assistant_fit_font(draw, title, 680, 52, 26), fill="#080808", anchor="mm")
    rows = (
        ("NAME", record.english_name),
        ("NET CONTENT", record.net_content),
        ("SHELF LIFE", record.shelf_life or "3years"),
        ("STORE", "Store in a cool and dry place"),
        ("FEATURES", _assistant_feature(record)),
        ("WEIGHT", record.gross_weight),
    )
    for index, (label, value) in enumerate(rows):
        y = 709 + index * 123
        draw.rectangle((70, y, 300, y + 67), fill="#050505")
        draw.text((185, y + 34), label, font=_assistant_fit_font(draw, label, 205, 32, 20), fill="#FFFFFF", anchor="mm")
        text = clean_text(value)
        draw.text((326, y + 34), text, font=_assistant_fit_font(draw, text, 455, 34, 20), fill="#111111", anchor="lm")
        _assistant_dashed_line(draw, (303, y + 67), (785, y + 67))
    _assistant_draw_product_module(canvas, source_image, analysis, record, {"x": 960, "y": 300, "width": 470, "height": 1040, "clipLeft": 815})
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output, quality=96)
    return []


def generate_size_image(record: ProductRecord, output: Path, source_image: Image.Image | None = None) -> list[str]:
    if source_image is None:
        return ["未生成尺寸图：需提供产品目录中的透明.png"]
    analysis = _assistant_analyse(source_image, record)
    canvas = Image.new("RGBA", (1600, 1600), "#FFFFFF")
    _assistant_draw_product_module(canvas, source_image, analysis, record, {"x": 380, "y": 230, "width": 840, "height": 1080})
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output, quality=96)
    return []


def _assistant_excel_dimension(*parts: str) -> str:
    values = [_assistant_number_text(part) for part in parts if _assistant_number(part)]
    return "*".join(values) + "CM" if len(values) >= 2 else ""


def _assistant_excel_unit(value: str) -> str:
    return clean_text(value).replace(" ", "").upper()


def _assistant_excel_image(folder: Path, record: ProductRecord) -> Image.Image | None:
    for name in ("SKU.png", "SKU.jpg", "SKU.jpeg"):
        image = _load_local_image(folder / name)
        if image:
            return image
    return _download_product_image(record.sku_image_url)


def generate_excel(record: ProductRecord, output: Path, folder: Path | None = None) -> None:
    workbook = load_workbook(_assistant_template_path())
    sheet = workbook["Sheet1"] if "Sheet1" in workbook.sheetnames else workbook.active
    sheet["A4"] = record.english_name
    sheet["B4"] = record.name
    sheet["C4"] = ""
    pack_qty = clean_text(record.pack_qty).replace(" ", "")
    sheet["E4"] = pack_qty.upper() if pack_qty.upper().endswith("PCS") else pack_qty + "PCS" if pack_qty else ""
    sheet["G4"] = record.sku
    sheet["H4"] = "瓶装" if record.single_bottle else '=IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=2,"盒装",IF(LEN(J4)-LEN(SUBSTITUTE(J4,"*",""))=1,"袋装",""))'
    sheet["I4"] = "" if record.omit_product_size else _assistant_excel_dimension(record.product_length, record.product_width, record.product_height)
    sheet["J4"] = _assistant_excel_dimension(record.package_length, record.package_width, record.package_height)
    sheet["L4"] = re.sub(r"\s*(非活性成分[:：])\s*", r"\n\1", record.ingredients)
    sheet["M4"] = _assistant_excel_unit(record.net_content)
    sheet["N4"] = _assistant_excel_unit(record.gross_weight)
    sheet["O4"] = float(record.purchase_price) if re.fullmatch(r"\d+(?:\.\d+)?", clean_text(record.purchase_price)) else clean_text(record.purchase_price) or 6
    due_date = datetime.now() + timedelta(days=7)
    sheet["P4"] = f"（{due_date.year}/{due_date.month}/{due_date.day}）"
    sheet["S4"] = record.reference_url
    product_image = _assistant_excel_image(folder, record) if folder else _download_product_image(record.sku_image_url)
    if product_image:
        product_image.thumbnail((124, 124), Image.Resampling.LANCZOS)
        image_buffer = io.BytesIO()
        product_image.convert("RGB").save(image_buffer, format="JPEG", quality=94)
        excel_image = ExcelImage(image_buffer)
        excel_image.width, excel_image.height = product_image.size
        sheet.add_image(excel_image, "C4")
    output.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(output)


def generate_assets(
    record: ProductRecord,
    root: Path | str,
    options: AssetOptions,
) -> AssetResult:
    root_path = Path(root)
    folder = resolve_product_folder(root_path, record, options)
    result = AssetResult(sku=record.sku, folder=folder)
    workspace = describe_product_workspace(root_path, record, options)
    source_image = _load_local_image(workspace["transparentImage"])
    outputs: dict[str, Path] = workspace["outputs"]

    def target_for(kind: str) -> Path | None:
        target = outputs[kind]
        if target.exists() and not options.overwrite_existing:
            result.skipped_files.append(target)
            result.warnings.append(f"保留已有文件：{target.name}（勾选“允许覆盖现有输出”后才会替换）")
            return None
        return target

    if options.excel:
        output = target_for("excel")
        if output:
            generate_excel(record, output, folder)
            result.created_files.append(output)
    if options.english_detail:
        output = target_for("english")
        if output:
            if source_image is None:
                result.warnings.append("英文参数图未生成：缺少产品目录中的透明.png，请标记为手动处理。")
            else:
                result.warnings.extend(generate_english_detail(record, output, source_image))
                result.created_files.append(output)
    if options.size_image:
        output = target_for("size")
        if output:
            if source_image is None:
                result.warnings.append("尺寸图未生成：缺少产品目录中的透明.png，请标记为手动处理。")
            else:
                result.warnings.extend(generate_size_image(record, output, source_image))
                result.created_files.append(output)
    manifest = workspace["assetFolder"] / "plm-asset-manifest.json"
    manifest.parent.mkdir(parents=True, exist_ok=True)
    manifest.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "generatedAt": datetime.now().isoformat(timespec="seconds"),
                "product": asdict(record),
                "transparentImage": str(workspace["transparentImage"] or ""),
                "createdFiles": [str(path.relative_to(folder)) for path in result.created_files],
                "skippedFiles": [str(path.relative_to(folder)) for path in result.skipped_files],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    result.created_files.append(manifest)
    return result


def parse_rules(text: str) -> tuple[list[tuple[re.Pattern[str], str]], list[str]]:
    rules: list[tuple[re.Pattern[str], str]] = []
    errors: list[str] = []
    for number, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "|" not in line:
            errors.append(f"第 {number} 行缺少 | 分隔符：{raw}")
            continue
        pattern, target = (part.strip() for part in line.split("|", 1))
        if not pattern or not target:
            errors.append(f"第 {number} 行包含空值：{raw}")
            continue
        try:
            rules.append((re.compile(pattern), target))
        except re.error as error:
            errors.append(f"第 {number} 行正则无效：{error}")
    return rules, errors


def unique_path(folder: Path, name: str) -> Path:
    candidate = folder / name
    index = 2
    while candidate.exists():
        candidate = folder / f"{Path(name).stem}_{index}{Path(name).suffix}"
        index += 1
    return candidate


def extract_sku(filename: str) -> str | None:
    match = re.search(r"SKU\d{8}", filename, re.I)
    return match.group(0).upper() if match else None


def archive_image_packs(
    zip_paths: Iterable[str | Path],
    search_root: str | Path,
    rules: list[tuple[re.Pattern[str], str]],
    use_rules: bool,
    delete_zip: bool,
    progress: Callable[[str], None] | None = None,
) -> list[str]:
    """Securely unpack and rename image packs into matching product folders."""
    root = Path(search_root)
    if not root.is_dir():
        raise WorkbenchError(f"搜索根目录不存在：{root}")
    logs: list[str] = []

    def report(message: str) -> None:
        logs.append(message)
        if progress:
            progress(message)

    for raw_path in zip_paths:
        zip_path = Path(raw_path)
        report(f"━━━ {zip_path.name} ━━━")
        sku = extract_sku(zip_path.name)
        if not sku:
            report("错误：无法从文件名提取 SKU 编码")
            continue
        matches = find_target_folders(root, sku)
        if not matches:
            report(f"错误：在 {root} 下找不到含 {sku} 的产品文件夹")
            continue
        target = matches[0]
        if len(matches) > 1:
            report(f"警告：找到 {len(matches)} 个匹配文件夹，使用 {target.name}")
        extract_dir = target / "套图"
        extract_dir.mkdir(parents=True, exist_ok=True)
        success = skipped = failed = 0
        try:
            with zipfile.ZipFile(zip_path, "r") as archive:
                for info in (item for item in archive.infolist() if not item.is_dir()):
                    source_name = Path(info.filename).name
                    if not source_name:
                        continue
                    stem = Path(source_name).stem
                    suffix = Path(source_name).suffix
                    target_name = source_name
                    if use_rules:
                        renamed = next((name for pattern, name in rules if pattern.fullmatch(stem)), None)
                        if not renamed:
                            skipped += 1
                            report(f"跳过（无匹配规则）：{source_name}")
                            continue
                        target_name = renamed + suffix
                    destination = unique_path(extract_dir, target_name)
                    try:
                        with archive.open(info, "r") as source, destination.open("wb") as output:
                            shutil.copyfileobj(source, output, length=1024 * 64)
                        success += 1
                        report(f"{source_name} → {destination.name}")
                    except OSError as error:
                        failed += 1
                        report(f"解压失败：{source_name} — {error}")
        except zipfile.BadZipFile:
            report("错误：不是有效的 ZIP 文件")
            continue
        report(f"完成：成功 {success}，跳过 {skipped}，失败 {failed}")
        if delete_zip and failed == 0:
            try:
                zip_path.unlink()
                report("已删除原 ZIP")
            except OSError as error:
                report(f"删除 ZIP 失败：{error}")
    return logs
