from flask import Flask, jsonify, request
import requests
from flask_cors import CORS
from bs4 import BeautifulSoup

app = Flask(__name__)
CORS(app)

@app.route('/api/data', methods=['POST'])
def get_data():
    data = request.json
    
    # Example: Simulate scraping Walmart based on ZIP code
    url = f'https://www.walmart.com/search?q=milk&zip={zip_code}'
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract product prices (example)
    prices = [price.get_text() for price in soup.find_all('span', {'class': 'price'})]

    return jsonify({'prices': prices})

if __name__ == '__main__':
    app.run(debug=True)