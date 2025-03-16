from flask import Flask, jsonify, request
from flask_cors import CORS
from bs4 import BeautifulSoup
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# Initialize SQLite database for users:
db = sqlite3.connect('users.db', check_same_thread=False)
db.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
''')
db.commit()


# Registration route:
@app.route('/register', methods=['POST'])
def register_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    # Hash the password
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')

    try:
        db.execute('INSERT INTO users (username, password) VALUES (?, ?)',
                   (username, hashed_password))
        db.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except sqlite3.IntegrityError:
        # Error if username already exists
        return jsonify({'message': 'Username already taken'}), 400


# Login route:
@app.route('/login', methods=['POST'])
def login_user():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    # Get the user record
    cursor = db.execute('SELECT * FROM users WHERE username = ?', (username,))
    row = cursor.fetchone()

    if row is None:
        return jsonify({'message': 'Invalid credentials'}), 400

    # row = (id, username, password)
    stored_hashed_password = row[2]

    # Compare hashed password
    if check_password_hash(stored_hashed_password, password):
        # Return success message. 
        # May add returning a JWT or session token in the future...
        return jsonify({'message': 'Login successful'}), 200
    else:
        return jsonify({'message': 'Invalid credentials'}), 400

@app.route('/api/data', methods=['POST'])
def get_data():
    data = request.json
    
    # Call each scraper function
    

    return jsonify({'prices': prices})

if __name__ == '__main__':
    app.run(debug=True)
