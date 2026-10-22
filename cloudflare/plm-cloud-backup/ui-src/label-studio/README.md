# 标签工作室

独立静态网页：`https://velvet.qzz.io/label-studio/`。

输入单个商品编码或批量粘贴编码，每个编码手动粘贴、选择或拖入一张商品图。批量选择时以完整编码命名图片，例如 `SKU00012345.jpg`。图片和生成文件仅保存在当前浏览器内存，刷新前请下载。

标签保持原生成器的固定 4×3cm 布局：产品图、Code128-B 条码、编码。每个编码导出 1200×900 的印刷 JPG、同尺寸的合并图像 PSD（762ppi，4×3cm）和 3000×3000 的尺寸说明 JPG。批量 ZIP 按编码分目录，缺图时阻止整批导出，避免漏项。

网页源文件在当前目录；CSS 的唯一源在 `../modules/label-studio.css`。运行 `npm run ui:build` 生成 `static/label-studio/`，`npm run ui:check` 检查产物。`build-label-studio.cjs` 直接提取现有 userscript 绘图函数，避免维护两套标签排版。

网页不连接 PLM、不上传图片，也不自动回传 BOM。无需更新 userscript。
