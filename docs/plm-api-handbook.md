# PLM API 手册

更新日期：2026-08-03

站点：`https://plm.westmonth.com`

## 通用调用方式

- 读取接口使用当前登录网页会话，浏览器请求带 `credentials: same-origin`。
- 不要把 Cookie、Authorization、STS 密钥写入脚本或提交到 Git。
- 常见请求头由网页自动补充：`x-app-code: PLM`、`x-tenant-code: xy`、`x-tenant-id: xy`。
- 读取请求建议设置 15 秒超时，并对 HTTP 非 2xx 做错误处理。

### 登录态和 HTTP 401 经验

- 仅补充固定租户头不一定足够。PLM 页面可能通过自己的 fetch/XHR 请求封装追加动态认证头；清理后的 HAR 也可能看不出完整登录态。
- 不要把 Authorization、Cookie、临时 token 写死。用户脚本应在当前页面内存中观察页面真实请求的认证头，并在同一会话内复用；脚本刷新或页面关闭后应失效。
- 页面请求和用户脚本请求都返回 401 时，优先刷新 PLM 页面并确认账号仍有项目权限；不要把 401 当成物料为空。
- 项目物料接口和产品接口应分开容错：`GetProjectDetail` 失败时仍可按 SKU 继续 `GetProductList` 和 `GetDetailContent`，这样净含量、毛重等产品字段不会被项目物料权限问题连带阻断。

## SKU、项目和产品

### 按 SKU 查询项目列表

```http
GET /api/ChemicalNewAll/GetList?page=1&pageSize=20&product_codes=SKU00046602
GET /api/ChemicalNewDesignTask/GetList?page=1&pageSize=20&product_codes=SKU00046602
```

返回常用字段：`id`、`product_code`、`product_name`、`product_id`、`product_main_id`、`category_id`、`category_name`、`pic`、项目状态和负责人信息。

### 项目详情和物料清单

```http
GET /api/ChemicalNew/GetProjectDetail?id={project_id}
```

重点返回：

- `data.project`：项目、SKU、`product_id`、`product_main_id` 等关联信息。
- `data.pms[]`：项目物料清单。

2026-08-07 的价格抓取 HAR 还确认，`data.project` 会直接返回国内阶梯价格字段：

- `domestic_first_tier_price`：国内一档价格；
- `domestic_second_tier_price`：国内二档价格；
- `domestic_third_tier_price`：国内三档价格。

同一项目的 `GET /api/ChemicalNew/GetProjectStockDetail?id={project_id}` 也返回上述字段，并额外带有 `procurement_price`。两者含义不同：当前 Excel 的“价格”应使用明确的 `domestic_third_tier_price`；不能把 `procurement_price`、参考价或产品价格接口中的其他价格混作国内三档价。字段不存在时再沿用本地已保存价格或原有回退逻辑。

`pms[]` 物料常用字段：`code`、`name`、`category_name`、`properties_value`、`material_length`、`material_width`、`material_height`、`material_type`、`pics`。

纸盒、彩盒、纸箱通常从 `pms[]` 识别；标签、印刷、贴纸、不干胶等也从这里读取尺寸和物料编码。

分类时优先使用物料 `name`、`category_name` 和 `properties_value`，不要把供应商名称作为主要分类条件。供应商名称可能包含“印刷”或“纸盒”，会把纸盒误归入标签/印刷。例如 SKU00046993 的物料清单中：

| 物料编码 | 名称/类别 | 尺寸 | 归类 |
|---|---|---|---|
| `MTL00064165` | 紧致肌肤护理霜纸盒 / `包材 - 纸盒 - 白卡 - 白卡` | `6.6x6.6x5.8cm` | 纸盒 |
| `MTL00064166` | 紧致肌肤护理霜标签 / `包材 - 标签 - 标签 - 标签` | `10x3cm` | 标签/印刷 |

纸盒候选选定后，应按物料索引从标签/印刷候选中排除，避免同一个纸盒编码和尺寸重复出现在标签卡。

### SKU 产品列表

```http
GET /api/Product/GetProductList?page=1&pageSize=20&codes={SKU}
```

可得到 `product_id`、`product_version_id`、`category_id`、产品名称、图片、包装字段等。它是继续读取产品模板字段的入口。

### 产品详情基础信息

```http
GET /api/Product/GetDetailInfo?product_id={product_id}&product_version_id={product_version_id}
```

