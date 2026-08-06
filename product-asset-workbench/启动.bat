@echo off
setlocal EnableExtensions
chcp 65001 >nul
set PYTHONUTF8=1
set "LAUNCH_LOG=%~dp0startup.log"

cd /d "%~dp0"
if errorlevel 1 (
  echo Unable to open the application folder.
  pause
  exit /b 1
)

> "%LAUNCH_LOG%" echo [%DATE% %TIME%] Starting Product Asset Workbench
>> "%LAUNCH_LOG%" echo Working directory: %CD%

where py >nul 2>nul
if not errorlevel 1 goto :launch_with_py

where python >nul 2>nul
if not errorlevel 1 goto :launch_with_python

echo Python 3.10 or newer was not found.
echo Install Python, then double-click this file again.
>> "%LAUNCH_LOG%" echo ERROR: Python was not found on PATH.
pause
exit /b 1

:launch_with_py
echo Starting Product Asset Workbench...
py -3 bootstrap.py >> "%LAUNCH_LOG%" 2>&1
goto :finished

:launch_with_python
echo Starting Product Asset Workbench...
python bootstrap.py >> "%LAUNCH_LOG%" 2>&1

:finished
set "APP_EXIT=%ERRORLEVEL%"
if "%APP_EXIT%"=="0" exit /b 0

echo.
echo The program could not start. The error log is:
echo %LAUNCH_LOG%
echo.
type "%LAUNCH_LOG%"
pause
exit /b %APP_EXIT%
