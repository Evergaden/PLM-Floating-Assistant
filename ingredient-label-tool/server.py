from __future__ import annotations

import argparse
import json
import mimetypes
import re
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas


APP_DIR = Path(__file__).resolve().parent
REPO_ROOT = APP_DIR.parent
OUTPUT_DIR = REPO_ROOT / "output" / "pdf" / "ingredient-label"
HOST = "127.0.0.1"
DEFAULT_PORT = 8765

# These values are measured from the supplied A4 reference PDF.
PAGE_WIDTH = 595.25
PAGE_HEIGHT = 841.85
OUTER_LEFT = 53.88
OUTER_RIGHT = 538.56
OUTER_TOP_OFFSET = 71.88
BASE_OUTER_BOTTOM_OFFSET = 432.96
INNER_LEFT = 68.51
THICK_LEFT = 65.76
THICK_RIGHT = 526.68
THIN_LEFT = 66.36
THIN_RIGHT = 526.08
AMOUNT_RIGHT = 465.66
DAILY_VALUE_RIGHT = 524.94
ROW_HEIGHT = 30.84
BASE_FINAL_THICK_OFFSET = 400.08
BASE_FOOTER_OFFSET = 413.22
OTHER_INGREDIENT_EXTRA = 30.0
BODY_FONT_SIZE = 10.812
TITLE_FONT_SIZE = 24.45
MAX_ROWS = 18

_font_lock = threading.Lock()
_regular_font = "Helvetica"
_bold_font = "Helvetica-Bold"


def clean_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\r", " ").replace("\n", " ")).strip()


def safe_filename(value: object) -> str:
    name = clean_text(value) or "supplement-facts.pdf"
    name = re.sub(r'[\\/:*?"<>|\x00-\x1f]+', "-", name).strip(" .")
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    return name[:160] or "supplement-facts.pdf"


def register_fonts() -> tuple[str, str]:
    global _regular_font, _bold_font
    with _font_lock:
        if _regular_font != "Helvetica" or _bold_font != "Helvetica-Bold":
            return _regular_font, _bold_font
        candidates = [
            ("IngredientLabelArial", "Arial", Path(r"C:\Windows\Fonts\arial.ttf")),
            ("IngredientLabelArialBold", "Arial-Bold", Path(r"C:\Windows\Fonts\arialbd.ttf")),
        ]
        try:
            if candidates[0][2].is_file() and candidates[1][2].is_file():
                pdfmetrics.registerFont(TTFont(candidates[0][0], str(candidates[0][2])))
                pdfmetrics.registerFont(TTFont(candidates[1][0], str(candidates[1][2])))
                _regular_font, _bold_font = candidates[0][0], candidates[1][0]
        except (OSError, ValueError):
            _regular_font, _bold_font = "Helvetica", "Helvetica-Bold"
        return _regular_font, _bold_font


def baseline_for_top(top_offset: float, font_size: float, title: bool = False) -> float:
    # The source PDF's text matrices place the Arial glyph tops at about 79% of
    # the ReportLab font size. This keeps extracted tops aligned with the
    # supplied PDF instead of relying on CSS-style line-box assumptions.
    glyph_top_ratio = 0.79
    return PAGE_HEIGHT - top_offset - (font_size * glyph_top_ratio)


def draw_top_rect(canvas: Canvas, left: float, right: float, top_offset: float, height: float) -> None:
    canvas.rect(left, PAGE_HEIGHT - top_offset - height, right - left, height, stroke=0, fill=1)


def fit_font_size(text: str, font_name: str, preferred: float, max_width: float, minimum: float = 8.2) -> float:
    size = preferred
    while size > minimum and pdfmetrics.stringWidth(text, font_name, size) > max_width:
        size -= 0.2
    return round(max(size, minimum), 2)


def fit_ingredient_text(text: str, font_name: str, amount: str) -> tuple[str, float]:
    amount_width = pdfmetrics.stringWidth(amount, font_name, BODY_FONT_SIZE)
    max_width = max(120, min(350, AMOUNT_RIGHT - amount_width - INNER_LEFT - 8))
    size = fit_font_size(text, font_name, BODY_FONT_SIZE, max_width, 6.6)
    if pdfmetrics.stringWidth(text, font_name, size) <= max_width:
        return text, size
    ellipsis = "..."
    remaining = text
    while remaining and pdfmetrics.stringWidth(remaining + ellipsis, font_name, size) > max_width:
        remaining = remaining[:-1]
    return (remaining.rstrip() + ellipsis if remaining else ellipsis), size