主要用于读取产品基础信息和版本信息；净含量、毛重的实际模板值通常继续从下面的内容接口读取。

### 产品模板字段

```http
GET /api/Product/GetDetailContent?is_edit=false&product_id={product_id}&product_version_id={product_version_id}&category_id={category_id}
```

遍历 `data[].category_template_attrs[]`，按 `variable_name` 读取：

| variable_name | 含义 |
|---|---|
| `suttle` | 净含量（PLM 字段拼写如此） |
| `rough_weight` | 毛重 |
| `picture` | 产品图 |
| `main_image` | 主图 |
| `english_specification_diagram` | 英文尺寸图 |
| `detail_image` | 详情图 |

数值通常在 `attr_language_config_json[].value`；单位可参考 `attr_display_unit_id`，例如 `3` 通常为 g，`4` 通常为 ml。

## 文件和图包上传

### 获取 OSS 临时凭证

```http
POST /api/Common/GetOssClientSecretKey
Content-Type: application/json

{"upload_file_type":30}
```

返回临时 STS 凭证、bucket、上传目录、大小限制等。凭证短时有效，不得保存或写入源码。

### OSS 分片上传 ZIP

网页使用 Aliyun OSS SDK 进行 multipart upload：

```text
POST https://xyplm-pro.oss-cn-shenzhen.aliyuncs.com/{object_key}?uploads=
PUT  ...?partNumber=1&uploadId={upload_id}
PUT  ...?partNumber=2&uploadId={upload_id}
...
POST ...?uploadId={upload_id}
```

ZIP 内容不会被前端解压；分片只是传输层拆分，最终 OSS 中仍是一个完整 ZIP。大文件可能产生多个 part，小文件也可以走同一套 SDK 流程。

### 保存上传记录

```http
POST /api/Common/SaveUploadFileInfo

{
  "upload_file_type": 30,
  "oss_path": "xy/upload/Product/{date}/{user}/{random}.zip",
  "original_file_name": "原始图包.zip"
}
```

### 绑定 PLM 图包

```http
POST /api/Product/UploadArchiveFileFromExternal

{
  "archive_type_id": 7,
  "source": 2,
  "file_display_names": ["规范命名后的图包.zip"],
  "file_url_list": [
    {
      "file_original_name": "原始图包.zip",
      "file_save_full_path": "xy/upload/Product/{date}/{user}/{random}.zip"
    }
  ]
}
```

`archive_type_id: 7` 是图包素材。多个文件可放入数组，但每个文件都需要先完成自己的 OSS 上传和 `SaveUploadFileInfo`。

### 文件名和已有文件信息

页面“图包素材”区域的单个 ZIP 上限是 150MB；GetOssClientSecretKey(upload_file_type=30) 返回的 max_file_size=20MB 是通用授权提示，不能直接当作图包素材区域的页面限制。魔法上传对原始 ZIP 采用 150MB，图包内拆出的图片、视频和 XLSX 仍按各自普通文件限制处理。

```http
POST /api/Product/GenerateFileNameByRule
POST /api/Common/GetUploadFileInfo
POST /api/ProjectFormData/GetArchiveFileVersionListByFileVersionId
POST /api/Product/GetArchiveFileVersionListByFileVersionId
```

`GenerateFileNameByRule` 用于生成 PLM 规范文件名；`GetUploadFileInfo` 用 OSS 路径换原始文件名；`GetArchiveFileVersionListByFileVersionId` 用文件版本 ID 换归档文件名、路径、格式和大小。2026-07-31 的商品详情 HAR 实际调用的是 `ProjectFormData/GetArchiveFileVersionListByFileVersionId`；旧页面或其他模块仍可能调用 `Product/...`，实现时可按前者优先、后者兜底。

注意：`GenerateFileNameByRule` 的 `source_id` 不是新品项目列表的行 ID，也不是 `ChemicalNew/GetProjectDetail?id=...` 的项目 ID；当 `source: 2`（商品资料）时，应传目标商品的 `product_version_id`。例如原网页上传 SKU 时使用的是：

```json
{
  "source": 2,
  "source_id": 360089,
  "file_name_rules": ["主图", "_", "商品编码", "_", "品牌", "_", "商品名称", "_", "日期"],
  "file_extension_names": [".jpg"],
  "product_code": null
}
```

