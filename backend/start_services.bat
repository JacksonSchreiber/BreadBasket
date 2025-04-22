@echo off
echo Starting BreadBasket Backend Services...

REM Start the main backend app
start cmd /k "python app.py"

REM Start the scrapers
start cmd /k "python publix_scraper.py"
start cmd /k "python aldi_scraper.py"
start cmd /k "python kroger.py"

echo All services started! You can close this window. 