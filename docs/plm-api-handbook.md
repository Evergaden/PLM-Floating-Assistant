# PLM API 手册

更新日期：2026-07-29

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

```http
POST /api/Product/GenerateFileNameByRule
POST /api/Common/GetUploadFileInfo
POST /api/Product/GetArchiveFileVersionListByFileVersionId
```

`GenerateFileNameByRule` 用于生成 PLM 规范文件名；后两个接口用于根据 OSS 路径或文件版本 ID 获取文件信息。

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

### 产品文案 Word

产品文案不是 `GetDetailContent` 直接返回的文本，而是产品详情字段里的归档附件引用。读取当前 SKU 的 Word 可以按下面的链路执行：

```text
Product/GetProductList
→ Product/GetDetailContent
→ 找到 variable_name=product_description
→ 读取 attr_language_config_json[language_id=1].value 中的附件 ID
→ Product/GetArchiveFileVersionListByFileVersionId
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
POST /api/Product/GetArchiveFileVersionListByFileVersionId
Content-Type: application/json

{"ids":[1104246]}
```

返回记录包含 `archive_file_version_id`、`file_name`、`file_path`、`file_format`、`create_at` 和 `is_invalid`。当前脚本优先选择匹配 SKU 的最新 `docx`，通过当前登录态读取接口和 OSS 文件，不保存 Cookie、Authorization 或临时密钥；API 失败时才回退到详情抽屉里的下载动作。

## 当前用户脚本的读取链路

```text
详情抽屉或悬浮窗切换 SKU
→ ChemicalNew/GetProjectDetail
→ pms 清洗纸盒、标签、印刷尺寸
→ Product/GetProductList
→ Product/GetDetailContent
→ 读取 suttle / rough_weight
→ Product/GetArchiveFileVersionListByFileVersionId
→ 下载并解析产品文案 DOCX
→ 保存 SKU 缓存
```

如果某一步失败，日志应明确显示项目接口、产品列表或产品详情字段阶段；项目物料结果仍可单独保留。

## 风险和注意事项

- 上传接口会产生外部写入，必须由用户明确触发；读取接口可以后台自动执行。
- STS 凭证只用于短时上传，不能当作固定 token 使用。
- HAR、cURL 和 Network 请求可能包含临时令牌，分享前应使用 Chrome 的“已清理 HAR”并再次检查。
- API 字段和归档类型是基于当前 PLM 页面抓包确认的，PLM 升级后应重新监听验证。
