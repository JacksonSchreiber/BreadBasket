from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import time
import logging
import random
import json
import re
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory cache for faster responses
price_cache = {}
CACHE_DURATION = 300  # 5 minutes

# Common grocery items with realistic price ranges (fallback)
PRICE_RANGES = {
    "milk": (2.69, 3.19),
    "whole milk": (2.79, 3.29),
    "skim milk": (2.69, 3.19),
    "almond milk": (2.99, 3.79),
    "eggs": (1.99, 3.29),
    "brown eggs": (2.79, 3.99),
    "cheese": (2.99, 4.99),
    "cheddar cheese": (3.49, 4.29),
    "mozzarella cheese": (2.99, 3.99),
    "yogurt": (0.79, 2.29),
    "greek yogurt": (3.99, 4.99),
    "butter": (2.99, 3.69),
    "bread": (1.29, 2.99),
    "white bread": (1.29, 1.99),
    "wheat bread": (1.79, 2.99),
    "chicken breast": (2.99, 5.49),
    "whole chicken": (5.99, 7.99),
    "beef": (4.99, 8.99),
    "ground beef": (3.99, 5.99),
    "beef steak": (6.99, 12.99),
    "apples": (0.99, 2.49),
    "gala apples": (1.29, 2.29),
    "red delicious apples": (1.19, 2.19),
    "bananas": (0.39, 0.59),
    "potatoes": (2.49, 4.29),
    "sweet potatoes": (0.99, 1.79),
    "russet potatoes": (2.79, 4.29),
    "rice": (1.79, 3.99),
    "white rice": (1.79, 3.49),
    "brown rice": (2.29, 3.99),
    "pasta": (0.79, 1.99),
    "spaghetti": (0.79, 1.69),
    "penne pasta": (0.89, 1.79),
    "cereal": (1.99, 3.99),
    "cheerios": (2.99, 3.79),
    "corn flakes": (1.99, 2.79),
    "coffee": (4.99, 8.99),
    "tea": (1.99, 3.99),
    "sugar": (1.99, 2.99),
    "flour": (1.99, 3.79),
    "orange juice": (2.99, 3.99),
    "apple juice": (2.49, 3.49),
    "tomatoes": (1.79, 3.29),
    "lettuce": (1.49, 2.49),
    "onions": (1.49, 2.39),
    "carrots": (0.99, 1.99),
    "broccoli": (1.99, 2.99),
    "ice cream": (2.99, 4.99)
}

# Default price range for items not in the above list
DEFAULT_PRICE_RANGE = (1.79, 4.99)

def generate_consistent_price(item, store_id="aldi"):
    """Generate a consistent price for an item based on its name and store"""
    # Use the item name and store ID to create a consistent seed
    seed = sum(ord(c) for c in item) + sum(ord(c) for c in store_id)
    random.seed(seed)
    
    # Get the price range for this item or use default
    price_range = PRICE_RANGES.get(item.lower(), DEFAULT_PRICE_RANGE)
    
    # Generate a price within the range, with two decimal places
    base_price = random.uniform(price_range[0], price_range[1])
    price = round(base_price * 0.95, 2)  # Aldi tends to be cheaper
    
    return price

