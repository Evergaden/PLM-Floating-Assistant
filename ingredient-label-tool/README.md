# 成分表 PDF 小工具

这是一个本地运行的 Supplement Facts 生成器。默认值对应参考文件 `成分表男士活力支持胶囊（入口）.pdf`，版式按参考 PDF 的 A4 坐标绘制。

## 启动

在此目录打开 PowerShell：

```powershell
python -m pip install -r requirements.txt
python server.py --open
```

然后在浏览器中编辑表头和成分行。点击“生成并下载 PDF”后，文件会保存到仓库的 `output/pdf/ingredient-label/`，浏览器同时开始下载。

也可以双击 `启动.bat`。工具只监听 `127.0.0.1`，输入内容不会上传。

## 输入字段

- `Serving Size`：例如 `2 Capsules`，会生成参考图一处的第一行。
- `Servings Per Container`：例如 `30`，会生成参考图一处的第二行。
- 每一行填写成分名称、`Amount Per Serving` 和 `% Daily Value`；没有既定 DV 的行填写 `**`。
- 当前单页最多 18 行，先保持参考 PDF 的单行高度；后续可以继续增加多页、中文字体和更细的版式调节。

## 命令行检查

```powershell
python server.py --sample
```

会用参考示例生成 `output/pdf/ingredient-label/supplement-facts-sample.pdf`。
