# 旧版页面结构迁移契约

本文档冻结 PLM 浮动助手旧版页面的结构、行为入口和本地数据边界。后续 React 重构以“保留旧版结构，替换局部渲染实现”为原则；如果实现与本文档冲突，应先补充契约并完成浏览器验证，再修改生产脚本。

## 1. 迁移范围

- 生产入口仍是 `outputs/plm-material-summary.user.js`。
- `frontend-v2` 继续作为迁移中的 React 源码，不直接替换旧版整壳。
- 旧版面板、用户拖拽位置、面板尺寸、侧边 SKU 列表和功能入口必须持续可用。
- 当前 React v2 的全量新壳仅是可选预览，迁移期间保持关闭，不作为旧版功能的替代品。

## 2. 旧版 DOM 骨架

以下节点和属性是布局、事件委托或浏览器验证会依赖的稳定边界：

```text
#plm-floating-helper
└── .pfh-full
    ├── .pfh-header
    ├── .pfh-main
    │   ├── .pfh-list       SKU/瀑布流/侧边产品列表
    │   └── .pfh-detail     产品详情、采集结果、上传与导出内容
    └── .pfh-ledger-*       今日工作台及其标签栏
```

- `#plm-floating-helper` 负责固定定位、折叠状态、拖拽和面板尺寸。
- `.pfh-full` 负责面板内部的裁剪、圆角和滚动边界；React 不应把它替换成另一个根节点。
- `.pfh-main`、`.pfh-list`、`.pfh-detail` 保留旧版的左右关系，SKU 列表继续挂在侧边，切换产品不离开当前详情视图。
- `.pfh-ledger-tabs` 与 `.pfh-ledger-tab-indicator` 必须保留为原节点。切换今日工作台标签时，只刷新标签栏下方内容；指示器继续通过 `left`/`width` 和 `cubic-bezier(.25,1.2,.35,1)` 运动。
- `data-view` 是当前主视图边界，至少覆盖 `home`、`ledger`、`upload`、`detail`、`settings` 等旧版视图。
- `data-upload-mode` 是上传子流程边界，不能被普通视图切换清空。
- `.pfh-upload-*`、`.pfh-sku-*`、`.pfh-ledger-*` 的类名属于兼容选择器，迁移时先保留，再考虑增加 React 专用类名。

## 3. 行为入口

旧版使用面板级事件委托。React 组件可以负责展示和局部状态，但业务动作必须经过兼容适配层，不能直接复制一套与旧版并行的上传、采集或存储逻辑。

| 能力 | 旧版入口 | 迁移边界 |
| --- | --- | --- |
| 面板首次创建与整体壳 | `ensurePanel()`、`renderShell()` | 保留旧壳和宿主节点；React 只接管明确的内容槽 |
| SKU 列表/瀑布流 | `renderSkuList()`、`renderSkuListContent()` | 保留侧边列表、排序、搜索、选中态和滚动位置 |
| 今日工作台 | `renderHome()`、`renderLedger()`、`renderLedgerTabContent()` | 保留标签栏节点与账本数据；只替换下方内容 |
| 产品详情 | `renderDetail()` | 保留详情返回、采集状态、图片/尺寸/文案等入口 |
| 进入 PLM 产品详情 | `openSelectedProjectDetail(options)` | 作为浏览器 DOM 自动化和采集流程的唯一边界 |
| 上传流程 | `renderUpload()`、`renderUploadModeContent()` 及原有上传处理器 | 保留队列、历史、重试、进度和文件状态 |
| 面板点击/输入 | `handlePanelClick()`、`handlePanelKeydown()`、`handlePanelInput()`、`handlePanelPaste()`、`handlePanelChange()` | `data-action` 继续作为稳定动作标识 |
| 拖拽与右键菜单 | `handlePanelContextMenu()` 及面板拖拽处理器 | 不改变用户已保存的位置和尺寸行为 |
| 提示与弹窗 | `showToast()` 及旧版弹窗处理 | React 通知通过适配器调用，避免重复通知容器 |

所有可交互按钮优先保留旧版 `data-action` 值。新增按钮若需要 React 专用动作，应先定义动作名和回退行为，再接入宿主适配器。

## 4. 数据与存储契约

### 4.1 SKU 数据