def direct_api_attempt(item, zip_code):
    """
    Use Aldi's API to: 
    1. list stores close to a zip code to get the store ID
    2. Query an item from a specific store to get the price
    """
    store_id = ""
    item_price = ""
    # First, Get the store ID of the closest Aldi to the provided zip code using Aldi's merchant-search endpoint
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }

        locationAPI = (
            f"https://api.aldi.us/v1/merchant-search?"
            f"currency=USD&service_type=pickup&zip_code={zip_code}"
        )        
        response = requests.get(locationAPI, headers=headers, timeout=3)
        if response.status_code == 200:
            logger.info(f"response direct 200  ")

            data = response.json()
            stores = data.get('data', [])
            # Parse the response to get the first listed store ID (closest store to the provided zip code)
            if stores:
                store_id = stores[0].get('id', '')
                logger.info(f"Found store_id: {store_id}")
        else:
            logger.warning("No stores found in response")
            return None
    except Exception as e:
        logger.warning(f"Failed to query Aldi's merchant-search api: {str(e)}")
        return None

    # Now, query an item using Aldi's product-search endpoint
    try:
        # headers not required, but keeping
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }

        #sorted by relevance
        itemAPI = (
            f"https://api.aldi.us/v3/product-search?"
            f"currency=USD&serviceType=pickup&"
            f"q={item}&"
            f"limit=12&offset=0&sort=relevance&testVariant=A&servicePoint={store_id}"
        )        
        response = requests.get(itemAPI, headers=headers, timeout=3)
        if response.status_code == 200:
            data = response.json()
            items = data.get('data', [])
            # Parse the response to get the first (most relevant) item's price
            if items:
                first_item = items[0]
                price_info = first_item.get('price', {})
                item_price = price_info.get('amountRelevantDisplay', '')
                logger.info(f"Found item_price: {item_price}")
        else:
            logger.warning("No items found in product-search response")
            return None
    except Exception as e:
        logger.warning(f"Failed to query Aldi's product-search api: {str(e)}")
        return None

    # strip the leading $
    return {
            "title": item,
            "price": str(item_price).lstrip('$')
            }

    
def get_aldi_price(item, zip_code):
    """Get the price of an item at Aldi"""
    cache_key = f"{zip_code}_{item}"
    
    # Check cache first
    if cache_key in price_cache:
        timestamp, data = price_cache[cache_key]
        if time.time() - timestamp < CACHE_DURATION:
            return data
    
    # Try direct API endpoint first (fastest method)
    api_result = direct_api_attempt(item, zip_code)
    if api_result:
        price_cache[cache_key] = (time.time(), api_result)
        logger.info(f"Direct worked!  ")
        return api_result
    else:
        return "error"
    """
    # Use consistent generated price as fallback
    price = generate_consistent_price(item)
    result = {
        "title": item.title(),
        "price": str(price)
    }
    # Cache the result
    price_cache[cache_key] = (time.time(), result)
    return result
    """

@app.route('/api/aldi', methods=['POST', 'OPTIONS'])
def get_aldi_prices():
    """Handle requests for Aldi prices"""
    # Handle preflight requests
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        return response
    
    # Get data from request
    data = request.json
    zip_code = data.get('zipCode', '00000')
    item = data.get('item', 'milk')
    
    try:
        # Get price for the item
        result = get_aldi_price(item, zip_code)
        
        # Check if the API returned an error or empty result
        if result == "error" or not result or 'price' not in result:
            # Use fallback price
            fallback_price = generate_consistent_price(item)
            result = {
                "title": item.title(),
                "price": str(fallback_price)
            }
        
        logger.info(f"Retrieved price for {item}: ${result['price']}")
        
        # Return the result
        return jsonify({"product_data": result}), 200
    except Exception as e:
        logger.error(f"Error getting price: {str(e)}")
        
        # Always return a result, even if there's an error
        fallback_price = generate_consistent_price(item)
        return jsonify({
            "product_data": {
                "title": item.title(),
                "price": str(fallback_price)
            }
        }), 200

def clear_cache():
    """Clear expired cache entries"""
    now = time.time()
    expired_keys = [k for k, (timestamp, _) in price_cache.items() if now - timestamp > CACHE_DURATION]
    for key in expired_keys:
        del price_cache[key]

# Start periodic cache clearing
def start_cache_clearing():
    executor = ThreadPoolExecutor(1)
    def clear_loop():
        while True:
            time.sleep(CACHE_DURATION)
            clear_cache()
    executor.submit(clear_loop)

if __name__ == '__main__':
    start_cache_clearing()
    app.run(port=5003, debug=True)