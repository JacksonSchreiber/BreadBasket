DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS contact_submissions;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    is_main_admin BOOLEAN DEFAULT 0,
    notifications BOOLEAN DEFAULT 1,
    email_updates BOOLEAN DEFAULT 1
);

CREATE TABLE contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    responded BOOLEAN DEFAULT 0,
    submission_date TEXT NOT NULL,
    admin_notes TEXT
);

-- Create main admin account with password 'BreadBasket@UF2025'
INSERT INTO users (username, email, password, role, is_main_admin)
VALUES (
    'MainAdmin',
    'breadbasket.devs@gmail.com',
    'scrypt:32768:8:1$YtkMcYHmcjxYCwK7$17920c3f1e18898e7b99022a63e9553f285917d544e355e6c2b370d9676c59da50f3976486533403cee1d8c27211acbdf77d3491095a20f75d694d9f87e6e6f9',
    'admin',
    1
); 