Write-Host "Starting BreadBasket Full Stack Application..." -ForegroundColor Green

# Start backend services
Write-Host "Starting backend services..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$PSScriptRoot\BreadBasket\backend\start_services.ps1`""

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\BreadBasket\frontend"
Start-Process npm -ArgumentList "start"

Write-Host "BreadBasket application is now running!" -ForegroundColor Green
Write-Host "Frontend will open in your browser shortly." -ForegroundColor Yellow
Write-Host "Press any key to close this window (services will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 