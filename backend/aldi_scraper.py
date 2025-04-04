from playwright.sync_api import sync_playwright
from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

def scrape_aldi(zip_code, item="milk"):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, args=["--deny-permission-prompts"],)
        context = browser.new_context()
        page = context.new_page()

        # Go to Aldi ZIP code page
        page.goto("https://stores.aldi.us/")
        #page.fill('input[placeholder="Search by city and state or postal code"]', zip_code)
        #page.keyboard.press("Enter")
        #page.wait_for_selector('span.button__label:has-text("Choose store")', timeout=5000)

        ## Click first store button to load
        #page.locator('span.button__label:has-text("Choose store")').first.click()

        ## Search for item
        #page.goto(f"https://www.aldi.com/search")
        #page.locator('span.button__label:has-text("Delivery & curbside")').first.click()
        #page.locator('span.button__label:has-text("Proceed to Instacart")').first.click()
        #page.locator('span.e-e2f3my:has-text("Confirm")').click()
        #page.fill('input[id="search-bar-input"]', item)
        #page.keyboard.press("Enter")
        #page.locator('div.e-zjik7:has-text("Sort")').click()
        #page.locator('div.e-l36v6l:has-text("Price: lowest first")').click()
        #time.sleep(0.5)
        #page.locator("div.e-5p3lvt > div.e-1jj9900 > button.e-1nqp5xs > span").click()

        ## Extract product data
        #price = page.locator("div.e-2feaft").first.text_content().split('$')[1]
        #print(price)
        #results = []
        #results.append({"title": item, "price": price})

        #for item in items:
        #    try:
        #        title = item.locator(".product-title").text_content()
        #        price = item.locator(".product-price").text_content()
        #        results.append({"title": title, "price": price})
        #    except:
        #        continue
        
        input("Press Enter to close the browser...")

        browser.close()
      # return results

@app.route('/api/aldi', methods=['POST'])
def get_aldi_prices():
    data = request.json
    zip_code = data.get('zipCode')
    item = data.get('item', 'milk')

    prices = scrape_aldi(zip_code, item)
    print(prices)
    return jsonify({'aldi_prices': prices})

if __name__ == '__main__':
    app.run(debug=True)