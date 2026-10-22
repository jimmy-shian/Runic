@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-apk.ps1" %*
set "BUILD_EXIT=%ERRORLEVEL%"
if not "%CI%"=="true" pause
exit /b %BUILD_EXIT%
