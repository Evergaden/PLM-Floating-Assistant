# 代码减负突击日志

目标：可维护性 + 安装体积 + 删除谷歌翻译遗留机制。分支 `codex/codebase-slimming`。
原则：纯搬移阶段要求构建产物字节级一致；行为变化阶段独立 bump 版本并重建 min。

最后核对：2026-11-13，当前正式脚本 `2.10.62`。Stage 0–4 及原 `2.10.40` 结果快照保留历史口径；当前结果见本节与 `current-status.md`。

## 非保健对标包材绑定修正（2026-11-13，2.10.62）

- 非保健开发不再把对标 SKU 从“成品”入口加入 BOM；从已读取的对标 BOM 识别标准包材，排除成品、配方和已有独立草稿的纸盒／标签／说明书，并按编码去重。保健类返工搜索保持原分支。
- 新增“其他物料”的编码搜索和结果类型选择流程，复用原生输入事件与下拉选择器；搜索前等待输入状态提交，精确匹配编码单元格，避免编码紧邻数字开头的名称时匹配失败。相同包材已存在时只补类型，不重复搜索添加。
- 接口保存复用已有物料绑定接口，使用来源真实物料 ID／类型；按当前 SKU 精确查找成品 ID，防止把旧对标成品当作当前成品。缺少来源 BOM、物料 ID／类型或最终包材绑定行时给出错误，不臆造接口或包材类型枚举。不自动删除历史误加行。
- 新增 test-reference-packaging-bom.cjs，通过真实 DOM 事件与模拟接口验证菜单／搜索／选类型顺序、去重、分类、当前成品 ID、保健类分支和缺失来源数据时无写入。46 项检查全部通过；正式与预览压缩版重建并通过语法和构建同步检查，正式包 1,688,619 字符 / 1,790,102 字节。
- 无 Worker、托管 CSS 或数据库修改，不需云端部署；PLM 浏览器操作按项目约定待用户安装更新后验收。

## 开发尺寸派生值实时计算与斜体修复（2026-11-12，2.10.61）

- 在当前 2.10.60 基线上修改：原长宽高输入只记字段，体积／装箱数仍可能保留对标来源值；待补充输入框的 font-style:italic 在输入后也未清理。
- 增加派生值同步器，从当前字段而非来源数量计算体积和装箱数；复用 Excel 标准外箱 56×36×21 cm 和六向排列，不另建装箱公式。输入、BOM 尺寸变化、预填读取和属性应用均接入，派生结果只读，更新过程保留焦点。
- 保留人工编辑尺寸的优先级，避免下一次预填渲染覆盖；不完整尺寸清空派生值，尺寸有效但无法装入时显示 0。删除斜体规则，实时移除已填写字段的缺失状态。
- 新增 test-product-development-live-dimensions.cjs 验证真实输入／DOM／保存属性，以及手工值、空值、零和超大尺寸；45 项全量检查通过。UI 2.5.320 构建及部署通过，预算未增加。
- 部署版本 b7a0a1e2-6617-4f24-b462-1a56998946b9，无数据库迁移；PLM 浏览器交互验收待用户更新脚本。

## DOCX 追踪属性与保存位置（2026-11-12，2.10.57）

- 在当前 2.10.56 基线上添加本次变更，保留已有文案工作区、详情标题和物料命名改进。
- 文案与成分表确认后文案两个下载入口改为强制保存位置窗口，在点击手势内先打开窗口，再处理可能耗时的缓存恢复和水印；取消或不支持时不直接下载。
- 复用 buildExcelTraceWatermark 与姓名缓存，下载时对 DOCX 核心属性写入当前署名、时间与版本，并补齐标准关系／内容类型；保留其他属性和所有正文资源。水印形式与 Excel 的文档属性追踪一致，不添加可见正文水印。
- 新增 test-copywriting-save.cjs 验证元数据、重复打标、正文／图片保留、实际模板所有非元数据部件保留、两入口保存、手势顺序、缓存恢复、取消及不支持浏览器。测试依赖 fflate 0.8.2 和 @xmldom/xmldom 0.9.12，位于 tmp/docx-save-check，可由 PLM_DOCX_FFLATE／PLM_XML_DOM_MODULE 指定；不加入安装脚本依赖。
- 完整检查 44 PASS / 0 FAIL / 0 SKIP，正式和预览压缩版同步；无 Worker 或托管样式变更，保存窗口浏览器验收待用户更新脚本。

