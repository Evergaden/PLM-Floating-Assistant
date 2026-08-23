# PLM 远程工作台 Android

Capacitor Android 壳，加载 `https://velvet.qzz.io/remote/`。手机不上传产品文件，所有远程任务仍由电脑端资产工作台执行。

```powershell
npm.cmd install
npm.cmd run sync
npm.cmd run build:apk
```

可直接安装的测试 APK 输出到 `android/app/build/outputs/apk/debug/`。正式面向应用商店发布时，应使用独立的长期保管签名密钥构建 AAB；仓库不保存签名密钥。