def amount_to_mg(value: object) -> float:
    text = str(value or "").replace(",", "").strip().lower()
    match = re.search(r"(-?\d+(?:\.\d+)?)\s*(mg|mcg|μg|µg|ug|g|kg)?", text)
    if not match:
        return float("nan")
    amount = float(match.group(1))
    unit = match.group(2) or "mg"
    if unit == "kg":
        return amount * 1000000
    if unit == "g":
        return amount * 1000
    if unit in {"mcg", "μg", "µg", "ug"}:
        return amount / 1000
    return amount


def marker_to_mg(value: object) -> float:
    text = str(value or "").replace(",", "").strip()
    if not text:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return amount_to_mg(text)


def target_number(value: object, label: str) -> float:
    text = str(value or "").strip()
    if not text:
        return 0.0
    try:
        number = float(text)
    except ValueError as error:
        raise ValueError(f"{label} 必须是有效数字。") from error
    if number != number or number in {float("inf"), float("-inf")}:
        raise ValueError(f"{label} 必须是有效数字。")
    return number


def normalize_payload(payload: object) -> dict[str, object]:
    if not isinstance(payload, dict):
        raise ValueError("请求数据不是对象。")
    rows_value = payload.get("rows")
    if not isinstance(rows_value, list):
        raise ValueError("请至少填写一行成分信息。")
    rows: list[dict[str, str]] = []
    for row in rows_value:
        if not isinstance(row, dict):
            continue
        name = clean_text(row.get("name"))
        amount = clean_text(row.get("amount"))
        daily_value = clean_text(row.get("dailyValue"))
        marker_amount = clean_text(row.get("markerAmount"))
        if not name and not amount and not daily_value:
            continue
        if not name:
            raise ValueError("每一行都需要填写成分名称。")
        if not amount:
            raise ValueError(f"成分“{name}”缺少 Amount Per Serving。")
        amount_mg = amount_to_mg(amount)
        if not amount_mg > 0:
            raise ValueError(f"成分“{name}”的 Amount Per Serving 无法解析为有效 mg、g 或 mcg 数值。")
        if not re.search(r"\([^)]*[A-Za-z]{2,}[^)]*\)", name):
            raise ValueError(f"成分“{name}”必须在括号内写对应 Latin scientific name。")
        marker_mg = marker_to_mg(marker_amount)
        if marker_mg < 0 or marker_mg > amount_mg + 0.001:
            raise ValueError(f"成分“{name}”的标志物 mg 必须不大于该成分含量。")
        rows.append({"name": name, "amount": amount, "dailyValue": daily_value or "**", "amountMg": amount_mg, "markerAmountMg": marker_mg})
    if not rows:
        raise ValueError("请至少填写一行成分信息。")
    if len(rows) > MAX_ROWS:
        raise ValueError(f"当前单页版最多支持 {MAX_ROWS} 行成分，请拆成两张表或后续调整版式。")

    active_target = target_number(payload.get("activeTargetMg"), "活性目标")
    standardized_target = target_number(payload.get("standardizedActivePercent"), "标准化活性目标")
    if active_target < 0 or standardized_target < 0 or standardized_target > 100:
        raise ValueError("活性目标和标准化活性目标必须是有效的非负数，百分比不能超过 100。")
    active_total = sum(float(row["amountMg"]) for row in rows)
    marker_total = sum(float(row["markerAmountMg"]) for row in rows)
    standardized_percent = marker_total / active_total * 100 if active_total else 0
    if active_target and active_total + 0.001 < active_target:
        raise ValueError(f"活性合计 {active_total:.3f} mg 低于目标 {active_target:g} mg。")
    if standardized_target and standardized_percent + 0.001 < standardized_target:
        raise ValueError(f"标准化活性标志物比例 {standardized_percent:.2f}% 低于目标 {standardized_target:g}%。")
    other_ingredients = clean_text(payload.get("otherIngredients"))
    if (active_target or standardized_target) and not other_ingredients:
        raise ValueError("启用目标模式时必须填写 Other Ingredients。")

    return {
        "title": clean_text(payload.get("title")) or "Supplement Facts",
        "servingSize": clean_text(payload.get("servingSize")) or "2 Capsules",
        "servingsPerContainer": clean_text(payload.get("servingsPerContainer")) or "30",
        "filename": safe_filename(payload.get("filename")),
        "otherIngredients": other_ingredients,
        "activeTargetMg": active_target,
        "standardizedActivePercent": standardized_target,
        "computedActiveTotalMg": active_total,
        "computedStandardizedActiveMg": marker_total,
        "computedStandardizedActivePercent": standardized_percent,
        "showFooter": bool(payload.get("showFooter", True)),
        "rows": rows,
    }


