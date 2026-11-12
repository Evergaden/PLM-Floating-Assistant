# 代码减负突击日志

目标：可维护性 + 安装体积 + 删除谷歌翻译遗留机制。分支 `codex/codebase-slimming`。
原则：纯搬移阶段要求构建产物字节级一致；行为变化阶段独立 bump 版本并重建 min。

最后核对：2026-11-12，代码基准 `bd772d2`，当前正式脚本 `2.10.40`。Stage 0–4 和 11 月 11 日结果快照保留历史口径；最新状态见下方跟进与验证记录。

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

以下行数和调用点数量来自 2026-11-11 减负阶段调查，未在本次重新统计，不作为当前精确计数。

- **fetch 封装合并**：fetchPlmJson/fetchPlmJsonRequest、fetchPlmApiJson/fetchPlmApiJsonRequest 两对近似封装共 **78 个调用点**，且位于 AGENTS.md 标记的脆弱 PLM API 胶水层；待浏览器验证窗口充足时专项处理。
- **存储读写助手统一**：49 处 GM/localStorage 回退、~150 对 load/save 样板。机械替换量大、单位收益低，随功能迭代顺手迁移。
- **handlePanelClick action 注册表**：1,567 行 if/else（~200 个 data-action），建议在 action 域专项中分批搬移。
- **makeDebouncedSaver**：~15 个手写定时保存函数（集中在 pd-foundation），形态相近但各有 state 字段差异。

## 遗留待办

- `@napi-rs/canvas` 当前仍不可用；两个相关检查跳过，待安装依赖或通过 `PLM_CANVAS_MODULE` 指向模块后补跑。
- `outputs/plm-material-summary.min.preview.user.js` 仍停在 `2.10.36`，正式版及工作台预览版已到 `2.10.40`。后续发布需明确是否继续维护并重建该变体。
- `.workbuddy` 旧「双写铁律」条目是否仍需维护，本次未核验或修改；当前应遵循 `src/` 修改后构建、再以 build-sync 守卫校验的流程。
- 用户手动更新当前 min 后完成详情、上传、今日工作台、产品开发、图片下载与云备份交互验收；本次未运行浏览器验证。
- Worker 部署版本、D1 迁移、线上健康与受认证接口仍待独立核验，本次未部署。

## 结果快照（2026-11-11 终，实测）

| 产物 | 字节 | gzip 9 |
|---|---|---|
| plm-material-summary.user.js（v2.10.36） | 3,476,005 | 860,687 |
| plm-material-summary.min.user.js（用户实际安装） | 2,335,354 | 706,007 |

（基线 3,478,406 / 2,336,882 B；本轮体积基本持平——预期之内，收益在结构而非行数。）

源码结构：src/ 从 17,400 行 / 16 文件 → **55,581 行 / 57 个 git 追踪文件**（16 特性模块 + 2 基础 core 模块 + 24 核心域 + 12 pd 子模块 + vendor/data），outputs 回归纯产物。

## 减负后的跟进（2026-11-11 至 2026-11-12）

这些提交包含行为变更和测试修复，与前述纯搬移阶段分开记录：

- `d72e6d6`：工作台预览检查恢复通过并移出 KNOWN-FAIL 登记。
- `6911510`：云备份对去除 `exportedAt` 的内容计算 SHA-256，内容未变化时跳过上传；Worker 增加每用户备份快照保留限制。
- `8e50756`：图片下载增加瞬态网络故障重试，ZIP 保留已成功下载的部分结果。
- `56ba9b8`：GM 下载重试耗尽后回退页面上下文 fetch，备用通道也有重试。
- `7bec79e`：精简产品开发说明文案，正式脚本及工作台预览产物更新至 `2.10.40`。
- `3b329e7`、`a32c95c`：为轮播测试的假 DOM 补上 `querySelector`，测试通过并移出登记。
- `3aa1b2d`、`bd772d2`：渐进图片测试对齐本地图片缓存实现，测试通过并移出登记。当前 `scripts/run-checks.cjs` 中 `KNOWN_FAILURES = {}`，历史三项 KNOWN-FAIL 均已清理。

## 最新产物快照（2026-11-12，本地实测）

| 产物 | 元数据版本 | 字节 | gzip 9 |
|---|---|---|---|
| plm-material-summary.user.js | 2.10.40 | 3,480,066 | 861,720 |
| plm-material-summary.min.user.js | 2.10.40 | 2,336,431 | 706,172 |
| plm-material-summary.workspace-preview.user.js | 2.10.40 | 3,480,083 | 861,729 |
| plm-material-summary.workspace-preview.min.user.js | 2.10.40 | 2,336,449 | 706,184 |
| plm-material-summary.min.preview.user.js | 2.10.36 | 3,198,430 | 773,742 |

计数方式：读取本地文件的原始字节，使用 Node `zlib.gzipSync`、`level: 9` 计算 gzip 字节数。主产物及工作台预览源码的 `SCRIPT_VERSION` 同为 `2.10.40`；本次没有重建产物。当前 `src/` 有 57 个 Git 追踪文件，其中 53 个 JavaScript 文件，按 LF 换行符计 54,246 行；该口径与历史快照的全源码行数不直接比较。

## 最新检查结果（2026-11-12）

- 根目录 `npm.cmd run check` 通过：29 个脚本，**27 PASS、0 FAIL、0 KNOWN-FAIL、2 SKIP**。套件包含 build-sync，入口随后再次执行该守卫，并运行主产物 `node --check` 与 `git diff --check`，均通过。
- build-sync 核对 18 个构建模块区域，与 `src/` 字节一致；不覆盖所有安装变体的版本或内容同步。
- 两项 SKIP 为 `check-minified-size-worker.cjs`、`check-size-image-barcode.cjs`，均缺少可选依赖 `@napi-rs/canvas`，不计为已通过。
- Worker 目录 `npm.cmd run ui:check` 通过：`static/assets/v15/ui-2.5.317.css`、远程工作台 CSS、独立标签工作室资源与原始渲染引擎均匹配。
- UI 指标：`important=1814`、`supersededImportantDeclarations=0`、`duplicateSelectors=459`、`conflictingSelectors=426`、`uniqueSelectors=3582`。通过的是当前产物和预算契约，存量级联债务仍在。
- Worker 目录 `node --check src/index.js` 通过。
- 以上为本地静态/回归检查。本次未执行浏览器、桌面/手机/Photoshop 客户端交互、线上 `/health` 或受认证接口验证，未部署、迁移数据库或修改用户数据。