## 非食品文案生成分类与校验修复（2026-11-12，2.10.51）

- 排查常规非 NDC 镁霜生成失败，发现前端已提交 regular 分类但 Worker 未消费；统一规则将 daily use 归为服用频次，且本地合规兜底对非食品也补入“营养支持”。截图没有提供具体失败候选，本次修复的是可复现的规则冲突。
- 前后端限制检查增加分类参数，常规产品只豁免一般日常使用短语，仍逐项拦截次数、用量、饮食属性与质量背书；食品原规则继续执行。分类贯穿生成、JSON 重试、AI 修复、本地兜底，不依据镁成分改成保健产品。
- 前端报错区分具体条目与拦截类型。新增 test-regular-copywriting-compliance.cjs 验证前后端一致、实际 handler 分类传递与修复行为；41 项全量检查通过，正式／预览压缩版重建。
- Worker 部署 `00bf7527-03a4-410c-a724-fc5f8854e834`，无数据库或 CSS 变更；浏览器流程按项目约定待用户更新后验收。
- 线上真实模型测试用“镁霜”和三个示例成分，71 秒返回 200、A/B/C/D=4/4/15/3，首次及 AI 修复仍有命中项，最终走中性本地兜底；返回完整文案并通过实际前端校验器。结果保存在本地 tmp/regular-magnesium-copywriting-check.json，未写用户产品数据。

## 开发表单滚动与输入状态保留（2026-11-12，2.10.50）

- 后台自动查询和刷新仍通过 innerHTML 重建右侧开发详情，原滚动恢复只匹配首个详情滚动节点，无法保留嵌套滚动与焦点。
- 将列表的局部节点协调逻辑扩展为助手面板协调器；同 SKU 的详情更新按字段标识复用标签和输入控件，保留活动值、光标与滚动节点，其他字段同步异步查询结果。切换 SKU／页签通过独立上下文重新渲染。
- 滚动快照记录节点引用；节点已保留且上下文一致时不重复写入旧位置，防止下一帧恢复覆盖用户更新后的滚动。
- 新增 `test-product-development-scroll.cjs`，覆盖状态提示增删、嵌套滚动、活动输入与光标、其他字段更新、旧帧恢复和切换产品；40 项全量检查通过。正式／预览压缩版均重建，无服务端或 CSS 变更，浏览器验收待用户更新脚本。

## SKU 侧栏 DOM 稳定性检查与修复（2026-11-12，2.10.49）

- 原因：开发详情／后台更新直接重建侧栏；排序菜单开关替换内容；普通列表真实数据变化也整段重建。字节缓存虽存在，图片节点和已解码像素仍丢失。
- 两种侧栏共用局部节点协调器，按 SKU 与结构节点复用卡片、滚动容器、工具栏；相同地址的缩略图整组保留，排序移动已有节点，实际换图才使用新节点和加载回调。现有渐进加载与本地缓存继续使用。
- 菜单开关独立更新，关闭排序／导出菜单后继续执行本次按钮动作；修复重复鼠标监听、重复对象 URL 赋值。保留普通／工作台的切换指示器运行样式。
- 新增 `test-sku-sidebar-stability.cjs`，覆盖节点身份、刷新、重排、筛选、选中、滚动、换图、开发侧栏与菜单动作。测试依赖可通过 `PLM_DOM_MODULE` 指定；本地使用 `npm install --prefix tmp/sku-render-check --no-audit --no-fund --package-lock=false linkedom@0.18.12` 安装，不加入生产脚本。
- 完整检查 39 PASS / 0 FAIL / 0 SKIP；正式及工作台预览压缩版重建，语法与构建同步通过。无托管样式、Worker 或数据库变更；浏览器验收按约定待用户更新安装脚本后进行。

