# 三栏详情页布局验证版

分支：`codex/detail-workspace-preview`。本地构建验证，不发布云端。

## 安装与恢复

- 完整测试包：`plm-material-summary.workspace-preview.user.js`
- 压缩测试包：`plm-material-summary.workspace-preview.min.user.js`
- 两者功能相同，选一个更新现有脚本即可。保留原 `@name` 和 `@namespace`，便于脚本管理器保留 GM 数据；界面徽标和脚本说明会显示“布局验证版”。不要同时启用两个副本。
- 点击左侧“我的详情”查看三栏页面；其他功能继续沿用原页面内容。
- 恢复普通布局：使用本分支的 `plm-material-summary.user.js` 或 `plm-material-summary.min.user.js` 更新同一脚本。无需删除缓存或重置窗口设置。
- 基础样式仍按原有方式从云端加载；新增布局样式已嵌入测试包，不需要发布或刷新云端版本。

## 构建与检查

仓库根目录执行：

```powershell
node scripts/build-userscript-release.js --workspace-preview
node scripts/build-userscript-release.js
node scripts/check-workspace-preview.cjs
node scripts/check-sku-image-colors.cjs
node --check outputs/plm-material-summary.user.js
node --check outputs/plm-material-summary.workspace-preview.user.js
node --check outputs/plm-material-summary.workspace-preview.min.user.js
git diff --check
```

Worker 目录执行 `npm run ui:build` 和 `npm run ui:check`。`experimentalSources` 中的模块参与规范校验，但不会写入托管 CSS，原有复杂度预算不变。

## 手动验收（更新脚本后进行）

- 左侧功能入口、权限禁用、选中状态、通知角标与设置提示正常；其他功能可进入和返回。
- 每行显示效果图、名称、SKU、开发人员与状态；长名称不撑开布局，缺图和加载失败有占位。
- 点击另一行正确更新右侧详情，列表滚动位置保持，已有图片不闪烁或重载。
- 搜索输入焦点保持，筛选、排序、分页正常，空结果有提示。
- “筛选 → 效果图主色”直接查询本机颜色索引，不触发图片下载。打开 PLM 后约 15 秒开始后台建索引，新增或换图时自动补齐；旧的有效颜色缓存继续复用。首次 900 多款仍需后台处理一次，处理期间结果逐步补齐。
- 后台只处理缺失、换图和到重试时间的图片，一次一张，优先等待页面空闲。失败项至少隔 30 分钟重试，连续失败三次后间隔一天；可手动点击“继续建索引 / 重试”立即重试。暂停后本次页面会话不会自动恢复，刷新页面或手动继续可恢复。
- 索引只保存于本机，当前未提供多人云端共享。大于 8MiB 的图片跳过解码；支持的浏览器优先以 80 像素位图解码，完成后主动释放位图和画布。实际浏览器峰值内存与识别速度仍需验证。
- 右侧详情、文案、参数图、尺寸图切换与查看详情、编辑、导出、刷新、更新日志正常。
- 中间列表和右侧内容独立滚动；窗口缩小时可横向滚动，不隐藏三栏内容。窗口位置、大小和原瀑布流偏好保留。

Node 检查只验证渲染与构建逻辑，不代表已完成上述浏览器验收。