脚本上传前应先按 SKU 精确读取 `Product/GetProductList`，取得 `product_id` 和 `product_version_id`；并校验返回文件名包含目标 SKU，再执行 OSS 上传和 `UploadArchiveFileFromExternal` 绑定。否则生成的文件名可能来自另一条商品记录，绑定接口会把文件归到错误产品。

### BOM 效果图上传

效果图不走 `Product/UploadArchiveFileFromExternal`，也不会返回 `file_version_id`。它属于 BOM 效果图/玩具效果图上传链路，和图包 ZIP、商品主图、SKU 图、详情图等归档上传不是同一套接口。页面抓包确认的链路是：

```text
ChemicalNewDesignTask/GetProjectPMJoinList?id={project_id}
ChemicalNew/GetProjectEffectPicture?id={project_id}
→ Common/GetOssClientSecretKey(upload_file_type=40)
→ OSS multipartUpload
→ Common/SaveUploadFileInfo(upload_file_type=40)
→ ChemicalNewBom/MaterialBatchSaveAndSyncToProduct
```

授权请求示例：

```json
{"upload_file_type":40}
```

返回的目录形如：

```text
/xy/upload/CredentialsProduct/{date}/{user}
```

保存上传记录：

```json
{
  "upload_file_type": 40,
  "oss_path": "xy/upload/CredentialsProduct/{date}/{user}/{random}.jpg",
  "original_file_name": "SKU.jpg"
}
```

最后保存 BOM：

```json
{
  "project_id": 46291,
  "materials": [
    {
      "id": 96910,
      "pics": ["/xy/upload/Product/260427/74307/example.jpeg"],
      "code": "2-A0299-00058",
      "material_id": 234436,
      "material_type": 3,
      "usage_value": 1,
      "product_main_id": null,
      "type": 2
    }
  ],
  "effect_picture_files": [
    "xy/upload/CredentialsProduct/260731/74590/097596ac0d32173eaac64f302598c537.jpg"
  ]
}
```

注意：保存时要先读取现有 `effect_picture_files` 并追加新路径，避免覆盖已有效果图；`materials` 需要带当前 BOM 物料列表的最小字段，否则接口可能把物料状态写坏或保存失败。

### 产品文案 Word

产品文案不是 `GetDetailContent` 直接返回的文本，而是产品详情字段里的归档附件引用。读取当前 SKU 的 Word 可以按下面的链路执行：

```text
Product/GetProductList
→ Product/GetDetailContent
→ 找到 variable_name=product_description
→ 读取 attr_language_config_json[language_id=1].value 中的附件 ID
→ ProjectFormData/GetArchiveFileVersionListByFileVersionId（必要时回退 Product/...）
→ 取 file_format=docx 的 file_path
→ https://oss-pro.plm.westmonth.cn/{file_path}
→ 下载 DOCX 并解析 word/document.xml
```

详情字段示例：

```json
{
  "variable_name": "product_description",
  "attr_language_config_json": [
    { "language_id": 1, "value": [1104246] }
  ],
  "archive_type_attr_data": {
    "name": "产品文案",
    "file_format": ["doc", "docx", "pdf"]
  }
}
```

根据附件 ID 获取文件信息：

```http
POST /api/ProjectFormData/GetArchiveFileVersionListByFileVersionId
Content-Type: application/json

{"ids":[1104246]}
```

返回记录包含 `archive_file_version_id`、`file_name`、`file_path`、`file_format`、`create_at` 和 `is_invalid`。当前脚本优先选择匹配 SKU 的最新 `docx`，通过当前登录态读取接口和 OSS 文件，不保存 Cookie、Authorization 或临时密钥；API 失败时才回退到详情抽屉里的下载动作。

## 2026-07-30 图包生成抓包实录

本节根据 `plm.westmonth.com图包生成.har` 和同日 API JSON 整理。HAR 共 532 条记录，其中 234 条为 PLM `/api` 请求；API JSON 共 160 条，按最新时间在前排列。重放或分析时要按 `time` 升序还原步骤，并排除 APM、Sentry、静态资源和图片预览请求。

这次实际链路以一个商品 SKU 为例：先加载商品编辑态，保存一次商品草稿取得新版本，再生成 AI 图片，最后将 6 张主图和 10 张详情图逐张上传、归档并再次保存商品草稿。

### 1. 编辑页初始化和前置读取

打开商品编辑页时，页面会并行读取下面几类数据。它们主要用于拼装编辑表单和判断 AI 功能状态，不应误判成“图生成已经开始”：

