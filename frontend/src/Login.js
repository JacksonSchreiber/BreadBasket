import React, { useState } from 'react';
import './App.css'; // Reusing App.css for consistent styling

function Login() {
  // State for Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State for Registration form
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Track a message to display on-screen for login results
  const [loginMessage, setLoginMessage] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    console.log('Login submitted:', { loginEmail, loginPassword });

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // The Flask code expects "username" and "password"
          username: loginEmail,
          password: loginPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Login success:', data.message);
        setLoginMessage(data.message); 
      } else {
        console.log('Login error:', data.message);
        setLoginMessage(data.message); 
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setLoginMessage('Error logging in. Please try again.'); 
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    console.log('Registration submitted:', { regUsername, regEmail, regPassword });

    // Send registration request to Flask
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // The Flask code expects "username", "password", and now "email"
          username: regUsername,
          password: regPassword,
          email: regEmail
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Registration success:', data.message);
      } else {
        console.log('Registration failed:', data.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <section className="login-section">
      <h2>Login or Register</h2>

      {/* CHANGED: Show loginMessage if present */}
      {loginMessage && <p style={{ color: 'red' }}>{loginMessage}</p>} {/* CHANGED */}

      <div className="form-container">
        {/* Login Form */}
        <div className="form-box">
          <h3>Login</h3>
          <form onSubmit={handleLoginSubmit}>
            <label htmlFor="loginEmail">Email:</label>
            <input
              type="email"
              id="loginEmail"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <label htmlFor="loginPassword">Password:</label>
            <input
              type="password"
              id="loginPassword"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button type="submit">Login</button>
          </form>
        </div>

        {/* Registration Form */}
        <div className="form-box">
          <h3>Register</h3>
          <form onSubmit={handleRegisterSubmit}>
            <label htmlFor="regUsername">Username:</label>
            <input
              type="text"
              id="regUsername"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              placeholder="Choose a username"
              required
            />
            <label htmlFor="regEmail">Email:</label>
            <input
              type="email"
              id="regEmail"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <label htmlFor="regPassword">Password:</label>
            <input
              type="password"
              id="regPassword"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
            <button type="submit">Register</button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Login;
