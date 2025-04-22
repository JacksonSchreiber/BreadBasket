Write-Host "Starting BreadBasket Backend Services..." -ForegroundColor Green

# Start the main backend app
Start-Process -FilePath "python" -ArgumentList "app.py" -WindowStyle Normal

# Start the scrapers
Start-Process -FilePath "python" -ArgumentList "publix_scraper.py" -WindowStyle Normal
Start-Process -FilePath "python" -ArgumentList "aldi_scraper.py" -WindowStyle Normal
Start-Process -FilePath "python" -ArgumentList "kroger.py" -WindowStyle Normal

Write-Host "All services started!" -ForegroundColor Green
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 