def generate_pdf(payload: object, output_path: Path) -> dict[str, object]:
    data = normalize_payload(payload)
    regular_font, bold_font = register_fonts()
    rows = data["rows"]
    assert isinstance(rows, list)
    row_count = len(rows)
    row_delta = (row_count - 8) * ROW_HEIGHT
    other_ingredients = str(data["otherIngredients"] or "")
    other_delta = OTHER_INGREDIENT_EXTRA if other_ingredients else 0
    outer_bottom_offset = BASE_OUTER_BOTTOM_OFFSET + row_delta + other_delta
    final_thick_offset = BASE_FINAL_THICK_OFFSET + row_delta
    footer_offset = BASE_FOOTER_OFFSET + row_delta
    outer_top_y = PAGE_HEIGHT - OUTER_TOP_OFFSET
    outer_bottom_y = PAGE_HEIGHT - outer_bottom_offset

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas = Canvas(str(output_path), pagesize=(PAGE_WIDTH, PAGE_HEIGHT), pageCompression=1)
    canvas.setTitle(str(data["title"]))
    canvas.setAuthor("Ingredient Label Tool")
    canvas.setFillColorRGB(0, 0, 0)

    # The reference uses a 0.6 pt black outer rule.
    canvas.setLineWidth(0.6)
    canvas.rect(
        OUTER_LEFT,
        outer_bottom_y,
        OUTER_RIGHT - OUTER_LEFT,
        outer_top_y - outer_bottom_y,
        stroke=1,
        fill=0,
    )

    title = str(data["title"])
    title_size = fit_font_size(title, bold_font, TITLE_FONT_SIZE, THICK_RIGHT - 70.45, 18)
    canvas.setFont(bold_font, title_size)
    canvas.drawString(70.45, baseline_for_top(80.42, title_size, title=True), title)

    canvas.setFont(regular_font, BODY_FONT_SIZE)
    canvas.drawString(70.45, baseline_for_top(104.08, BODY_FONT_SIZE), f"Serving Size {data['servingSize']}")
    canvas.drawString(
        70.45,
        baseline_for_top(116.91, BODY_FONT_SIZE),
        f"Servings Per Container {data['servingsPerContainer']}",
    )

    draw_top_rect(canvas, THICK_LEFT, THICK_RIGHT, 129.84, 1.8)
    canvas.setFont(bold_font, BODY_FONT_SIZE)
    canvas.drawString(INNER_LEFT, baseline_for_top(139.58, BODY_FONT_SIZE), "Amount Per Serving")
    canvas.drawString(445.08, baseline_for_top(139.58, BODY_FONT_SIZE), "% Daily Value")
    draw_top_rect(canvas, THIN_LEFT, THIN_RIGHT, 153.96, 0.6)

    for index, row in enumerate(rows):
        row_top = 166.02 + (index * ROW_HEIGHT)
        name = str(row["name"])
        name, name_size = fit_ingredient_text(name, regular_font, str(row["amount"]))
        canvas.setFont(regular_font, name_size)
        canvas.drawString(INNER_LEFT, baseline_for_top(row_top, name_size), name)
        canvas.setFont(regular_font, BODY_FONT_SIZE)
        canvas.drawRightString(AMOUNT_RIGHT, baseline_for_top(row_top, BODY_FONT_SIZE), str(row["amount"]))
        canvas.drawRightString(
            DAILY_VALUE_RIGHT,
            baseline_for_top(row_top, BODY_FONT_SIZE),
            str(row["dailyValue"]),
        )
        if index < row_count - 1:
            draw_top_rect(canvas, THIN_LEFT, THIN_RIGHT, 184.80 + (index * ROW_HEIGHT), 0.6)

    draw_top_rect(canvas, THICK_LEFT, THICK_RIGHT, final_thick_offset, 1.8)
    if bool(data["showFooter"]):
        canvas.setFont(regular_font, BODY_FONT_SIZE)
        canvas.drawString(INNER_LEFT, baseline_for_top(footer_offset, BODY_FONT_SIZE), "**Daily Value not established.")
    if other_ingredients:
        other_font_size = fit_font_size(
            "Other Ingredients: " + other_ingredients,
            regular_font,
            8.6,
            THICK_RIGHT - INNER_LEFT - 8,
            6.6,
        )
        canvas.setFont(regular_font, other_font_size)
        canvas.drawString(
            INNER_LEFT,
            baseline_for_top(footer_offset + 14, other_font_size),
            "Other Ingredients: " + other_ingredients,
        )

    canvas.showPage()
    canvas.save()
    return {
        "filename": str(data["filename"]),
        "rows": row_count,
        "path": str(output_path),
        "labelHeight": round(outer_bottom_offset - OUTER_TOP_OFFSET, 2),
        "activeTotalMg": round(float(data["computedActiveTotalMg"]), 3),
        "standardizedActivePercent": round(float(data["computedStandardizedActivePercent"]), 2),
    }