| 目的 | 接口 |
|---|---|
| 当前商品和版本 | `GET /api/Product/GetProductList?page=1&pageSize=20&codes={SKU}`、`GET /api/Product/GetDetailInfoByEdit?product_id={product_id}&product_version_id={product_version_id}` |
| 可编辑字段和现值 | `GET /api/Product/GetDetailContent?is_edit=true&product_id={product_id}&category_id={category_id}&product_version_id={product_version_id}` |
| 模板/分类辅助数据 | `GetFixedAttrNameList`、`GetFileTypeSelectOption`、`GetUserSelectOption`、`GetLanguageSelectOption`、`GetFieldLanguageJoins?type=1`、`GetCategorySelectOptionNew`、`GetCategoryTempId`、`IsBottomCategory` |
| 商品下拉选项 | `GetAllBrandSelectOption`、`GetMeteringUnitSelectOption`、`GetProductGroupSelectOption`、`GetMaterialGroupSelectOption` |
| 编辑校验 | `GET /api/Product/CheckJstOldCodeForProduct?jstOldCode={SKU}&id={product_id}` |
| 原有附件和图片文件名 | `POST /api/ProjectFormData/GetArchiveFileVersionListByFileVersionId`（兼容 `Product/...`）、`POST /api/Common/GetUploadFileInfo` |
| AI 能力和任务状态 | `AccessAiCapabilities`、`CheckGetAiTextCheckTaskExists`、`CheckAiProductTextResultExists`、`CheckGenPicTaskExists` |
| 文案、标题检查和采购信息 | `GetProductTextAiResult`、`GetAiTitleCheckResult`、`ProductProcureInfo/GetTaxRate`、`GetProductPriceInfo`、`GetProductInvoiceInfo`、`ProductProcureInfo/GetProductProcureInfo`、`ProductProcureInfo/GetProductReferencePrice` |

供应商/人员下拉会分别调用 `GetManufactureDataSourceList`、`GetSrmSupplierDataSourceList`、`GetJdCustomerDataSourceList`、`GetDevUserDataSourceList` 和 `GetDesignUserDataSourceList`。页面通常先取分页列表，再用 `ids_ext` 取当前已选项；这些请求可按需懒加载。

商品展示读取和商品编辑保存的详情接口参数不同：展示字段可用 `is_edit=false`，要保存草稿必须先用 `is_edit=true` 读取完整的可编辑值。`GetDetailContent` 返回的模板属性要展开成：

```json
{
  "attr_id": 123,
  "language_id": 1,
  "value": "原值或新值"
}
```

不要只提交本次变化的一个字段。原始 HAR 中保存请求的 `attr_values` 有 210 项（每项只有 `attr_id`、`language_id`、`value`）；配套 API JSON 对同一类请求只记录了 40 项，说明该 JSON 不是原始请求体的完整替代品，字段数量不能硬编码。

### 2. 先保存商品草稿，推进版本号

图像归档使用的是商品资料来源 `source: 2`，所以必须先取得当前商品的最新 `product_version_id`。保存接口的请求体由编辑页完整表单组成，至少要保留以下结构：

```http
POST /api/Product/SaveProductDraftByEdit
Content-Type: application/json
```

```json
{
  "product_id": 259926,
  "product_version_id": 386352,
  "code": "SKU00046982",
  "language_config": [
    { "language_id": 1, "product_name": "中文品名", "product_remark": null },
    { "language_id": 2, "product_name": "English name", "product_remark": null }
  ],
  "product_type": 1,
  "style_code": "SKU00046982",
  "category_id": 362,
  "product_group_id": 3,
  "product_procure_infos": [],
  "is_need_to_process_product_procure_infos": true,
  "attr_values": [
    { "attr_id": 123, "language_id": 1, "value": "..." }
  ]
}
```

实际保存还会带品牌、分类、结算、单位换算、JST 旧编码、SRS 和采购字段。应从 `GetDetailInfoByEdit` 和 `GetDetailContent?is_edit=true` 保留原表单字段，只合并需要改变的值。返回值至少检查 `id`、`code` 和 `product_version_id`。

抓包确认的版本变化是：首次保存使用旧版本 `386352`，返回新版本 `388565`；后续保存使用 `388565` 并继续返回 `388565`。因此保存响应一到，就要把队列、命名和后续归档的当前版本全部更新为响应中的版本号。

### 3. AI 文案输入和图片生成

页面先用下面的接口准备生成输入：

