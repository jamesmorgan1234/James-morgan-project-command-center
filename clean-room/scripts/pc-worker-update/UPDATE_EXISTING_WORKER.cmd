@echo off
powershell.exe -NoLogo -NoProfile -File "%~dp0UPDATE_EXISTING_WORKER.ps1"
if errorlevel 1 echo Update did not complete. No re-pairing or new task was requested.
pause
