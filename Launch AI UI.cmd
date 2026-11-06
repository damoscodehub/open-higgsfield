@echo off
setlocal EnableExtensions

rem Run from this file's folder, so the launcher also works after moving or cloning the project.
cd /d "%~dp0" || (
  echo Could not open the app folder.
  pause
  exit /b 1
)

where pnpm >nul 2>nul || (
  echo pnpm is not installed. Install it once with:
  echo   npm install -g pnpm@11
  pause
  exit /b 1
)

rem Skip installation when the installed dependency lock matches the committed lockfile.
if not exist "node_modules\.pnpm\lock.yaml" goto :install
fc /b "pnpm-lock.yaml" "node_modules\.pnpm\lock.yaml" >nul
if errorlevel 1 goto :install
goto :start

:install
echo Installing project dependencies. This only runs after dependency changes.
call pnpm install --frozen-lockfile
if errorlevel 1 (
  echo.
  echo Dependencies could not be installed. See the message above and try again.
  pause
  exit /b 1
)

:start
rem Reuse an already-running app instead of opening a second server on the same port.
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { Start-Process 'http://localhost:3000'; exit 0 }; exit 1"
if not errorlevel 1 exit /b 0

echo Starting AI UI. A server window will remain open while the app is running.
start "AI UI server" /D "%CD%" cmd /k pnpm dev

rem Wait up to 30 seconds for Next.js to listen before opening the browser.
powershell -NoProfile -Command "$deadline = (Get-Date).AddSeconds(30); while ((Get-Date) -lt $deadline) { if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { Start-Process 'http://localhost:3000'; exit 0 }; Start-Sleep -Milliseconds 500 }; exit 1"
if errorlevel 1 (
  echo The app did not start within 30 seconds. Check the AI UI server window for details.
  pause
)
