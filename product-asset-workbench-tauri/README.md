# PLM 产品资产工作台

Windows 桌面工具，通过本机安全桥接连接 PLM 悬浮助手，预览全部已定稿 SKU，并把交付资产写入对应产品目录。

## 使用流程

1. 安装并打开“PLM 产品资产工作台”。
2. 点击右上角“连接悬浮助手”，复制工作台显示的连接码。
3. 更新并打开 `outputs/plm-material-summary.user.js`，进入悬浮助手“设置 → 桌面工作台”，粘贴连接码并连接。
4. 在工作台选择本地产品根目录，点击“同步已定稿产品”。
5. 检查目录匹配和缺失提示；未匹配 SKU 可点击文件夹按钮手动指定目录。
6. 勾选产品，点击“批量生成所选资产”。

默认不会覆盖已有文件。需要重新生成时，先开启“覆盖已有文件”。

## 输出结构

```text
产品目录\
└─ 套图\
   ├─ 品牌 产品名 SKU.xlsx
   └─ 品牌 产品名 SKU\
      ├─ 英文参数图\
      │  └─ 英文参数图.jpg
      └─ 产品参数图\
         └─ 尺寸.jpg
```

英文参数图和尺寸图优先使用产品目录根部的 `透明.png`。缺少透明图时只生成 Excel，并在队列中显示提醒。

## 开发命令

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run tauri dev
npm.cmd run tauri build
```

Rust 核心测试：

```powershell
cd src-tauri
cargo test
```

本机桥接只监听 `127.0.0.1:37191`，使用工作台生成的高熵连接码配对，不读取 PLM 密码、Cookie 或云备份密钥。
