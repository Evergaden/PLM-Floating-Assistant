# PLM API 手册

更新日期：2026-07-29

站点：`https://plm.westmonth.com`

## 通用调用方式

- 读取接口使用当前登录网页会话，浏览器请求带 `credentials: same-origin`。
- 不要把 Cookie、Authorization、STS 密钥写入脚本或提交到 Git。
- 常见请求头由网页自动补充：`x-app-code: PLM`、`x-tenant-code: xy`、`x-tenant-id: xy`。
- 读取请求建议设置 15 秒超时，并对 HTTP 非 2xx 做错误处理。

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
POST /api/ProjectFormData/GetArchiveFileVersionListByFileVersionId
```

`GenerateFileNameByRule` 用于生成 PLM 规范文件名；后两个接口用于根据 OSS 路径或文件版本 ID 获取文件信息。

## 当前用户脚本的读取链路

```text
详情抽屉或悬浮窗切换 SKU
→ ChemicalNew/GetProjectDetail
→ pms 清洗纸盒、标签、印刷尺寸
→ Product/GetProductList
→ Product/GetDetailContent
→ 读取 suttle / rough_weight
→ 保存 SKU 缓存
```

如果某一步失败，日志应明确显示项目接口、产品列表或产品详情字段阶段；项目物料结果仍可单独保留。

## 风险和注意事项

- 上传接口会产生外部写入，必须由用户明确触发；读取接口可以后台自动执行。
- STS 凭证只用于短时上传，不能当作固定 token 使用。
- HAR、cURL 和 Network 请求可能包含临时令牌，分享前应使用 Chrome 的“已清理 HAR”并再次检查。
- API 字段和归档类型是基于当前 PLM 页面抓包确认的，PLM 升级后应重新监听验证。