SAMPLE_PAYLOAD = {
    "title": "Supplement Facts",
    "servingSize": "2 Capsules",
    "servingsPerContainer": "30",
    "filename": "supplement-facts.pdf",
    "showFooter": True,
    "rows": [
        {"name": "Vitamin B6 (Pyridoxinum hydrochloridum)", "amount": "10 mg", "dailyValue": "588%", "markerAmount": "10"},
        {"name": "Vitamin D3 (Cholecalciferol)", "amount": "25 mcg", "dailyValue": "125%"},
        {"name": "Zinc (Zincum gluconas)", "amount": "15 mg", "dailyValue": "136%", "markerAmount": "15"},
        {"name": "Selenium (Selenium)", "amount": "50 mcg", "dailyValue": "91%", "markerAmount": "0.05"},
        {"name": "Boron (Boron)", "amount": "3 mg", "dailyValue": "**", "markerAmount": "3"},
        {"name": "Shilajit Extract (Asphaltum punjabianum)", "amount": "687 mg", "dailyValue": "**"},
        {"name": "Maca Root Extract (Lepidium meyenii Root Extract)", "amount": "50 mg", "dailyValue": "**"},
        {"name": "Ginseng Extract (Panax ginseng Root Extract)", "amount": "50 mg", "dailyValue": "**"},
    ],
}


class RequestHandler(BaseHTTPRequestHandler):
    server_version = "IngredientLabelTool/0.1"

    def log_message(self, format: str, *args: object) -> None:
        print(f"[{self.log_date_time_string()}] {format % args}")

    def _send_bytes(self, status: int, content_type: str, body: bytes, headers: dict[str, str] | None = None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status: int, payload: dict[str, object]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self._send_bytes(status, "application/json; charset=utf-8", body)

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        parsed = urlparse(self.path)
        if parsed.path in {"/", "/index.html"}:
            self._serve_static("index.html")
            return
        if parsed.path in {"/app.js", "/styles.css"}:
            self._serve_static(parsed.path.lstrip("/"))
            return
        if parsed.path == "/api/download":
            filename = safe_filename(parse_qs(parsed.query).get("name", [""])[0])
            target = OUTPUT_DIR / filename
            if not target.is_file():
                self._send_json(404, {"ok": False, "error": "文件不存在，请先生成。"})
                return
            body = target.read_bytes()
            encoded_filename = quote(filename)
            self._send_bytes(
                200,
                "application/pdf",
                body,
                {
                    "Content-Disposition": (
                        f'attachment; filename="supplement-facts.pdf"; '
                        f"filename*=UTF-8''{encoded_filename}"
                    )
                },
            )
            return
        self._send_json(404, {"ok": False, "error": "Not found"})

    def _serve_static(self, filename: str) -> None:
        target = APP_DIR / filename
        if not target.is_file():
            self._send_json(404, {"ok": False, "error": "静态文件不存在。"})
            return
        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        self._send_bytes(200, f"{content_type}; charset=utf-8", target.read_bytes())

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        if urlparse(self.path).path != "/api/generate":
            self._send_json(404, {"ok": False, "error": "Not found"})
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > 1_000_000:
                raise ValueError("请求内容为空或过大。")
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            data = normalize_payload(payload)
            output_path = OUTPUT_DIR / str(data["filename"])
            result = generate_pdf(data, output_path)
            download_name = quote(str(result["filename"]))
            self._send_json(200, {"ok": True, "downloadUrl": f"/api/download?name={download_name}", **result})
        except Exception as error:  # keep validation errors visible in the small local tool
            self._send_json(400, {"ok": False, "error": str(error)})


def run_server(port: int, open_browser: bool) -> None:
    httpd = ThreadingHTTPServer((HOST, port), RequestHandler)
    url = f"http://{HOST}:{port}/"
    print(f"Ingredient Label Tool: {url}")
    print("按 Ctrl+C 停止。")
    if open_browser:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")
    finally:
        httpd.server_close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Local Supplement Facts PDF generator")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--open", action="store_true", help="启动后打开浏览器")
    parser.add_argument("--sample", action="store_true", help="生成参考数据 PDF 后退出")
    args = parser.parse_args()
    if args.sample:
        output = OUTPUT_DIR / "supplement-facts-sample.pdf"
        result = generate_pdf(SAMPLE_PAYLOAD, output)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    run_server(args.port, args.open)


if __name__ == "__main__":
    main()