```http
GET  /api/Product/GetProductTextAiResult?code={SKU}
POST /api/Product/GetAiTitleCheckResult   {"code":"{SKU}","language":1}
POST /api/Product/GetAiTitleCheckResult   {"code":"{SKU}","language":2}
```

`GetProductTextAiResult` 的 `data.textList` 是文案字段列表；抓包中有 14 个字段。`GetGenPicAiResult` 的首次提交请求除了 `code`，还会带 `copywrite`（文案对象数组，抓包中 12 个字段）以及四个成分字段：

```json
{
  "code": "SKU00046982",
  "copywrite": [
    {
      "id": 1,
      "type": "product_name",
      "title": "Product Name",
      "title_cn": "产品名",
      "value": "...",
      "value_cn": "..."
    }
  ],
  "product_ingredients_efficacy_ch": "...",
  "product_ingredients_summary_ch": "...",
  "product_ingredients_efficacy_en": "...",
  "product_ingredients_summary_en": "..."
}
```

接口是“提交和查询”复用同一路径：

```http
POST /api/Product/GetGenPicAiResult
{"code":"{SKU}","copywrite":[...],"product_ingredients_summary_ch":"..."}
```

提交后不要重复提交完整文案；后续轮询只发送：

```json
{"code":"SKU00046982"}
```

返回状态按 `data.status` 判断：

| `status` | 含义 | 处理 |
|---|---|---|
| `1` | 任务执行中，`job_id` 可能为 `null` | 延时轮询，不上传图片 |
| `2` | 执行成功 | 读取 `job_id`、`mainImages`、`detailImages` |
| 其他/HTTP 非 2xx | 失败或异常 | 记录 `message`，停止该 SKU 的上传 |

成功结果的图片对象形如 `{"url":"https://ai-obj.westmonth.com/...png","filename":"input-main-prompt-1.png"}`。本次抓包得到 `mainImages` 6 项、`detailImages` 10 项。`CheckGenPicTaskExists?code={SKU}` 可用于提交前防重复；拿到 `job_id` 后页面还会调用 `CheckReGenPicTaskExists?code={SKU}&job_id={job_id}`，但它不能替代 `GetGenPicAiResult` 的结果轮询。文案任务的 `CheckGetAiTextCheckTaskExists?code={SKU}&language=1|2` 是另一条状态链。

### 4. AI 图片反馈

生成结果展示前，页面分别按主图和详情图查询用户反馈：

```http
POST /api/Ai/GetCurrentUserFeedback
{
  "product_code": "SKU00046982",
  "module": "主图",
  "image_urls": ["*"]
}
```

`module` 实际使用 `主图` 或 `详情图`；响应是包含 `image_url`、`has_feedback`、`feedback_type` 的数组。用户提交反馈时调用：

```http
POST /api/Ai/SubmitFeedback
{
  "product_code": "SKU00046982",
  "module": "主图",
  "feedback_content": "...",
  "image_url": "*"
}
```

抓包中 `feedback_content` 出现过 `"[object Object]"`，这是前端序列化结果，不应当被当作可靠的业务格式；重放或实现时应先确认服务端期望的是纯文本还是 JSON 字符串。

### 2026-08-05 单张 AI 智能修图

2026-08-05 的 `plm.westmonth.comai修改图包.har` 确认了“智能修图”链路。它不是整组图重新生成，而是对当前选中的一张 AI 图片附加修改提示词后重新生成一张图片。

请求接口：

```http
POST /api/ProjectFormData/GetRetouchAiResult
Content-Type: application/json;charset=UTF-8
```

请求体：

```json
{
  "code": "SKU00047320",
  "prompt": "去掉产品后面的纸盒",
  "image": "https://ai-obj.westmonth.com/ai-base-svc/20260730/1785408992257_8711.png"
}
```

字段说明：

- `code`：当前 SKU。
- `prompt`：用户输入的单张图片修改提示词。
- `image`：当前选中的原图完整 URL，不是文件名，也不是 `mainImages`/`detailImages` 下标。

成功响应中的 `data` 是新图片 URL 字符串，不是图片对象：

```json
{
  "data": "https://ai-obj.westmonth.com/ai-base-svc/images/20260805/1785912660991_3752.png",
  "code": 0,
  "success": true,
  "message": ""
}
```

