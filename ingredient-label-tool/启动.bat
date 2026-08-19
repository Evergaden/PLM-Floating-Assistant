@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  set "PYTHON=py -3"
) else (
  set "PYTHON=python"
)
%PYTHON% -c "import reportlab" >nul 2>&1
if errorlevel 1 (
  echo 正在安装 PDF 生成依赖...
  %PYTHON% -m pip install -r requirements.txt
  if errorlevel 1 (
    echo 依赖安装失败，请手动运行：%PYTHON% -m pip install -r requirements.txt
    pause
    exit /b 1
  )
)
%PYTHON% server.py --open
pause