- SKU 索引由 `loadIndex()` / `saveIndex()` 管理。
- 单个 SKU 数据由 `loadData(sku)` / `saveData(sku, data)` / `saveDataDirect(sku, data)` 管理。
- 数据键前缀为 `plm-floating-helper:data:`，索引键为 `plm-floating-helper:index`。
- 已缓存的 SKU 字段、图片链接、尺寸/净含量、软管规则、上传状态和历史字段必须向后兼容。扩展字段使用默认值，不删除旧字段或改变旧字段含义。

### 4.2 UI 状态与队列

以下键名属于已有用户数据，迁移时只能复用或向后兼容扩展：

```text
plm-floating-helper:position
plm-floating-helper:launcher-position
plm-floating-helper:split-width
plm-floating-helper:size
plm-floating-helper:settings
plm-floating-helper:tutorial-seen
plm-floating-helper:upload-queue
plm-floating-helper:excel-batch-queue
plm-floating-helper:upload-history
plm-floating-helper:upload-worker
plm-floating-helper:upload-worker-states
plm-floating-helper:toy-copywriting-batch
plm-floating-helper:toy-label-export-manifest
plm-floating-helper:logs
plm-floating-helper:insights
plm-floating-helper:user-instance
plm-floating-helper:daily-ledger
plm-floating-helper:daily-ledger-trash
plm-floating-helper:daily-ledger-series-excluded
plm-floating-helper:magic-upload-queue:v1
plm-floating-helper:magic-upload-history:v1
plm-floating-helper:magic-upload-metrics:v1
plm-floating-helper:cloud-assets:v1
plm-floating-helper:notifications:v1
plm-floating-helper:backend-update-prompted
plm-floating-helper:desktop-bridge-token
plm-floating-helper:plm-api-monitor-state
plm-floating-helper:frontend-v2-enabled
```

- GM 存储和 `localStorage` 的读写兼容逻辑保持不变。
- 云备份的 payload 结构、缓存 SKU 字段和 Worker 接口不因前端换架构而改变。
- 不在 React 源码、文档或构建产物中写入 API 密钥、Worker secret 或本地凭据。

## 5. React 接入规则

1. React 首先以内容渲染器或局部挂载点接入 `.pfh-full`，不替换 `#plm-floating-helper`、`.pfh-full`、`.pfh-main` 的宿主关系。
2. React 组件只管理自己的展示状态；SKU 数据、账本、上传队列和详情采集状态仍通过宿主适配器读取和写回。
3. 旧版 `data-action` 和事件委托保留为回退路径。React 动作失败时，不能让整个面板变成空白，应回到旧版动作或显示可恢复提示。
4. PLM DOM 选择器、抽屉切换、上传自动化属于脆弱集成。迁移只允许改变调用方，不允许在未登录浏览器验证前重写选择器和流程。
5. 每完成一个功能域，先在旧版结构内验证，再决定是否扩大 React 的接管范围。
6. 视觉 token、动效和主题可以由 React/CSS 统一提供，但布局语义、功能入口和数据契约优先于视觉重排。

## 6. 功能迁移清单

| 阶段 | 功能域 | 首个可见结果 | 完成标准 |
| --- | --- | --- | --- |
| 1 | 契约冻结 | 本文档 | 旧版结构、动作、数据边界明确；旧版界面不变 |
| 2 | 宿主适配层 | React 能读写旧版状态 | 不切换用户界面，不新增存储格式 |
| 3 | 今日工作台 | 原位置出现 React 内容 | 标签栏、账本、月度登记、导出和云备份保留 |
| 4 | SKU 侧边列表/瀑布流 | 原侧栏由 React 渲染 | 搜索、排序、选中态、滚动和快速切换保留 |
| 5 | 详情、弹窗、通知 | 局部动效和统一主题生效 | 采集、图片、尺寸、复制提醒、弹窗和回退路径完整 |
| 6 | 上传、设置与收尾 | 完成旧版结构内的整体迁移 | 上传队列、历史、设置、教程、自动化和回归验证通过 |

## 7. 第一步退出标准

- [x] 旧版页面骨架、稳定类名和关键 `data-*` 属性已记录。
- [x] 主要渲染函数、事件委托和 PLM 自动化边界已记录。
- [x] 本地存储、队列、账本和 React 开关键已记录。
- [x] 明确 React 只能局部接管，旧版整壳作为宿主和回退路径。
- [x] 本阶段不修改用户可见旧版界面、不迁移业务逻辑。
