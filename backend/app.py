from flask import Flask, jsonify, request
from flask_cors import CORS
from bs4 import BeautifulSoup
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__)
CORS(app)

# Initialize SQLite database for users:
db = sqlite3.connect('users.db', check_same_thread=False)
db.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT UNIQUE
    )
''')
db.commit()

# Registration route:
@app.route('/register', methods=['POST'])
def register_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')

    if not username or not password or not email:
        return jsonify({'message': 'Username, password, and email are required'}), 400

    # Hash the password
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    try:
        db.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                   (username, hashed_password, email))
        db.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except sqlite3.IntegrityError:
        # Error if username already exists
        return jsonify({'message': 'Username already taken'}), 400

# Login route:
@app.route('/login', methods=['POST'])
def login_user():
    data = request.json
    login_email = data.get('username')   
    login_password = data.get('password')

    if not login_email or not login_password:
        return jsonify({'message': 'Email and password are required'}), 400

    cursor = db.execute('SELECT * FROM users WHERE email = ?', (login_email,))
    row = cursor.fetchone()

    if row is None:
        return jsonify({'message': 'Invalid credentials'}), 400

    stored_hashed_password = row[2]  

    if check_password_hash(stored_hashed_password, login_password):
        return jsonify({'message': 'Login successful'}), 200
    else:
        return jsonify({'message': 'Invalid credentials'}), 400

# Google login route:
@app.route('/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    token = data.get("token")

    if not token:
        return jsonify({"message": "No token provided"}), 400

    try:
        id_info = id_token.verify_oauth2_token(token, google_requests.Request())
        user_email = id_info.get('email')
        user_name = id_info.get('name', 'Google User')

        cursor = db.execute('SELECT * FROM users WHERE email = ?', (user_email,))
        user = cursor.fetchone()

        if not user:
            db.execute('INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                       (user_name, '', user_email))
            db.commit()

        return jsonify({"message": "Google login successful", "email": user_email, "name": user_name}), 200

    except ValueError as e:
        print("Google token verification failed:", e)
        return jsonify({"message": "Invalid Google token"}), 400

# Dummy data API placeholder (currently does nothing):
@app.route('/api/data', methods=['POST'])
def get_data():
    data = request.json
    return jsonify({'prices': {}})

if __name__ == '__main__':
    app.run(debug=True)