前端收到成功响应后，再 GET `data` 中的 URL 展示新图片。该接口在抓包中同步等待约 45 秒，没有返回 `job_id`，也没有观察到轮询接口；实现时应为它设置明显长于普通读取请求的超时时间，并避免同一提示词重复提交。返回 URL 位于 `/ai-base-svc/images/` 路径，且接口不返回原始文件名，脚本如需保存应自行生成显示名。

本次只观察到“生成并展示新图”，没有观察到把新图上传到 OSS、登记 PLM 归档或保存商品草稿的后续动作。若要把修图结果正式写回商品，仍需另行执行本手册后面的 OSS 上传、`SaveUploadFileInfo`、`UploadArchiveFileFromExternal` 和商品草稿保存链路；不能把 `GetRetouchAiResult` 的返回 URL 当作已归档文件。

### 5. 每张图片的 OSS 和 PLM 归档链路

AI 结果不是 ZIP，而是多张独立 PNG。每个图片文件都要完成下面的依赖链，16 张图片可以并发，但每一张都要独立登记：

```text
GetGenPicAiResult 成功
→ GenerateFileNameByRule
→ GetOssClientSecretKey(upload_file_type=30)
→ Aliyun OSS multipartUpload
→ SaveUploadFileInfo(upload_file_type=30)
→ UploadArchiveFileFromExternal
```

主图和详情图的规范命名规则分别是：

```json
["主图","_","商品编码","_","品牌","_","商品名称","_","日期"]
["详情图","_","商品编码","_","品牌","_","商品名称","_","日期"]
```

命名请求必须使用最新商品版本：

```json
{
  "source": 2,
  "source_id": "{current_product_version_id}",
  "file_name_rules": ["主图","_","商品编码","_","品牌","_","商品名称","_","日期"],
  "file_extension_names": [".png"],
  "product_code": null
}
```

`GenerateFileNameByRule` 返回一个规范文件名数组。它与 AI 结果的 `filename` 角色不同：前者写入 `file_display_names`，后者写入 `file_url_list[].file_original_name`。OSS 随机对象路径写入 `file_url_list[].file_save_full_path`。

本次图片上传使用 `upload_file_type: 30`，临时目录形如 `/xy/upload/Product/{date}/{user}`，返回的单文件 `max_file_size` 为 20 MiB。STS 只用于当前短时上传；不要缓存密钥到文件、日志或代码。SDK 的实际传输是 `?uploads=` 创建 multipart upload，随后 `partNumber`/`uploadId` 分片 PUT，最后以 `uploadId` 完成；OPTIONS 是 CORS 预检，不是业务步骤。

登记 OSS 文件：

```json
{
  "upload_file_type": 30,
  "oss_path": "xy/upload/Product/{date}/{user}/{random}.png",
  "original_file_name": "AI 结果中的原始 filename"
}
```

登记接口成功时通常只有 `code/success/message`，没有可供后续绑定的文件版本 ID。随后绑定 PLM 归档：

```json
{
  "archive_type_id": 1,
  "source": 2,
  "file_display_names": ["GenerateFileNameByRule 返回值"],
  "file_url_list": [
    {
      "file_original_name": "input-main-prompt-1.png",
      "file_save_full_path": "xy/upload/Product/{date}/{user}/{random}.png"
    }
  ]
}
```

AI 生成的主图和详情图在本次抓包中使用 `archive_type_id: 1`，每次请求返回 `data[]`，应保存其中的 `file_version_id`。这与图包素材 ZIP 的 `archive_type_id: 7` 不是同一类归档，不能混用。

### 6. 上传完成后的保存和结果确认

16 张图片全部完成 `UploadArchiveFileFromExternal` 后，页面再次调用 `SaveProductDraftByEdit`，将新增的文件版本 ID 写入相应模板字段。默认模式是保留原有 ID 并追加；替换模式则只替换本次上传涉及的分类，未涉及的分类仍原样保留。抓包中保存请求成功后又调用 `GetProductList` 刷新列表，并在短时间内重复保存一次；这说明前端可能有自动保存/手动保存的双触发，脚本应使用幂等或去重保护。

文件字段仍按 `GetDetailContent?is_edit=true` 返回的 `variable_name` 映射，不要按图片 URL 或显示名称猜字段。当前已确认的候选字段包括 `main_image`、`detail_image`、`sku_pic`、`english_specification_diagram`、`product_parameter_diagram`、`video`、`animated_image`、`image_package_materials` 和 `promotion_materials`。

### 7. 2026-07-31 新 HAR：查询现有图片和替换

