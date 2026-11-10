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

## Stage 1 — 核心代码搬回 src

（进行中）

## 遗留待办

- KNOWN-FAIL 的 3 个检查脚本待修复（锚点漂移属测试侧问题，非产品 bug）。
- `@napi-rs/canvas` 依赖待定位（此前会话可能装在临时目录，已被清理）。
