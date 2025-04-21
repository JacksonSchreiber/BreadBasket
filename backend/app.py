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
import openai
from dotenv import load_dotenv
import json
from flask_cors import cross_origin
import secrets

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Generate a secure random secret key
app.config['SECRET_KEY'] = secrets.token_hex(32)
DATABASE = 'users.db'

MAIN_ADMIN_EMAIL = 'breadbasket.devs@gmail.com'

# Initialize OpenAI client with API key from environment variable
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")
openai.api_key = openai_api_key

# Bready's system prompt
SYSTEM_PROMPT = """
You are Bready, a friendly and helpful grocery shopping assistant.
Your personality traits:
- Warm and approachable
- Knowledgeable about groceries and recipes
- Proactive in suggesting items and meal ideas
- Mindful of budgets and preferences
- Patient and understanding
- Empathetic to shopping needs

Your communication style:
- Use emojis sparingly to add warmth
- Keep responses concise but informative
- Ask clarifying questions when needed
- Provide clear, actionable suggestions
- Maintain a helpful but professional tone

Your capabilities:
- Find and compare grocery items
- Generate recipes based on ingredients
- Check store availability and prices
- Help with meal planning
- Provide budget-friendly suggestions
- Answer questions about products

Remember to:
- Always maintain a helpful and positive attitude
- Be proactive in offering assistance
- Consider the user's context and history
- Provide clear and actionable information
"""

