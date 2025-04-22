from app import app, get_db
from werkzeug.security import generate_password_hash
import sqlite3

def create_admin_user():
    with app.app_context():
        try:
            db = get_db()
            
            # First, clear any existing users
            db.execute('DELETE FROM users WHERE email = ?', ('breadbasket.devs@gmail.com',))
            
            # Create admin user with properly hashed password
            password = 'BreadBasket@UF2025'
            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
            
            db.execute(
                'INSERT INTO users (username, email, password, role, is_main_admin) VALUES (?, ?, ?, ?, ?)',
                ('MainAdmin', 'breadbasket.devs@gmail.com', hashed_password, 'admin', 1)
            )
            db.commit()
            print("Admin user created successfully!")
            
            # Verify the user was created
            cursor = db.execute('SELECT email, role FROM users WHERE email = ?', ('breadbasket.devs@gmail.com',))
            user = cursor.fetchone()
            if user:
                print(f"Verified admin user: {user['email']} with role: {user['role']}")
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == '__main__':
    create_admin_user() 