商品当前图片可在加入魔法上传任务时预检查：

```text
Product/GetProductList?codes={SKU}
→ Product/GetDetailContent?is_edit=false&product_id={product_id}&product_version_id={product_version_id}&category_id={category_id}
→ 读取 data[].category_template_attrs[] 中的 variable_name 和 attr_language_config_json[].value
→ ProjectFormData/GetArchiveFileVersionListByFileVersionId {"ids":[...]}
```

图片、视频、推品资料和图包素材通常是 `attr_type: 12`，值是文件版本 ID 数组。空字段在不同商品/模板中可能返回 `null` 或 `[]`，两者都应按“没有现有文件”处理。当前 HAR 确认的字段映射为：

| 页面分类 | `variable_name` |
|---|---|
| 主图 | `main_image` |
| 英文参数图 | `english_specification_diagram` |
| 详情图 | `detail_image` |
| SKU图 | `sku_pic` |
| 视频 | `video` |
| 动图 | `animated_image` |
| 推品资料 | `promotion_materials` |
| 图包素材 | `image_package_materials` |
| 版权图 | `copyright` |
| 标签尺寸图 | `label_dimension_diagram` |
| 印刷尺寸图 | `print_dimension_diagram` |
| 纸盒尺寸图 | `carton_dimension_diagram` |
| 产品文案 | `product_description` |

模板中还会出现“中文参数图”（`attr_id: 2758`）和“操作视频”（`attr_id: 410`）这类 `variable_name: null` 的字段。需要按 `attr_id`/`attr_name` 兜底，不能只依赖 `variable_name` 做全量字段映射。

替换不是物理删除归档文件。上传新文件并拿到新的 `file_version_id` 后，保存草稿时把本次涉及分类的旧数组清空，再写入新 ID；其他没有上传的分类继续保留。当前 HAR 没有观察到独立的“删除图包”业务接口，删除/替换效果由 `SaveProductDraftByEdit` 的完整 `attr_values` 快照产生。保存成功会返回新的 `product_version_id`，必须写回任务并用于后续重试。

产品列表还会返回 `version_status`、`audit_status`、`has_bom_children` 和 `btns`。例如已被 BOM 引用的产品可能返回“不能删除”，这属于产品操作权限/状态，不等于图片字段不能通过草稿保存更新。

本次抓包只确认了“保存草稿”，没有出现 `Product/Arraign` 提审请求；因此日志只能写“文件已上传并保存草稿”，不能据此写“已提审”。

#### 7.1 2026-08-03 HAR：正面文案图、SKU 图和鉴权重试

`plm.westmonth.com侵权图.har` 进一步确认了只读详情接口的字段和值。以项目 `46996`、SKU `SKU00048011` 为例，读取链路为：

```text
ChemicalNew/GetProjectDetail?id=46996
→ 取得 product_id=263171、product_version_id=389686、category_id=307
→ Product/GetProductList?codes=SKU00048011
→ Product/GetDetailContent?is_edit=false&product_id=263171&product_version_id=389686&category_id=307
```

`GetDetailContent?is_edit=false` 本次返回 17 组、146 个模板属性；实际值仍主要位于 `data[].category_template_attrs[].attr_language_config_json[].value`。本次 HAR 中的图片字段结果如下：

| 页面字段 | `variable_name` | 本次结果 | 说明 |
|---|---|---|---|
| 产品正面文案 | `front_product_copy` | 有值 | 返回 OSS 路径数组，可直接拼接 OSS 域名获取 PNG |
| SKU 图 | `sku_pic` | 空 | 该 SKU 没有已绑定的 SKU 图；`null` 和 `[]` 都按无文件处理 |
| 主图 | `main_image` | 空 | 该 SKU 本次没有已绑定主图 |
| 详情图 | `detail_image` | 空 | 该 SKU 本次没有已绑定详情图 |
| 产品参数图 | `product_parameter_diagram` | 空 | 该 SKU 本次没有已绑定参数图 |
| 版权图 | `copyright` | 空 | 本次没有发现已绑定的版权/侵权图 |
| 产品列表图片 | `picture` | 空 | `GetProductList` 中的 `picture` 也为空 |

本次正面文案图的值类似：

```json
{
  "variable_name": "front_product_copy",
  "attr_language_config_json": [
    {"language_id": 1, "value": ["/xy/upload/Product/...png"]}
  ]
}
```