## 建品表单与非保健开发规则（2026-11-12，2.10.48）

- 按用户授权分成表单自动保存、来源数据规则、BOM 展示／尺寸同步三组并行实现，整合时统一回归。
- 删除无上传行为的页面 2 附件展示、上传提醒和废弃附件编辑分支；删除建品手动本地保存及重复资料查询入口，失焦立即持久化，输入期保留草稿定时写入。
- 标题／保存状态独立一行，三个建品操作按钮另起一行；已绑定 BOM 改为语义化只读字段，阻止旧输入分支修改绑定记录。托管 UI 升级 2.5.319，未增加复杂度预算。
- 采购数量默认 1000，来源数量不覆盖默认，明确人工输入后后续查询也不覆盖。非保健类采用“对标”字样、参考物料备注；保健类保留“返工”与原默认备注。继续沿用 rework 内部键和历史缓存来源兼容。
- 规格尺寸与纸盒三维／标签二维双向同步，处理毫米换算、六位小数、清空和未完成输入，并保留非尺寸文本、焦点及当前光标。
- 对标记录提供项目 ID 时读取已知项目 BOM 接口；否则只用当前 BOM 的可用备注，不臆造新接口，不把对标物料的 ID 当作当前绑定 ID。
- 新增自动保存、物料同步、来源规则三组回归，38 项检查全部通过；正式与预览压缩版重建，正式包 1,655,673 字符 / 1,756,130 字节。PLM 浏览器交互按项目约定待用户更新后验收。
- 部署版本 `e4a1b266-b7ab-4d2e-9693-a514ffa934ea`；主域名与 workers.dev 的 `/health`、资源清单、受认证接口均为 200，新 UI 样式与本地哈希一致；无数据库迁移。

## 姓名拼音库移出安装脚本（2026-11-12，2.10.47）

- 背景：完整拼音库仅用于水印的姓名首字母，内嵌字典占用了不必要的脚本安装空间。未采用先前本地尝试的 CDN `@require` 方案，避免每位用户下载完整字典。
- `src/trace-name-pinyin.module.js` 改为轻量缓存与接口客户端；构建器保留原模块边界，但不再内嵌 vendor。原 MIT 库留在仓库，仅供 Worker 的 `src/trace-name-initials.js` 导入和回归验证。
- Worker 增加受现有鉴权保护的 `POST /users/name-initials`。确定性转换保留原多音姓氏选项，拒绝空值、非字符串与超过 80 字符的姓名，不调用 AI、不写 D1。
- 本地按姓名持久化转换结果，合并并发请求，失败不缓存且有重试冷却；导出偏好支持手动修正，异步返回不得覆盖修正值。无缓存且网络失败时保留原姓名水印。
- 正式压缩版由 `2.10.46` 的 1,891,338 字符 / 2,077,891 字节降至 1,653,849 字符 / 1,754,452 字节。完整重建正式版和工作台预览版，旧 beautified preview 仍是历史产物。
- 验证：35 项检查全部通过；新增实际 Worker 路由鉴权/输入/转换与客户端缓存、并发、手动优先、重载持久化、断网冷却测试。图片与 Excel 水印检查保留。Wrangler dry-run 构建通过；浏览器验收待用户安装更新后进行。
- 后端已部署，Worker 版本 `277e3887-447b-444c-b7b5-0044ef9531d9`；主域名和备用域名均通过健康 200、受认证转换 200、未授权 401、无效输入 400 的线上检查。无需数据库迁移。

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
