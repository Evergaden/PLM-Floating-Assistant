# PLM Photoshop UXP 文案助手

这是 PLM Photoshop UXP 文案助手，使用本机 WebSocket `ws://127.0.0.1:37191` 从 PLM 悬浮助手同步已定稿 SKU。当前版本先生成第四页文字栏，后续可以继续扩展其他页面。

## 开发加载

1. 打开 `product-asset-workbench-tauri` 桌面工作台，确认悬浮助手已经通过同一个连接码连接。
2. 在 Adobe UXP Developer Tool 中加载本目录的 `manifest.json`。
3. 在 Photoshop 2024、2025 或 2026 中加载插件面板。
4. 将工作台连接码粘贴到插件面板并连接。
5. 打开纸盒 PSD，点击“同步 / 刷新”。插件只会按当前 PSD 文件名中的纸盒编码、印刷编码或 SKU 查询一个产品，例如 `纸盒（3.2x3.2x10cm）MTL00057740 AMZ焕彩亮肤面部精油.psd`；匹配不到时请先重命名 PSD，再点击“同步 / 刷新”重试。匹配成功后，用 Photoshop 矩形选框框住第四页右侧文案区域，再点击“按矩形选区生成文案框”。

## 手动安装

如果 `.ccx` 被 Photoshop 错误关联，运行本目录的 `install-manual.ps1`。它会把插件运行文件复制到当前用户的 `%APPDATA%\Adobe\UXP\Plugins\External`，并自动更新 `%APPDATA%\Adobe\UXP\PluginsInfo\v1\PS.json`，不需要手动编辑注册信息。运行后完全退出并重新打开 Photoshop，再从“插件”菜单打开面板。脚本会先备份已有的 `PS.json`。

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\install-manual.ps1
```

也可以运行本目录的 `package.ps1` 生成最新版本的 `.ccx` 安装包，再通过 Creative Cloud 安装。

由于部分 Photoshop/UXP 版本对本机 `ws://127.0.0.1` 的精确权限匹配存在兼容性问题，manifest 使用了 `network.domains: "all"` 作为本机 WebSocket 的兼容方案；插件代码仍只连接本机 `127.0.0.1:37191`。

## 首版行为

- 优先按 PSD 文件名中的 `packageCode`/文件编码匹配，其次匹配 `printCode`、其他物料编码和 `SKU`；没有匹配时可从已同步列表选择。
- 根据 PSD 文件名和矩形选区比例自动选择窄纸盒、宽纸盒、横向标签或超宽标签版式；标签会隐藏不需要的 PRODUCT NAME 标题，并把 EU/UK/US REP 横向分成三列。
- 默认根据矩形选区创建信息、经销商/地址及三个代理的独立文本框，不生成 Safe use、条码或条码旁边的其他内容；正文固定 4pt，行距等于字号；没有选区时仍兼容写入当前选中的段落文字层。
- 正文使用 `ArialMT` Regular；标题使用已安装的 `Arial MT` Bold。该字体文件的内部 PostScript 标识为 `Arial-BoldMT`，它是同一个字体文件的内部名称，不是替换成其他字体。
- 正文使用 `ArialMT` Regular；代理标题使用 `Arial MT` Bold。外框与中线为独立图层，文字内容仍可编辑。
- 生成过程属于一个 Photoshop 模态操作，失败会删除本次新建图层并保留旧内容。
- 生成不会自动保存 PSD。
