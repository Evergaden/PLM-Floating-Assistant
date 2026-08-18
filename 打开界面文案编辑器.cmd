@echo off
start "PLM interface copy editor" powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0scripts\ui-copy-editor.ps1"
