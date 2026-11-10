# 代码减负突击日志

目标：可维护性 + 安装体积 + 删除谷歌翻译遗留机制。分支 `codex/codebase-slimming`。
原则：纯搬移阶段要求构建产物字节级一致；行为变化阶段独立 bump 版本并重建 min。

## 基线（2026-11-11，起点 f9c296e，v2.10.34）

| 产物 | 字节 | 行数 | gzip 9 | 顶层函数 |
|---|---|---|---|---|
| plm-material-summary.user.js | 3,478,406 | 54,334 | 861,379 | 2,520 |
| plm-material-summary.min.user.js（用户实际安装） | 2,336,882 | 62 | 706,478 | — |
| plm-material-summary.workspace-preview.user.js | 3,433,028 | 52,795 | 839,768 | 2,478 |
| plm-material-summary.workspace-preview.min.user.js | 2,271,607 | 61 | 687,339 | — |

check 套件总耗时 ~2.8s。

### 存量问题登记（Stage 0 时的已知状态）

- `check-workspace-preview.cjs` KNOWN-FAIL：脚本内嵌 v2.9.95 快照与当前源码比对，快照过期。
- `test-home-carousel.cjs` KNOWN-FAIL：假 DOM 桩缺 `querySelector`，未跟上 `setupHomeCarousel` 演化。
- `test-sku-progressive-images.cjs` KNOWN-FAIL：切片漏了 `setLocalImageSource`。
- `check-minified-size-worker.cjs` / `check-size-image-barcode.cjs` SKIP：环境缺 `@napi-rs/canvas`，可用 `PLM_CANVAS_MODULE` 指路。
- 行尾漂移：6 个 src 模块为 CRLF（git autocrlf 入库后无感），outputs 为 LF；构建已加 CRLF→LF 归一化。
- outputs 中 4 个模块 marker 后有游离空行（cloud-assets/notifications/desktop-bridge/ui-loader），Stage 0 构建清除（-4 行）。

## Stage 0 — 安全网与基线（2026-11-11）

- 根 `package.json`：`npm run check`（run-checks + build-sync + node --check + git diff --check）、`npm run build`、`npm run sync`（build + release）。
- `scripts/run-checks.cjs`：一键跑全部 check/test，KNOWN-FAIL 登记、缺可选依赖自动 SKIP、意外转绿会提示清理登记。
- `scripts/check-build-sync.cjs`：内存重放模块注入，要求与 outputs 字节一致——双写铁律的自动化替代，堵死双源漂移。
- `scripts/build-userscript.js` 重构为可导出（modules/injectModules/resolveModuleSource），CLI 行为不变；新增 CRLF 归一化。

## Stage 1 — 核心代码搬回 src（已完成，ba89fb4 + 963167f）

36,877 行核心代码回到 src。第一轮按 4 个粗粒度区域抽取（core-lazy-externals / core-config / core-app-main / core-app-runtime），第二轮把两个巨型文件按领域切成 24 个文件。所有切分均在顶层函数边界，重组断言字节级一致，构建产物为纯 no-op。CSS 常量与 release 同步机制确认无需改动（正则定位、位置无关）。

## Stage 2 — 删除谷歌翻译遗留机制（2e3b76b，v2.10.35）

删除 @match translate.google.com、isGoogleTranslatePage、initGoogleTranslateWorkspace、bootstrap 早退分支、ExcelJS 加载守卫、备份调度守卫及构建契约标记。保留现役应用内翻译（translate.googleapis.com）、翻译工作台存储契约（云备份 payload）、www.google.com 连通性探测。

## Stage 3a — 死码清理（958b308）

删除被 ui-loader 遮蔽的主题三函数（core-config，-38 行）与被 core-download-utils 遮蔽的重复 arrayBufferToBase64（core-detail-copywriting，-8 行）。教训：探索报告声称 lucianEmptySearchHtml 零调用是错的，实际在 core-panel-views 有调用——删除前必须本地验证调用点。

## Stage 3b — product-development 拆分（fa77812 + d9352a8）

11,723 行拆为 `src/product-development/pd-*.module.js` 12 个领域文件（foundation / task-sync / prefill / pricing-drafts / dom / task-views / review-copywriting / docx-builders / copywriting-run / one-shot / batch-runners / dispatcher）。check-product-development-copywriting-templates.cjs 因直读旧路径修复为读目录拼接。

## Stage 4 — 收尾（v2.10.36）

全部 5 个安装变体重建于统一版本 2.10.36。

## 降级为后续专项（本轮不做，数据已备）

- **fetch 封装合并**：fetchPlmJson/fetchPlmJsonRequest、fetchPlmApiJson/fetchPlmApiJsonRequest 两对近似封装共 **78 个调用点**，且位于 AGENTS.md 标记的脆弱 PLM API 胶水层；待浏览器验证窗口充足时专项处理。
- **存储读写助手统一**：49 处 GM/localStorage 回退、~150 对 load/save 样板。机械替换量大、单位收益低，随功能迭代顺手迁移。
- **handlePanelClick action 注册表**：1,567 行 if/else（~200 个 data-action），建议在 action 域专项中分批搬移。
- **makeDebouncedSaver**：~15 个手写定时保存函数（集中在 pd-foundation），形态相近但各有 state 字段差异。

## 遗留待办

- KNOWN-FAIL 的 2 个检查脚本待修复（test-home-carousel / test-sku-progressive-images，锚点漂移属测试侧问题，非产品 bug）。check-workspace-preview 已随变体重建自然转绿并移出登记。
- `@napi-rs/canvas` 依赖待定位（此前会话可能装在临时目录，已被清理）。
- `.workbuddy` 记忆中的「双写铁律」条目已失效（build-sync 检查已自动化替代），待用户确认后改写。
- v2.10.35/36 变更的浏览器验证由用户重装 min 后执行（详情/上传/ledger/云备份核心路径）。

## 结果快照（2026-11-11 终，实测）

| 产物 | 字节 | gzip 9 |
|---|---|---|
| plm-material-summary.user.js（v2.10.36） | 3,476,005 | 860,687 |
| plm-material-summary.min.user.js（用户实际安装） | 2,335,354 | 706,007 |

（基线 3,478,406 / 2,336,882 B；本轮体积基本持平——预期之内，收益在结构而非行数。）

源码结构：src/ 从 17,400 行 / 16 文件 → **55,581 行 / 57 个 git 追踪文件**（16 特性模块 + 2 基础 core 模块 + 24 核心域 + 12 pd 子模块 + vendor/data），outputs 回归纯产物。
