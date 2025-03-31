import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Kroger API Creds:
CLIENT_ID = "breadbasket-243261243034246a79762e693372424b5a70524e2f5771706d4548547564385547777445674f2e3847396f39366a34764d6c533555614a77492e564f3615842865638524082"
CLIENT_SECRET = "dC-xIuXpc0n_RM8FTEoZu45hxVsVT2HL8caKjqrT"

# Global variables to store the access token and its expiry time
ACCESS_TOKEN = None
TOKEN_EXPIRY = 0

def refresh_access_token():
    """
    Refreshes the access token
    Sets the global ACCESS_TOKEN and TOKEN_EXPIRY variables
    """
    global ACCESS_TOKEN, TOKEN_EXPIRY
    token_url = "https://api.kroger.com/v1/connect/oauth2/token"
    payload = {
        "grant_type": "client_credentials",
        "scope": "product.compact"  # Adjust scope as needed.
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    # Pass the client_id and client_secret.
    response = requests.post(token_url, data=payload, headers=headers, auth=(CLIENT_ID, CLIENT_SECRET))
    response.raise_for_status()
    token_data = response.json()
    ACCESS_TOKEN = token_data.get("access_token")
    # Set token expiry a bit earlier than actual expiration time (e.g., 60 seconds earlier)
    expires_in = token_data.get("expires_in", 1800)  # default to 1800 seconds if not provided
    TOKEN_EXPIRY = time.time() + expires_in - 60

def get_valid_access_token():

    # Returns a valid access token. Refreshes the token if it's expired or not present.

    global ACCESS_TOKEN, TOKEN_EXPIRY
    if ACCESS_TOKEN is None or time.time() > TOKEN_EXPIRY:
        refresh_access_token()
    #print(ACCESS_TOKEN)
    return ACCESS_TOKEN

@app.route('/api/kroger', methods=['POST', 'OPTIONS'])
def get_kroger_product():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return app.make_default_options_response()

    data = request.json
    zip_code = data.get('zipCode')
    item = data.get('item', 'milk')

    # Get a valid access token (refreshes it if needed)
    token = get_valid_access_token()

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json; charset=utf-8"
    }

    # First retrieve a locationID using the provided ZIP code
    location_url = f"https://api.kroger.com/v1/locations?filter.zipCode.near={zip_code}"
    try:
        loc_response = requests.get(location_url, headers=headers)
        loc_response.raise_for_status()
    except requests.RequestException as e:
        return jsonify({
            "error": "Failed to retrieve location data from Kroger API",
            "details": str(e)
        }), 500

    try:
        loc_json = loc_response.json()
        if not loc_json.get("data") or len(loc_json["data"]) == 0:
            return jsonify({
                "error": "No locations found for the given ZIP code"
            }), 404
        # Use the first returned location
        first_location = loc_json["data"][0]
        location_id = first_location.get("locationId")
    except Exception as e:
        return jsonify({
            "error": "Error parsing location data",
            "details": str(e)
        }), 500

    # Next use the locationId and search term to query the Product API
    product_url = "https://api.kroger.com/v1/products"
    params = {
        "filter.term": item,
        "filter.locationId": location_id,
        "filter.limit": 1  # For simplicity, return one product
    }
    
    try:
        prod_response = requests.get(product_url, params=params, headers=headers)
        prod_response.raise_for_status()
    except requests.RequestException as e:
        return jsonify({
            "error": "Failed to retrieve product data from Kroger API",
            "details": str(e)
        }), 500

    try:
        prod_json = prod_response.json()
        if not prod_json.get("data") or len(prod_json["data"]) == 0:
            return jsonify({
                "error": "No products found matching the search criteria"
            }), 404
        product = prod_json["data"][0]
        # Get product description/pricing from the first item in the product
        title = product.get("description", item)
        price = "N/A"
        if product.get("items") and len(product["items"]) > 0:
            price = product["items"][0].get("price", {}).get("regular", "N/A")
        result = {
            "title": title,
            "price": price,
            "locationId": location_id
        }
    except Exception as e:
        return jsonify({
            "error": "Error parsing product data",
            "details": str(e)
        }), 500

    return jsonify({"kroger_prices": result})

if __name__ == '__main__':
    app.run(debug=True)