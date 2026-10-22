# 标签工作室

独立静态网页：`https://velvet.qzz.io/label-studio/`。

输入单个商品编码或批量粘贴编码，每个编码手动粘贴、选择或拖入一张商品图。批量选择时以完整编码命名图片，例如 `SKU00012345.jpg`。图片和生成文件仅保存在当前浏览器内存，刷新前请下载。

标签保持原生成器的固定 4×3cm 布局：产品图、Code128-B 条码、编码。网页使用 3000×2250 高清画布、高质量分步缩图及最高 JPG 质量，导出同尺寸的合并图像 PSD（1905ppi，4×3cm）和 3000×3000 的尺寸说明 JPG。尺寸图从高清画布缩小，避免放大低像素图。PSD 从无损 PNG 中间文件按需编码，未导出时不驻留大体积 PSD。每批最多 20 个编码，ZIP 按编码分目录，缺图时阻止整批导出，避免漏项。

网页源文件在当前目录；CSS 的唯一源在 `../modules/label-studio.css`。运行 `npm run ui:build` 生成 `static/label-studio/`，`npm run ui:check` 检查产物。`build-label-studio.cjs` 提取现有 userscript 排版函数，并应用网页专用分辨率及 `render-quality.js` 的缩图适配。界面图标直接由已安装的 Lucide React 库构建，库许可证随静态文件发布，不依赖 CDN，不手绘 SVG 路径。

网页不连接 PLM、不上传图片，也不自动回传 BOM。无需更新 userscript。

PSD 使用标准 PackBits/RLE 无损压缩，像素、色彩和物理尺寸保持一致；对于难以压缩的图像，自动回退到未压缩存储，避免文件反而变大。`psd-export.js` 是网页 PSD 编码源。
