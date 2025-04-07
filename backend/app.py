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
    db = get_db()
    with app.open_resource('schema.sql', mode='r') as f:
        db.cursor().executescript(f.read())
    db.commit()

@app.cli.command('init-db')
def init_db_command():
    init_db()
    print('Initialized the database.')

def create_contact_submission(name, email, message):
    db = get_db()
    db.execute(
        'INSERT INTO contact_submissions (name, email, message, responded, submission_date) VALUES (?, ?, ?, ?, ?)',
        (name, email, message, False, datetime.datetime.now().isoformat())
    )
    db.commit()

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
def contact():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')
    
    if not all([name, email, message]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        create_contact_submission(name, email, message)
        return jsonify({'message': 'Contact form submitted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/contact-submissions', methods=['GET'])
@admin_required
def get_contact_submissions(current_user):
    filter_type = request.args.get('filter', 'all')
    
    db = get_db()
    query = 'SELECT * FROM contact_submissions'
    
    if filter_type == 'responded':
        query += ' WHERE responded = 1'
    elif filter_type == 'pending':
        query += ' WHERE responded = 0'
        
    query += ' ORDER BY submission_date DESC'
    
    submissions = db.execute(query).fetchall()
    return jsonify([{
        'id': row['id'],
        'name': row['name'],
        'email': row['email'],
        'message': row['message'],
        'responded': bool(row['responded']),
        'submission_date': row['submission_date'],
        'admin_notes': row['admin_notes']
    } for row in submissions]), 200

@app.route('/admin/contact-submissions/<int:submission_id>/toggle-response', methods=['POST'])
@admin_required
def toggle_submission_response(current_user, submission_id):
    db = get_db()
    submission = db.execute('SELECT responded FROM contact_submissions WHERE id = ?', 
                          [submission_id]).fetchone()
    
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
    
    new_status = not bool(submission['responded'])
    db.execute('UPDATE contact_submissions SET responded = ? WHERE id = ?',
              [new_status, submission_id])
    db.commit()
    
    return jsonify({'message': 'Status updated successfully', 'responded': new_status}), 200

@app.route('/admin/contact-submissions/<int:submission_id>/update-notes', methods=['POST'])
@admin_required
def update_submission_notes(current_user, submission_id):
    data = request.get_json()
    notes = data.get('notes')
    
    if notes is None:
        return jsonify({'error': 'Notes field is required'}), 400
    
    db = get_db()
    submission = db.execute('SELECT id FROM contact_submissions WHERE id = ?', 
                          [submission_id]).fetchone()
    
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
    
    db.execute('UPDATE contact_submissions SET admin_notes = ? WHERE id = ?',
              [notes, submission_id])
    db.commit()
    
    return jsonify({'message': 'Notes updated successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True)