图片字段的值类型不能统一假设为文件版本 ID：

- 路径字符串数组（如 `front_product_copy`）：去掉开头的 `/` 后拼接 `https://oss-pro.plm.westmonth.cn/`，即可请求实际文件；
- 数字数组（如 `product_description` 的附件引用，或其他商品可能出现的图片附件）：调用 `ProjectFormData/GetArchiveFileVersionListByFileVersionId`，必要时回退 `Product/GetArchiveFileVersionListByFileVersionId`，再使用返回的 `file_path`；
- 需要显示原文件名时，可调用 `Common/GetUploadFileInfo`，请求体为 `{"oss_paths":[...]}`。这个接口只补充文件名，不是获取图片内容的必要步骤。

`ChemicalNew/GetProjectDetail` 返回的 `project.main_pic` 是项目参考/封面图，路径通常位于 `Demand/`；`pms[].pics` 是物料图片。这两类图片都不能直接当作 SKU 图使用。

本次 HAR 还观察到 `GetProductList`、`GetDetailContent`、`GetDetailInfo` 均出现过“第一次 HTTP 401（鉴权失败），紧接着同一 URL 返回 200”的情况，间隔约几十毫秒，且可见的租户请求头相同。因此读取策略应为：

1. 单次 401、超时或网络错误先重试，重试时重新取得当前页面的认证头；不要立即把 401 当成“SKU 不存在”或“详情为空”。
2. 产品列表成功但详情字段失败时，只对详情阶段重试或启用详情兜底，不要丢弃已经拿到的产品基础数据。
3. 必要的产品列表和详情接口在有限次数重试后仍失败，再按需加载抽屉自动化/DOM 兜底代码。这样可以避免 HAR 中这种瞬时 401 直接触发抽屉。

因此，API 可以在不打开详情抽屉的情况下读取产品详情；但“API 有字段”与“当前 SKU 已填写该字段”需要分开判断。当前脚本若要使用正面文案图，应单独映射 `front_product_copy`，不要把它误记为 `sku_pic` 或普通产品列表图片。

## 当前用户脚本的读取链路

```text
详情抽屉或悬浮窗切换 SKU
→ ChemicalNew/GetProjectDetail
→ pms 清洗纸盒、标签、印刷尺寸
→ Product/GetProductList
→ Product/GetDetailContent
→ 读取 suttle / rough_weight
→ ProjectFormData/GetArchiveFileVersionListByFileVersionId（必要时回退 Product/...）
→ 下载并解析产品文案 DOCX
→ 保存 SKU 缓存
```

如果某一步失败，日志应明确显示项目接口、产品列表或产品详情字段阶段；项目物料结果仍可单独保留。

## 图包上传后的商品草稿保存

`UploadArchiveFileFromExternal` 只会把 OSS 文件登记为 PLM 归档文件，返回的 `file_version_id` 还没有写入商品的主图、详情图、SKU 图等字段。因此上传日志不能在这一步写“文件绑定完成”。完整的商品字段绑定必须继续执行：

```text
UploadArchiveFileFromExternal
→ 取得 data[].file_version_id
→ GetDetailInfoByEdit
→ GetDetailContent?is_edit=true，读取全部 attr_values
→ 将新 file_version_id 合并到对应 variable_name 的中文字段
→ SaveProductDraftByEdit
→ Product/Arraign
```

当前魔法上传按 `variable_name` 映射分类：`main_image`、`english_specification_diagram`、`detail_image`、`sku_pic`、`product_parameter_diagram`、`video`、`animated_image`、`image_package_materials` 和 `promotion_materials`。加入任务后先查询当前分类是否已有文件；有则标记为“替换任务”。任务真正开始保存草稿时再次读取最新字段，仅替换本次上传涉及的分类，避免加入队列后商品被其他人修改造成旧快照覆盖。任一模板字段或文件版本 ID 缺失都会阻止提审。`SaveProductDraftByEdit` 返回的新 `product_version_id` 需要写回队列，后续重试重新读取最新版本。

## 风险和注意事项

- 上传接口会产生外部写入，必须由用户明确触发；读取接口可以后台自动执行。
- STS 凭证只用于短时上传，不能当作固定 token 使用。
- HAR、cURL 和 Network 请求可能包含临时令牌，分享前应使用 Chrome 的“已清理 HAR”并再次检查。
- API 字段和归档类型是基于当前 PLM 页面抓包确认的，PLM 升级后应重新监听验证。