# Define available functions
FUNCTIONS = [
    {
        "name": "get_recipe",
        "description": "Get a recipe based on user's request",
        "parameters": {
            "type": "object",
            "properties": {
                "dish": {
                    "type": "string",
                    "description": "The name of the dish to get a recipe for"
                },
                "ingredients": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "List of available ingredients"
                }
            },
            "required": ["dish"]
        }
    },
    {
        "name": "compare_prices",
        "description": "Compare prices of items across different stores",
        "parameters": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    },
                    "description": "List of items to compare prices for"
                }
            },
            "required": ["items"]
        }
    }
]

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
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
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
        # Check if database exists, if not initialize it
        if not os.path.exists(DATABASE):
            init_db()
            
        db = get_db()
        db.execute('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                   (username, hashed_password, email, 'user'))
        db.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Username or email already taken'}), 400
    except Exception as e:
        print("Registration error:", str(e))
        return jsonify({'message': 'Server error during registration'}), 500

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
            
            # ensure it's a str, not bytes
            token = token.decode('utf-8') if isinstance(token, bytes) else token
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
            # Create new user if they don't exist
            db.execute('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                      (user_name, '', user_email, 'user'))
            db.commit()
            
            # Fetch the newly created user to get their role
            cursor = db.execute('SELECT * FROM users WHERE email = ?', (user_email,))
            user = cursor.fetchone()
        
        # Generate JWT token
        token = jwt.encode({
            'user': user_email,
            'role': user['role'] if user else 'user',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            "message": "Google login successful", 
            "email": user_email, 
            "name": user_name,
            "token": token,
            "role": user['role'] if user else 'user'
        }), 200

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

@app.route('/user/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    try:
        db = get_db()
        cursor = db.execute('SELECT username, email FROM users WHERE email = ?', (current_user,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        return jsonify({
            'username': user['username'],
            'email': user['email'],
            'notifications': True,  # Default values since these are new features
            'emailUpdates': True
        }), 200
    except Exception as e:
        print("Error fetching user profile:", str(e))
        return jsonify({'message': 'Error fetching user profile'}), 500

@app.route('/user/update', methods=['POST'])
@token_required
def update_user_profile(current_user):
    try:
        data = request.json
        db = get_db()
        
        # Get current user data
        cursor = db.execute('SELECT * FROM users WHERE email = ?', (current_user,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Verify current password if provided
        if data.get('currentPassword'):
            if not check_password_hash(user['password'], data['currentPassword']):
                return jsonify({'message': 'Current password is incorrect'}), 400

            # Update password if new one is provided
            if data.get('newPassword'):
                new_password_hash = generate_password_hash(data['newPassword'])
                db.execute('UPDATE users SET password = ? WHERE email = ?',
                          (new_password_hash, current_user))

        # Update username if provided
        if data.get('username'):
            try:
                db.execute('UPDATE users SET username = ? WHERE email = ?',
                          (data['username'], current_user))
            except sqlite3.IntegrityError:
                return jsonify({'message': 'Username already taken'}), 400

        db.commit()
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        print("Error updating user profile:", str(e))
        return jsonify({'message': 'Error updating profile'}), 500

# Simple ping endpoint to check if the server is up
@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'ok'}), 200

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Get user input and chat history
        user_input = request.json["message"]
        history = request.json.get("history", [])
        
        # Prepare messages with system prompt
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages += history
        messages.append({"role": "user", "content": user_input})
        
        # First call to determine if a function should be called
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=messages,
            functions=FUNCTIONS,
            function_call="auto",
            temperature=0.7
        )
        
        response_message = response.choices[0].message
        
        # Check if a function should be called
        if response_message.get("function_call"):
            function_name = response_message["function_call"]["name"]
            function_args = json.loads(response_message["function_call"]["arguments"])
            
            # Call the appropriate function
            if function_name == "get_recipe":
                function_response = get_recipe(**function_args)
            elif function_name == "compare_prices":
                function_response = compare_prices(**function_args)
            else:
                function_response = None
            
            # Add function response to messages
            messages.append(response_message)
            messages.append({
                "role": "function",
                "name": function_name,
                "content": json.dumps(function_response)
            })
            
            # Get final response from GPT
            final_response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=messages,
                temperature=0.7
            )
            
            assistant_response = final_response.choices[0].message["content"]
        else:
            assistant_response = response_message["content"]
        
        return jsonify({
            "response": assistant_response,
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({
            "response": "I'm sorry, I encountered an error. Please try again.",
            "status": "error",
            "error": str(e)
        }), 500

def get_recipe(dish, ingredients=None):
    # This is a mock implementation - replace with actual recipe database
    recipes = {
        "pizza": {
            "ingredients": ["dough", "tomato sauce", "cheese", "toppings"],
            "instructions": [
                "Preheat oven to 450°F",
                "Roll out the dough",
                "Spread sauce and add toppings",
                "Bake for 15-20 minutes"
            ]
        },
        "pasta": {
            "ingredients": ["pasta", "sauce", "cheese"],
            "instructions": [
                "Boil pasta",
                "Heat sauce",
                "Combine and serve"
            ]
        }
    }
    
    if dish.lower() in recipes:
        return recipes[dish.lower()]
    return None

def compare_prices(items):
    # This is a mock implementation - replace with actual price database
    prices = {
        "milk": {"Walmart": 2.99, "Target": 3.29, "Kroger": 3.19},
        "bread": {"Walmart": 1.99, "Target": 2.29, "Kroger": 2.19},
        "eggs": {"Walmart": 2.49, "Target": 2.79, "Kroger": 2.69}
    }
    
    results = {}
    for item in items:
        if item.lower() in prices:
            results[item] = prices[item.lower()]
    return results

def handle_options():
    response = jsonify({'status': 'success'})
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

@app.route('/verify-token', methods=['GET', 'OPTIONS'])
@cross_origin()
def verify_token():
    if request.method == 'OPTIONS':
        return handle_options()

    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split(' ')[1]
    
    if not token:
        return jsonify({'message': 'Token is missing'}), 401
    
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        db = get_db()
        cursor = db.execute('SELECT email, role FROM users WHERE email = ?', (data['user'],))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found'}), 401
            
        return jsonify({
            'valid': True,
            'user': {
                'email': user['email'],
                'role': user['role']
            }
        })
    except:
        return jsonify({'message': 'Token is invalid'}), 401

if __name__ == '__main__':
    app.run(debug=True)

