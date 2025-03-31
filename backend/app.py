from flask import Flask, jsonify, request, g
from flask_cors import CORS
from bs4 import BeautifulSoup
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from functools import wraps
import jwt
import datetime
import os

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this to a secure secret key
DATABASE = 'users.db'

MAIN_ADMIN_EMAIL = 'breadbasket.devs@gmail.com'

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    with app.app_context():
        db = get_db()
        
        # Drop existing tables to ensure clean state
        db.execute('DROP TABLE IF EXISTS users')
        db.execute('DROP TABLE IF EXISTS contact_submissions')
        
        # Create users table with is_main_admin column
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                email TEXT UNIQUE,
                role TEXT DEFAULT 'user',
                is_main_admin BOOLEAN DEFAULT 0
            )
        ''')
        
        # Create contact submissions table
        db.execute('''
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Check if main admin exists
        cursor = db.execute('SELECT * FROM users WHERE email = ?', (MAIN_ADMIN_EMAIL,))
        admin = cursor.fetchone()
        
        if not admin:
            # Create main admin account if it doesn't exist
            hashed_password = generate_password_hash('BreadBasket@UF2025', method='pbkdf2:sha256')
            db.execute('''
                INSERT INTO users (username, email, password, role, is_main_admin)
                VALUES (?, ?, ?, 'admin', 1)
            ''', ('MainAdmin', MAIN_ADMIN_EMAIL, hashed_password))
        
        db.commit()

# Initialize the database
init_db()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['user']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            if data.get('role') != 'admin':
                return jsonify({'message': 'Admin access required'}), 403
            current_user = data['user']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def main_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            
            # Check if the user is the main admin
            db = get_db()
            cursor = db.execute('SELECT is_main_admin FROM users WHERE email = ?', (data['user'],))
            user = cursor.fetchone()
            
            if not user or not user['is_main_admin']:
                return jsonify({'message': 'Main admin access required'}), 403
                
            current_user = data['user']
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

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
        db = get_db()
        db.execute('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                   (username, hashed_password, email, 'user'))
        db.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Username or email already taken'}), 400

# Admin management endpoints
@app.route('/admin/users', methods=['GET'])
@main_admin_required
def get_users(current_user):
    try:
        db = get_db()
        cursor = db.execute('SELECT id, username, email, role FROM users WHERE email != ?', (MAIN_ADMIN_EMAIL,))
        users = cursor.fetchall()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            })
        
        return jsonify(users_list), 200
    except sqlite3.Error as e:
        return jsonify({'message': 'Error fetching users'}), 500

@app.route('/admin/promote', methods=['POST'])
@main_admin_required
def promote_user(current_user):
    data = request.json
    user_email = data.get('email')
    
    if not user_email:
        return jsonify({'message': 'User email is required'}), 400
        
    if user_email == MAIN_ADMIN_EMAIL:
        return jsonify({'message': 'Cannot modify main admin status'}), 400
    
    try:
        db = get_db()
        cursor = db.execute('UPDATE users SET role = ? WHERE email = ?', ('admin', user_email))
        db.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'message': 'User not found'}), 404
            
        return jsonify({'message': 'User promoted to admin successfully'}), 200
    except sqlite3.Error as e:
        return jsonify({'message': 'Error promoting user'}), 500

@app.route('/admin/demote', methods=['POST'])
@main_admin_required
def demote_user(current_user):
    data = request.json
    user_email = data.get('email')
    
    if not user_email:
        return jsonify({'message': 'User email is required'}), 400
        
    if user_email == MAIN_ADMIN_EMAIL:
        return jsonify({'message': 'Cannot modify main admin status'}), 400
    
    try:
        db = get_db()
        cursor = db.execute('UPDATE users SET role = ? WHERE email = ?', ('user', user_email))
        db.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'message': 'User not found'}), 404
            
        return jsonify({'message': 'User demoted to regular user successfully'}), 200
    except sqlite3.Error as e:
        return jsonify({'message': 'Error demoting user'}), 500

# Login route:
@app.route('/login', methods=['POST'])
def login_user():
    data = request.json
    login_email = data.get('username')   # Email is sent as 'username'
    login_password = data.get('password')

    print("Login attempt:", login_email)  # Add debug logging

    if not login_email or not login_password:
        return jsonify({'message': 'Email and password are required'}), 400

    try:
        db = get_db()
        cursor = db.execute('SELECT * FROM users WHERE email = ?', (login_email,))
        row = cursor.fetchone()

        if row is None:
            print("No user found with email:", login_email)  # Add debug logging
            return jsonify({'message': 'Invalid credentials'}), 400

        stored_hashed_password = row['password']

        if check_password_hash(stored_hashed_password, login_password):
            token = jwt.encode({
                'user': login_email,
                'role': row['role'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, app.config['SECRET_KEY'])
            print("Login successful for:", login_email)  # Add debug logging
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'role': row['role']
            }), 200
        else:
            print("Invalid password for:", login_email)  # Add debug logging
            return jsonify({'message': 'Invalid credentials'}), 400
    except Exception as e:
        print("Login error:", str(e))  # Add debug logging
        return jsonify({'message': 'Error during login'}), 500

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

        db = get_db()
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

# Contact submission endpoint
@app.route('/contact', methods=['POST'])
def submit_contact():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')

    if not name or not email or not message:
        return jsonify({'message': 'Name, email, and message are required'}), 400

    try:
        db = get_db()
        db.execute('INSERT INTO contact_submissions (name, email, message) VALUES (?, ?, ?)',
                   (name, email, message))
        db.commit()
        return jsonify({'message': 'Message sent successfully'}), 201
    except sqlite3.Error as e:
        return jsonify({'message': 'Error saving message'}), 500

# Admin route to get contact submissions
@app.route('/admin/contact-submissions', methods=['GET'])
@admin_required
def get_contact_submissions(current_user):
    try:
        db = get_db()
        cursor = db.execute('SELECT * FROM contact_submissions ORDER BY created_at DESC')
        submissions = cursor.fetchall()
        
        # Convert to list of dictionaries
        submissions_list = []
        for submission in submissions:
            submissions_list.append({
                'id': submission['id'],
                'name': submission['name'],
                'email': submission['email'],
                'message': submission['message'],
                'created_at': submission['created_at']
            })
        
        return jsonify(submissions_list), 200
    except sqlite3.Error as e:
        return jsonify({'message': 'Error fetching submissions'}), 500

if __name__ == '__main__':
    app.run(debug=True)

