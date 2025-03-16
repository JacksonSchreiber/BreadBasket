from playwright.sync_api import sync_playwright
from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

def scrape_publix(zip_code, item="milk"):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--deny-permission-prompts"],)
        context = browser.new_context()
        page = context.new_page()

        # Go to Publix ZIP code page
        page.goto("https://www.publix.com/locations")
        page.fill('input[placeholder="Enter a City, State, or Zip Code"]', zip_code)
        page.keyboard.press("Enter")
        page.wait_for_selector('span.button__label:has-text("Choose store")', timeout=5000)

        # Click first store button to load
        page.locator('span.button__label:has-text("Choose store")').first.click()

        # Search for item
        page.goto(f"https://www.publix.com/search")
        page.fill('input[placeholder="Search products, savings, or recipes"]', item)
        page.keyboard.press("Enter")

        page.wait_for_selector('card-list', timeout = 5000)
        page.locator('img').first.click()

        # Extract product data
        #items = page.locator(".product-card").all()
        #results = []

        #for item in items:
        #    try:
        #        title = item.locator(".product-title").text_content()
        #        price = item.locator(".product-price").text_content()
        #        results.append({"title": title, "price": price})
        #    except:
        #        continue
        input("Press Enter to close the browser...")

        browser.close()
        #return results

@app.route('/api/publix', methods=['POST'])
def get_publix_prices():
    data = request.json
    zip_code = data.get('zipCode')
    item = data.get('item', 'milk')

    prices = scrape_publix(zip_code, item)
    print(prices)
    return jsonify({'publix_prices': prices})

if __name__ == '__main__':
    app.run(debug=True)