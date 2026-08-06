# -*- coding: utf-8 -*-
"""Polished desktop front-end for Product Asset Workbench."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Callable

try:
    from PySide6.QtCore import QThread, Qt, QUrl, Signal
    from PySide6.QtGui import QDesktopServices
    from PySide6.QtWidgets import (
        QApplication, QAbstractItemView, QCheckBox, QFileDialog, QFrame,
        QGridLayout, QGroupBox, QHBoxLayout, QHeaderView, QLabel, QLineEdit,
        QListWidget, QListWidgetItem, QMainWindow, QMessageBox, QPushButton,
        QSizePolicy, QSpacerItem, QSplitter, QTabWidget, QTableWidget,
        QTableWidgetItem, QTextEdit, QVBoxLayout, QWidget,
    )
except ModuleNotFoundError:
    print("缺少桌面界面依赖。请双击 启动.bat，或执行：python -m pip install -r requirements.txt")
    raise SystemExit(1)

from workbench_core import (
    DEFAULT_CONFIG, RULES_FILE, AssetOptions, ProductRecord, archive_image_packs,
    describe_product_workspace, fetch_finalized_products, generate_assets, load_config,
    parse_rules, save_config,
)


APP_STYLE = """
* { font-family: "Microsoft YaHei", "Segoe UI", sans-serif; }
QMainWindow, QWidget#canvas { background: #F4F7FB; color: #172B4D; }
QFrame#header { background: #112B46; border: 0; }
QLabel#eyebrow { color:#8EC9E9; font-size:11px; font-weight:700; letter-spacing:1px; }
QLabel#title { color:#FFFFFF; font-size:27px; font-weight:800; }
QLabel#subtitle { color:#BED2E2; font-size:12px; }
QLabel#connection { background:#1F5B58; color:#B9F4D6; border-radius:12px; padding:6px 11px; font-size:11px; font-weight:700; }
QTabWidget::pane { border:none; background:transparent; }
QTabBar::tab { background:transparent; color:#61768B; padding:12px 20px; margin-right:4px; border-bottom:3px solid transparent; font-weight:700; }
QTabBar::tab:selected { color:#1672A6; border-bottom-color:#1672A6; }
QFrame#card, QGroupBox { background:#FFFFFF; border:1px solid #E2EAF2; border-radius:14px; }
QGroupBox { margin-top:13px; padding:14px 10px 10px; font-weight:700; color:#294762; }
QGroupBox::title { subcontrol-origin:margin; left:12px; padding:0 5px; }
QLabel#sectionTitle { color:#173B56; font-size:17px; font-weight:800; }
QLabel#muted, QLabel#fieldLabel { color:#70859A; font-size:11px; }
QLineEdit, QTextEdit, QListWidget, QTableWidget { background:#FFFFFF; border:1px solid #D7E2EC; border-radius:8px; color:#173B56; selection-background-color:#CAE9F8; }
QLineEdit { padding:8px 10px; min-height:20px; }
QLineEdit:focus, QTextEdit:focus { border:2px solid #64B4DF; }
QTextEdit { padding:8px; }
QPushButton { background:#EDF3F8; color:#31546D; border:0; border-radius:8px; padding:8px 13px; font-weight:700; min-height:19px; }
QPushButton:hover { background:#DDECF5; }
QPushButton:disabled { color:#9BABBA; background:#EFF3F6; }
QPushButton#primary { background:#1672A6; color:#FFFFFF; }
QPushButton#primary:hover { background:#0C5F8F; }
QCheckBox { color:#426077; spacing:7px; }
QCheckBox::indicator { width:17px; height:17px; border:1px solid #B8C8D6; border-radius:4px; background:#FFFFFF; }
QCheckBox::indicator:checked { background:#1672A6; border-color:#1672A6; }
QTableWidget { gridline-color:#EDF2F6; border-radius:10px; alternate-background-color:#F8FBFD; }
QTableWidget::item { padding:8px 7px; border-bottom:1px solid #EDF2F6; }
QTableWidget::item:selected { background:#E2F2FA; color:#173B56; }
QHeaderView::section { background:#F3F7FA; color:#62798E; border:0; border-bottom:1px solid #DDE7EF; padding:10px 7px; font-size:11px; font-weight:800; }
QListWidget::item { padding:8px; border-bottom:1px solid #EEF3F6; }
QTextEdit#log { background:#102B43; color:#D4E7F5; border:0; border-radius:10px; font-family:Consolas, "Microsoft YaHei"; font-size:11px; }
QLabel#metric { background:#EFF8FD; color:#1672A6; padding:7px 11px; border-radius:12px; font-weight:800; }
"""


class FunctionWorker(QThread):
    progress = Signal(str)
    succeeded = Signal(object)
    failed = Signal(str)

    def __init__(self, function: Callable[[Callable[[str], None]], Any], parent=None):
        super().__init__(parent)
        self.function = function

    def run(self):
        try:
            self.succeeded.emit(self.function(self.progress.emit))
        except Exception as error:
            self.failed.emit(str(error))


class ZipDropList(QListWidget):
    files_dropped = Signal(list)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAcceptDrops(True)
        self.setDragDropMode(QAbstractItemView.DragDropMode.DropOnly)

    def dragEnterEvent(self, event):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()
        else:
            event.ignore()

    def dragMoveEvent(self, event):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()
        else:
            event.ignore()

    def dropEvent(self, event):
        paths = [url.toLocalFile() for url in event.mimeData().urls() if url.toLocalFile().lower().endswith(".zip")]
        if paths:
            self.files_dropped.emit(paths)
            event.acceptProposedAction()
        else:
            event.ignore()


class AssetWorkbench(QMainWindow):
    def __init__(self):
        super().__init__()
        self.config = load_config()
        self.products: list[ProductRecord] = []
        self.generated_skus: set[str] = set()
        self.manual_skus: set[str] = set()
        self.selected_skus: set[str] = set()
        self.zip_paths: list[str] = []
        self.worker: FunctionWorker | None = None
        self.setWindowTitle("Product Asset Workbench")
        self.setMinimumSize(1080, 720)
        self.resize(1370, 900)
        self.build_ui()
        self.apply_config()

    def build_ui(self):
        canvas = QWidget()
        canvas.setObjectName("canvas")
        self.setCentralWidget(canvas)
        root = QVBoxLayout(canvas)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)
        root.addWidget(self.build_header())
        self.tabs = QTabWidget()
        self.tabs.setDocumentMode(True)
        self.tabs.setContentsMargins(22, 14, 22, 20)
        self.tabs.addTab(self.build_queue_tab(), "定稿队列")
        self.tabs.addTab(self.build_pack_tab(), "图包归档")
        self.tabs.addTab(self.build_help_tab(), "使用说明")
        root.addWidget(self.tabs, 1)

    def build_header(self):
        header = QFrame()
        header.setObjectName("header")
        layout = QHBoxLayout(header)
        layout.setContentsMargins(30, 19, 30, 19)
        mark = QLabel("PA")
        mark.setAlignment(Qt.AlignmentFlag.AlignCenter)
        mark.setFixedSize(48, 48)
        mark.setStyleSheet("background:#1B7AAD;color:#FFFFFF;border-radius:14px;font-size:17px;font-weight:900;")
        layout.addWidget(mark)
        copy = QVBoxLayout()
        eyebrow = QLabel("PLM CONNECTED PRODUCTION DESK")
        eyebrow.setObjectName("eyebrow")
        title = QLabel("Product Asset Workbench")
        title.setObjectName("title")
        subtitle = QLabel("把已定稿的 PLM 产品整理成可批量交付的资料、英文详情图、尺寸图与图包")
        subtitle.setObjectName("subtitle")
        copy.addWidget(eyebrow)
        copy.addWidget(title)
        copy.addWidget(subtitle)
        layout.addLayout(copy)
        layout.addStretch(1)
        self.connection_label = QLabel("等待同步")
        self.connection_label.setObjectName("connection")
        layout.addWidget(self.connection_label, alignment=Qt.AlignmentFlag.AlignTop)
        return header

    @staticmethod
    def card():
        card = QFrame()
        card.setObjectName("card")
        return card

    def field(self, label, line_edit, browse=None):
        box = QWidget()
        layout = QVBoxLayout(box)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(4)
        caption = QLabel(label)
        caption.setObjectName("fieldLabel")
        layout.addWidget(caption)
        row = QHBoxLayout()
        row.setContentsMargins(0, 0, 0, 0)
        row.setSpacing(6)
        row.addWidget(line_edit, 1)
        if browse:
            button = QPushButton("浏览")
            button.setFixedWidth(58)
            button.clicked.connect(browse)
            row.addWidget(button)
        layout.addLayout(row)
        return box

    def build_queue_tab(self):
        tab = QWidget()
        outer = QVBoxLayout(tab)
        outer.setContentsMargins(0, 0, 0, 0)
        outer.setSpacing(12)

        connect_card = self.card()
        connect_layout = QGridLayout(connect_card)
        connect_layout.setContentsMargins(18, 15, 18, 15)
        connect_layout.setHorizontalSpacing(13)
        connect_layout.setVerticalSpacing(10)
        self.backup_key_input = QLineEdit()
        self.backup_key_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.backup_key_input.setPlaceholderText("与 PLM 助手“云备份”中完全相同的密钥")
        self.backup_url_input = QLineEdit()
        self.asset_root_input = QLineEdit()
        self.folder_pattern_input = QLineEdit()
        self.existing_folder_check = QCheckBox("优先使用根目录下已有同 SKU 文件夹")
        connect_layout.addWidget(self.field("PLM 云备份密钥", self.backup_key_input), 0, 0, 1, 2)
        connect_layout.addWidget(self.field("资产输出/产品文件夹根目录", self.asset_root_input, self.choose_asset_root), 0, 2, 1, 3)
        connect_layout.addWidget(self.field("新建文件夹命名", self.folder_pattern_input), 1, 0, 1, 2)
        connect_layout.addWidget(self.existing_folder_check, 1, 2, 1, 2, alignment=Qt.AlignmentFlag.AlignBottom)
        self.sync_button = QPushButton("↻  同步已定稿产品")
        self.sync_button.setObjectName("primary")
        self.sync_button.clicked.connect(self.sync_products)
        connect_layout.addWidget(self.sync_button, 1, 4, alignment=Qt.AlignmentFlag.AlignBottom)
        outer.addWidget(connect_card)

        queue_card = self.card()
        queue = QVBoxLayout(queue_card)
        queue.setContentsMargins(18, 15, 18, 16)
        queue.setSpacing(10)
        top = QHBoxLayout()
        copy = QVBoxLayout()
        heading = QLabel("已定稿生产队列")
        heading.setObjectName("sectionTitle")
        copy.addWidget(heading)
        description = QLabel("所有已定稿 SKU 会先列出预览；“手动”可标记不参与批量生成，缺少透明图或参数会自动提示。")
        description.setObjectName("muted")
        copy.addWidget(description)
        top.addLayout(copy)
        top.addStretch(1)
        self.product_count = QLabel("0 个产品")
        self.product_count.setObjectName("metric")
        top.addWidget(self.product_count)
        queue.addLayout(top)

        controls = QHBoxLayout()
        self.filter_input = QLineEdit()
        self.filter_input.setPlaceholderText("筛选 SKU、品牌或产品名…")
        self.filter_input.setClearButtonEnabled(True)
        self.filter_input.textChanged.connect(self.populate_table)
        controls.addWidget(self.filter_input, 1)
        select_all = QPushButton("全选当前")
        select_all.clicked.connect(lambda: self.set_visible_selection(True))
        clear_all = QPushButton("取消选择")
        clear_all.clicked.connect(lambda: self.set_visible_selection(False))
        controls.addWidget(select_all)
        controls.addWidget(clear_all)
        queue.addLayout(controls)

        assets = QHBoxLayout()
        asset_label = QLabel("本次生成")
        asset_label.setObjectName("fieldLabel")
        assets.addWidget(asset_label)
        self.excel_check = QCheckBox("PLM 原版 Excel")
        self.english_check = QCheckBox("英文参数图")
        self.size_check = QCheckBox("尺寸图")
        self.overwrite_check = QCheckBox("允许覆盖已有输出")
        for check in (self.excel_check, self.english_check, self.size_check):
            check.setChecked(True)
            assets.addWidget(check)
        assets.addWidget(self.overwrite_check)
        assets.addStretch(1)
        queue.addLayout(assets)

        self.product_table = QTableWidget(0, 10)
        self.product_table.setHorizontalHeaderLabels(["生成", "手动", "SKU", "产品", "透明图", "定稿时间", "英文名", "包装尺寸", "输出预览", "状态"])
        self.product_table.setAlternatingRowColors(True)
        self.product_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.product_table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.product_table.verticalHeader().setVisible(False)
        self.product_table.itemChanged.connect(self.on_table_item_changed)
        header = self.product_table.horizontalHeader()
        for index in range(10):
            header.setSectionResizeMode(index, QHeaderView.ResizeMode.ResizeToContents)
        header.setSectionResizeMode(3, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(8, QHeaderView.ResizeMode.Stretch)
        queue.addWidget(self.product_table, 1)
        actions = QHBoxLayout()
        self.selection_label = QLabel("尚未选择产品")
        self.selection_label.setObjectName("muted")
        actions.addWidget(self.selection_label)
        actions.addStretch(1)
        open_root = QPushButton("打开根目录")
        open_root.clicked.connect(self.open_asset_root)
        self.generate_button = QPushButton("✦  批量生成所选资产")
        self.generate_button.setObjectName("primary")
        self.generate_button.clicked.connect(self.generate_selected)
        actions.addWidget(open_root)
        actions.addWidget(self.generate_button)
        queue.addLayout(actions)
        outer.addWidget(queue_card, 1)

        self.log = QTextEdit()
        self.log.setObjectName("log")
        self.log.setReadOnly(True)
        self.log.setFixedHeight(133)
        self.log.append("准备就绪：配置 PLM 云备份密钥后，点击“同步已定稿产品”。")
        outer.addWidget(self.log)
        return tab

    def build_pack_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)
        card = self.card()
        inside = QVBoxLayout(card)
        inside.setContentsMargins(18, 15, 18, 16)
        title = QLabel("图包归档")
        title.setObjectName("sectionTitle")
        inside.addWidget(title)
        help_text = QLabel("拖入 ZIP 或点击添加。图包文件名需要带 SKU，例如：主图_SKU00044974.zip。")
        help_text.setObjectName("muted")
        inside.addWidget(help_text)
        tools = QHBoxLayout()
        for text, slot in (("+ 添加 ZIP", self.choose_zips), ("移除选中", self.remove_selected_zips), ("清空", self.clear_zips)):
            button = QPushButton(text)
            button.clicked.connect(slot)
            tools.addWidget(button)
        tools.addStretch(1)
        inside.addLayout(tools)
        self.zip_list = ZipDropList()
        self.zip_list.setMinimumHeight(150)
        self.zip_list.files_dropped.connect(self.add_zips)
        inside.addWidget(self.zip_list)
        layout.addWidget(card)

        split = QSplitter(Qt.Orientation.Horizontal)
        options = QGroupBox("归档选项")
        option_layout = QVBoxLayout(options)
        self.pack_root_input = QLineEdit()
        option_layout.addWidget(self.field("搜索根目录", self.pack_root_input, self.choose_pack_root))
        self.pack_rules_check = QCheckBox("应用命名规则（无匹配项不解压）")
        self.delete_zip_check = QCheckBox("全部成功后删除原 ZIP")
        option_layout.addWidget(self.pack_rules_check)
        option_layout.addWidget(self.delete_zip_check)
        option_layout.addStretch(1)
        run = QPushButton("▶  开始归档")
        run.setObjectName("primary")
        run.clicked.connect(self.archive_packs)
        option_layout.addWidget(run)
        split.addWidget(options)
        rules = QGroupBox("重命名规则（正则 | 新名称）")
        rules_layout = QVBoxLayout(rules)
        self.rules_text = QTextEdit()
        self.rules_text.setPlaceholderText("^input-main-prompt-1-.+$|主图1")
        rules_layout.addWidget(self.rules_text)
        save_button = QPushButton("保存规则")
        save_button.clicked.connect(self.save_rules_file)
        rules_layout.addWidget(save_button, alignment=Qt.AlignmentFlag.AlignRight)
        split.addWidget(rules)
        split.setSizes([400, 920])
        layout.addWidget(split, 1)
        return tab

    def build_help_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.setContentsMargins(0, 0, 0, 0)
        card = self.card()
        inside = QVBoxLayout(card)
        inside.setContentsMargins(28, 25, 28, 25)
        heading = QLabel("第一次使用，只需要完成这三步")
        heading.setObjectName("sectionTitle")
        inside.addWidget(heading)
        text = QLabel(
            "<b>1. 在 PLM 浮动助手中开启云备份。</b>进入“云备份”，填写一个自己的备份密钥并点击上传。<br><br>"
            "<b>2. 在这里粘贴同一个密钥。</b>选择产品文件夹根目录，点击“同步已定稿产品”。系统不使用 PLM 登录密码或浏览器 Cookie。<br><br>"
            "<b>3. 先检查预览。</b>每个 SKU 都会标出本地 <code>透明.png</code>、缺失字段和目标目录；勾选“手动”可保留该 SKU 供你单独处理。<br><br>"
            "输出结构与现有产品文件夹一致：Excel 写到 <code>产品/套图</code>，英文图写到 <code>产品/套图/产品名 SKU/英文参数图/英文参数图.jpg</code>，尺寸图写到 <code>…/产品参数图/尺寸.jpg</code>。<br><br>"
            "Excel 直接复用 PLM 悬浮助手的原版模板、字段和公式；英文参数图与尺寸图复用同一套参数图排版，必须使用产品根目录的 <code>透明.png</code>。已有输出默认不会覆盖，确认后再勾选“允许覆盖已有输出”。"
        )
        text.setWordWrap(True)
        text.setTextFormat(Qt.TextFormat.RichText)
        text.setStyleSheet("font-size:14px;line-height:1.7;color:#34546B;")
        inside.addWidget(text)
        inside.addStretch(1)
        layout.addWidget(card, 1)
        return tab

    def apply_config(self):
        self.backup_key_input.setText(str(self.config.get("backup_key", "")))
        self.backup_url_input.setText(str(self.config.get("backup_url", DEFAULT_CONFIG["backup_url"])))
        self.asset_root_input.setText(str(self.config.get("asset_root", "")))
        self.pack_root_input.setText(str(self.config.get("asset_root", "")))
        self.folder_pattern_input.setText(str(self.config.get("folder_pattern", "{sku}_{brand}_{name}")))
        self.existing_folder_check.setChecked(bool(self.config.get("use_existing_folders", True)))
        self.pack_rules_check.setChecked(bool(self.config.get("use_rules", True)))
        self.delete_zip_check.setChecked(bool(self.config.get("delete_zip", False)))
        try:
            self.rules_text.setPlainText(RULES_FILE.read_text(encoding="utf-8"))
        except OSError:
            self.rules_text.clear()

    def save_current_config(self):
        self.config.update({
            "backup_key": self.backup_key_input.text().strip(),
            "backup_url": self.backup_url_input.text().strip() or DEFAULT_CONFIG["backup_url"],
            "asset_root": self.asset_root_input.text().strip(),
            "folder_pattern": self.folder_pattern_input.text().strip() or "{sku}_{brand}_{name}",
            "use_existing_folders": self.existing_folder_check.isChecked(),
            "use_rules": self.pack_rules_check.isChecked(),
            "delete_zip": self.delete_zip_check.isChecked(),
        })
        save_config(self.config)

    def choose_asset_root(self):
        selected = QFileDialog.getExistingDirectory(self, "选择产品文件夹根目录", self.asset_root_input.text() or str(Path.home()))
        if selected:
            self.asset_root_input.setText(selected)
            self.pack_root_input.setText(selected)

    def choose_pack_root(self):
        selected = QFileDialog.getExistingDirectory(self, "选择搜索根目录", self.pack_root_input.text() or str(Path.home()))
        if selected:
            self.pack_root_input.setText(selected)
            self.asset_root_input.setText(selected)

    def add_log(self, message):
        self.log.append(message)
        self.log.verticalScrollBar().setValue(self.log.verticalScrollBar().maximum())

    def run_worker(self, function, success):
        if self.worker and self.worker.isRunning():
            return
        self.worker = FunctionWorker(function, self)
        self.worker.progress.connect(self.add_log)
        self.worker.succeeded.connect(success)
        self.worker.failed.connect(self.worker_failed)
        self.worker.finished.connect(self.worker_finished)
        self.set_busy(True)
        self.worker.start()

    def set_busy(self, busy):
        self.sync_button.setDisabled(busy)
        self.generate_button.setDisabled(busy)
        self.connection_label.setText("处理中…" if busy else ("PLM 已同步" if self.products else "等待同步"))

    def worker_failed(self, message):
        self.add_log(f"✕ {message}")
        QMessageBox.warning(self, "操作未完成", message)

    def worker_finished(self):
        self.set_busy(False)

    def sync_products(self):
        self.save_current_config()
        self.add_log("正在读取 PLM 助手云备份中的已定稿记录…")

        def task(progress):
            progress("连接云备份…")
            products, updated_at = fetch_finalized_products(self.config["backup_key"], self.config["backup_url"])
            progress(f"读取完成：{len(products)} 个已定稿产品")
            return products, updated_at

        self.run_worker(task, self.sync_complete)

    def sync_complete(self, result):
        self.products, updated_at = result
        self.generated_skus.clear()
        self.selected_skus.clear()
        self.manual_skus.clear()
        self.populate_table()
        self.connection_label.setText("PLM 已同步")
        self.add_log(f"✓ 已同步 {len(self.products)} 个已定稿产品" + (f"（云端更新：{updated_at}）" if updated_at else ""))
        if not self.products:
            QMessageBox.information(self, "没有可生成的产品", "备份已连通，但其中没有“已定稿”记录。请先在 PLM 助手的今日工作台完成定稿。")

    def visible_products(self):
        query = self.filter_input.text().strip().lower()
        return [item for item in self.products if not query or query in " ".join((item.sku, item.brand, item.name, item.english_name)).lower()]

    def populate_table(self):
        visible = self.visible_products()
        root = self.asset_root_input.text().strip()
        preview_options = AssetOptions(
            use_existing_folders=self.existing_folder_check.isChecked(),
            folder_pattern=self.folder_pattern_input.text().strip() or "{sku}_{brand}_{name}",
        )
        self.product_table.blockSignals(True)
        self.product_table.setRowCount(len(visible))
        for row, record in enumerate(visible):
            choice = QTableWidgetItem()
            choice.setFlags(Qt.ItemFlag.ItemIsEnabled | Qt.ItemFlag.ItemIsUserCheckable | Qt.ItemFlag.ItemIsSelectable)
            choice.setCheckState(Qt.CheckState.Checked if record.sku in self.selected_skus else Qt.CheckState.Unchecked)
            choice.setData(Qt.ItemDataRole.UserRole, record.sku)
            self.product_table.setItem(row, 0, choice)
            manual = QTableWidgetItem()
            manual.setFlags(Qt.ItemFlag.ItemIsEnabled | Qt.ItemFlag.ItemIsUserCheckable | Qt.ItemFlag.ItemIsSelectable)
            manual.setCheckState(Qt.CheckState.Checked if record.sku in self.manual_skus else Qt.CheckState.Unchecked)
            manual.setData(Qt.ItemDataRole.UserRole, record.sku)
            manual.setToolTip("勾选后仅保留在预览中，不纳入本次自动生成")
            self.product_table.setItem(row, 1, manual)
            preview = describe_product_workspace(root, record, preview_options) if root else None
            transparent_text = preview["transparentImage"].name if preview and preview["transparentImage"] else "缺少透明.png"
            output_text = "未设置根目录"
            status = "已生成" if record.sku in self.generated_skus else record.status
            if preview:
                outputs = preview["outputs"]
                output_text = "Excel → 套图\n英文/尺寸 → 套图\\" + preview["assetFolder"].name
                missing = preview["missing"]
                existing = [label for label, exists in preview["existing"].items() if exists]
                if record.sku in self.manual_skus:
                    status = "手动处理"
                elif missing:
                    status = "需人工：" + "、".join(missing)
                elif existing:
                    status = "已有：" + "、".join(existing)
                else:
                    status = "可自动生成"
            values = [
                record.sku,
                record.display_name + (f"\n{record.english_name}" if record.english_name else ""),
                transparent_text, record.finalized_at or "—", record.english_name or "缺少英文名",
                record.dimensions or "缺少包装尺寸", output_text, status,
            ]
            for col, value in enumerate(values, 2):
                item = QTableWidgetItem(value)
                item.setData(Qt.ItemDataRole.UserRole, record.sku)
                item.setToolTip(value)
                self.product_table.setItem(row, col, item)
            self.product_table.setRowHeight(row, 58)
        self.product_table.blockSignals(False)
        self.product_count.setText(f"{len(visible)} / {len(self.products)} 个产品")
        self.update_selection_label()

    def on_table_item_changed(self, item):
        sku = item.data(Qt.ItemDataRole.UserRole)
        if not sku:
            return
        if item.column() == 0:
            if item.checkState() == Qt.CheckState.Checked:
                self.selected_skus.add(sku)
            else:
                self.selected_skus.discard(sku)
            self.update_selection_label()
        elif item.column() == 1:
            if item.checkState() == Qt.CheckState.Checked:
                self.manual_skus.add(sku)
            else:
                self.manual_skus.discard(sku)
            self.populate_table()
            self.update_selection_label()

    def set_visible_selection(self, selected):
        for row in range(self.product_table.rowCount()):
            item = self.product_table.item(row, 0)
            if item:
                item.setCheckState(Qt.CheckState.Checked if selected else Qt.CheckState.Unchecked)
        self.update_selection_label()

    def selected_products(self):
        return [item for item in self.products if item.sku in self.selected_skus]

    def update_selection_label(self):
        count = len(self.selected_products()) if self.products else 0
        self.selection_label.setText(f"已选择 {count} 个产品" if count else "尚未选择产品")

    def generate_selected(self):
        selected = self.selected_products()
        if not selected:
            QMessageBox.information(self, "请选择产品", "请勾选至少一个已定稿产品。")
            return
        if not any((self.excel_check.isChecked(), self.english_check.isChecked(), self.size_check.isChecked())):
            QMessageBox.information(self, "请选择资产", "至少选择一种要生成的资产。")
            return
        self.save_current_config()
        root = self.config["asset_root"]
        if not root:
            QMessageBox.warning(self, "缺少输出目录", "请选择产品文件夹根目录。")
            return
        options = AssetOptions(
            excel=self.excel_check.isChecked(), english_detail=self.english_check.isChecked(),
            size_image=self.size_check.isChecked(), use_existing_folders=self.existing_folder_check.isChecked(),
            folder_pattern=self.folder_pattern_input.text().strip() or "{sku}_{brand}_{name}",
            overwrite_existing=self.overwrite_check.isChecked(),
        )
        automatic = [record for record in selected if record.sku not in self.manual_skus]
        skipped_manual = len(selected) - len(automatic)
        if not automatic:
            QMessageBox.information(self, "均标记为手动", "当前选中的产品都已标记为手动处理，因此不会自动生成。")
            return
        self.add_log(f"开始生成 {len(automatic)} 个产品的资产…" + (f"（另有 {skipped_manual} 个标记为手动）" if skipped_manual else ""))

        def task(progress):
            results = []
            for index, record in enumerate(automatic, 1):
                progress(f"[{index}/{len(automatic)}] {record.sku}：生成资料…")
                result = generate_assets(record, root, options)
                results.append(result)
                suffix = f"（{'；'.join(result.warnings)}）" if result.warnings else ""
                progress(f"[{index}/{len(automatic)}] ✓ {record.sku} → {result.folder}{suffix}")
            return results

        self.run_worker(task, self.generate_complete)

    def generate_complete(self, results):
        self.generated_skus.update(result.sku for result in results)
        self.populate_table()
        count = sum(len(result.created_files) for result in results)
        self.add_log(f"✓ 批量生成完成：{len(results)} 个产品，写入 {count} 个文件。")
        QMessageBox.information(self, "生成完成", f"已完成 {len(results)} 个产品的资产生成。")

    def open_asset_root(self):
        path = Path(self.asset_root_input.text().strip())
        path.mkdir(parents=True, exist_ok=True)
        QDesktopServices.openUrl(QUrl.fromLocalFile(str(path)))

    def add_zips(self, paths):
        known = set(self.zip_paths)
        for path in paths:
            normalized = str(Path(path))
            if normalized.lower().endswith(".zip") and normalized not in known:
                self.zip_paths.append(normalized)
                self.zip_list.addItem(normalized)
                known.add(normalized)

    def choose_zips(self):
        paths, _ = QFileDialog.getOpenFileNames(self, "选择图包 ZIP", str(Path.home()), "ZIP 文件 (*.zip)")
        self.add_zips(paths)

    def remove_selected_zips(self):
        for item in self.zip_list.selectedItems():
            if item.text() in self.zip_paths:
                self.zip_paths.remove(item.text())
            self.zip_list.takeItem(self.zip_list.row(item))

    def clear_zips(self):
        self.zip_paths.clear()
        self.zip_list.clear()

    def save_rules_file(self):
        rules, errors = parse_rules(self.rules_text.toPlainText())
        if errors:
            QMessageBox.warning(self, "规则有误", "\n".join(errors))
            return
        RULES_FILE.write_text(self.rules_text.toPlainText().rstrip() + "\n", encoding="utf-8")
        self.add_log(f"✓ 已保存 {len(rules)} 条重命名规则。")

    def archive_packs(self):
        if not self.zip_paths:
            QMessageBox.information(self, "请添加 ZIP", "请先添加或拖入至少一个图包 ZIP。")
            return
        root = self.pack_root_input.text().strip()
        if not Path(root).is_dir():
            QMessageBox.warning(self, "根目录不存在", "请选择有效的搜索根目录。")
            return
        rules, errors = parse_rules(self.rules_text.toPlainText())
        if self.pack_rules_check.isChecked() and errors:
            QMessageBox.warning(self, "规则有误", "\n".join(errors))
            return
        self.save_current_config()
        paths = list(self.zip_paths)
        self.add_log(f"开始归档 {len(paths)} 个图包…")

        def task(progress):
            return archive_image_packs(paths, root, rules, self.pack_rules_check.isChecked(), self.delete_zip_check.isChecked(), progress)

        self.run_worker(task, self.archive_complete)

    def archive_complete(self, _logs):
        self.add_log("✓ 图包归档完成。")
        if self.delete_zip_check.isChecked():
            self.zip_paths = [path for path in self.zip_paths if Path(path).exists()]
            self.zip_list.clear()
            self.zip_list.addItems(self.zip_paths)

    def closeEvent(self, event):
        self.save_current_config()
        event.accept()


def main():
    if sys.platform == "win32":
        os.environ.setdefault("QT_AUTO_SCREEN_SCALE_FACTOR", "1")
    app = QApplication(sys.argv)
    app.setApplicationName("Product Asset Workbench")
    app.setStyle("Fusion")
    app.setStyleSheet(APP_STYLE)
    window = AssetWorkbench()
    window.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
