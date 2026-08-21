@echo off
setlocal

cd /d "%~dp0"

set "APP_URL=http://localhost:5173/"

where npm >nul 2>nul
if errorlevel 1 (
  echo 未检测到 npm，请先安装 Node.js 后再双击此文件。
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$url = '%APP_URL%';" ^
  "$projectPath = (Resolve-Path '.').Path;" ^
  "$isRunning = $false;" ^
  "try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -ge 200) { $isRunning = $true } } catch {}" ^
  "if (-not $isRunning) {" ^
  "  Start-Process powershell -ArgumentList '-NoExit','-ExecutionPolicy','Bypass','-Command',('Set-Location -LiteralPath ''' + $projectPath + '''; npm run dev -- --host 0.0.0.0');" ^
  "  for ($i = 0; $i -lt 20; $i++) {" ^
  "    Start-Sleep -Milliseconds 700;" ^
  "    try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1; if ($response.StatusCode -ge 200) { $isRunning = $true; break } } catch {}" ^
  "  }" ^
  "}" ^
  "Start-Process $url;" ^
  "if (-not $isRunning) { Write-Host '开发服务器正在启动中，浏览器已尝试打开。若页面暂未显示，请等待 2-5 秒后刷新。' }"

endlocal
