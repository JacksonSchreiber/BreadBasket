from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/data', methods=['POST'])
def get_data():
    data = request.json
    
    # Call each scraper function
    

    return jsonify({'prices': prices})

if __name__ == '__main__':
    app.run(debug=True)