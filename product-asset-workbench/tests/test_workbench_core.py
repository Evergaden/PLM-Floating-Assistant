# -*- coding: utf-8 -*-
import json
import tempfile
import unittest
from pathlib import Path

from openpyxl import load_workbook
from PIL import Image

from workbench_core import AssetOptions, ProductRecord, describe_product_workspace, generate_assets, parse_rules


class WorkbenchCoreTests(unittest.TestCase):
    def setUp(self):
        self.record = ProductRecord(
            sku="SKU00044974",
            brand="ACME",
            name="舒缓乳霜",
            english_name="Soothing Body Cream",
            finalized_at="2026-07-23 14:30",
            package_length="12",
            package_width="6",
            package_height="18",
            product_length="11",
            product_width="5",
            product_height="17",
            net_content="200 g",
            gross_weight="240 g",
            ingredients="Water, Glycerin",
            package_code="PKG-001",
        )

    def test_generates_the_selected_assets_and_manifest(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            product_folder = root / "ACME 舒缓乳霜 SKU00044974"
            product_folder.mkdir()
            Image.new("RGBA", (800, 1200), (10, 120, 180, 255)).save(product_folder / "透明.png")
            result = generate_assets(
                self.record,
                root,
                AssetOptions(),
            )
            asset_folder = result.folder / "套图" / result.folder.name
            workbook_path = result.folder / "套图" / f"{result.folder.name}.xlsx"
            english_path = asset_folder / "英文参数图" / "英文参数图.jpg"
            size_path = asset_folder / "产品参数图" / "尺寸.jpg"
            manifest_path = asset_folder / "plm-asset-manifest.json"
            self.assertTrue(workbook_path.is_file())
            self.assertTrue(english_path.is_file())
            self.assertTrue(size_path.is_file())
            self.assertTrue(manifest_path.is_file())
            workbook = load_workbook(workbook_path, data_only=False)
            self.assertEqual(workbook.active["A4"].value, "Soothing Body Cream")
            self.assertEqual(workbook.active["G4"].value, "SKU00044974")
            with Image.open(english_path) as english_image:
                self.assertEqual(english_image.size, (1600, 1600))
            with Image.open(size_path) as size_image:
                self.assertEqual(size_image.size, (1600, 1600))
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(manifest["product"]["sku"], "SKU00044974")
            self.assertEqual(Path(manifest["transparentImage"]).name, "透明.png")

    def test_preview_follows_the_existing_product_workspace_convention(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            product_folder = root / "ACME 舒缓乳霜 SKU00044974"
            product_folder.mkdir()
            Image.new("RGBA", (800, 1200), (10, 120, 180, 255)).save(product_folder / "透明.png")
            preview = describe_product_workspace(root, self.record, AssetOptions())
            self.assertEqual(preview["productFolder"], product_folder)
            self.assertEqual(preview["transparentImage"], product_folder / "透明.png")
            self.assertEqual(preview["outputs"]["excel"], product_folder / "套图" / "ACME 舒缓乳霜 SKU00044974.xlsx")
            self.assertEqual(preview["outputs"]["english"].name, "英文参数图.jpg")
            self.assertEqual(preview["outputs"]["size"].name, "尺寸.jpg")

    def test_rules_support_regex_and_report_invalid_lines(self):
        rules, errors = parse_rules("^main$|主图1\nnot-a-rule\n[|broken")
        self.assertEqual(len(rules), 1)
        self.assertEqual(len(errors), 2)


if __name__ == "__main__":
    unittest.main()
