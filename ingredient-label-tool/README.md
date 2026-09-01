# 成分表 PDF 小工具

这是一个本地运行的 Supplement Facts 生成器。默认值对应参考文件 `成分表男士活力支持胶囊（入口）.pdf`，版式按参考 PDF 的 A4 坐标绘制。

## 启动

在此目录打开 PowerShell：

```powershell
python -m pip install -r requirements.txt
python server.py --open
```

然后在浏览器中编辑表头和成分行。点击“生成并下载 PDF”后，文件会保存到仓库的 `output/pdf/ingredient-label/`，浏览器同时开始下载。

页面里的“载入 60 mL 滴剂目标”会填入人用滴剂目标草案：Serving Size 1 mL、Servings Per Container 60、每份活性合计 700 mg、标准化标志物至少 30%。每行都要求在括号内写对应 Latin scientific name；“标志物 mg”用于核对标准化活性比例，Other Ingredients 会绘制在 Supplement Facts 下方。该目标只用于配方草案和版式预览，最终身份、含量、COA、稳定性和标签声明仍需供应商及法规人员确认。

也可以双击 `启动.bat`。工具只监听 `127.0.0.1`，输入内容不会上传。

## 输入字段

- `Serving Size`：例如 `2 Capsules`，会生成参考图一处的第一行。
- `Servings Per Container`：例如 `30`，会生成参考图一处的第二行。
- 每一行填写成分名称、`Amount Per Serving`、`% Daily Value` 和可选的“标志物 mg”；没有既定 DV 的行填写 `**`，名称括号内要保留对应拉丁学名。
- `Other Ingredients` 用英文逗号分隔；目标模式下必填，且不计入活性合计。
- `活性目标` 和 `标准化活性目标` 为本地生成前校验，填 `0` 可关闭对应校验。
- 当前单页最多 18 行，先保持参考 PDF 的单行高度；后续可以继续增加多页、中文字体和更细的版式调节。

## 命令行检查

```powershell
python server.py --sample
```

会用参考示例生成 `output/pdf/ingredient-label/supplement-facts-sample.pdf`。
