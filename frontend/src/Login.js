import React, { useState } from 'react';
import './App.css'; // Reusing App.css for consistent styling
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

// Update API URL to match the backend port (5000)
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

function Login({ onLoginSuccess }) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [isGoogleLoginEnabled, setIsGoogleLoginEnabled] = useState(false); // Temporarily disable Google login
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginMessage('Logging in...');

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginEmail,
          password: loginPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setLoginMessage('Login successful!');
        
        // Store auth data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', loginEmail);
        localStorage.setItem('role', data.role);

        // Update parent component
        onLoginSuccess(data.token, data.role, loginEmail);

        // Redirect based on role
        navigate(data.role === 'admin' ? '/admin' : '/');
      } else {
        setLoginMessage(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setLoginMessage('Error connecting to server. Please try again.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    console.log('Registration submitted:', { regUsername, regEmail, regPassword });
    setRegisterMessage('Registering...');

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          email: regEmail
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Registration success:', data.message);
        setRegisterMessage('Registration successful! You can now login.');
        // Clear the registration form
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
      } else {
        console.log('Registration failed:', data.message);
        setRegisterMessage(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterMessage('Error connecting to server. Please try again.');
    }
  };

  const handleGoogleLogin = (credentialResponse) => {
    console.log("✅ Google login success:", credentialResponse);

    // Check if backend is reachable first
    fetch(`${API_URL}/ping`, { method: 'GET' })
      .then(response => {
        if (response.ok) {
          // Send the token to the backend
          return fetch(`${API_URL}/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: credentialResponse.credential })
          });
        } else {
          throw new Error("Backend server is not available");
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.message === "Google login successful") {
          // Store user info
          localStorage.setItem('user', data.email);
          localStorage.setItem('token', data.token);  // Use server generated token
          localStorage.setItem('role', data.role);    // Store role from server
          
          // Update parent component
          onLoginSuccess(data.token, data.role, data.email);
          
          setLoginMessage("Google login successful!");
        } else {
          setLoginMessage("Google login failed: " + data.message);
        }
      })
      .catch(error => {
        console.error("Error during Google login:", error);
        setLoginMessage("Error connecting to server. Please try again.");
      });
  };

  const handleGoogleError = () => {
    console.log("❌ Google login failed");
    setLoginMessage("Google login failed. Please try again.");
  };

  return (
    <div className="auth-container">
      <h2>Login or Register</h2>
      {loginMessage && <div className={loginMessage.includes('successful') ? 'success-message' : 'error-message'}>{loginMessage}</div>}
      
      <div className="auth-sections">
        <div className="auth-section">
          <h3>Login</h3>
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-button">Login</button>
          </form>

          <div className="google-login">
            <p>Or login with Google:</p>
            {isGoogleLoginEnabled ? (
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={handleGoogleError}
              />
            ) : (
              <div className="error-message">Google login temporarily unavailable</div>
            )}
          </div>
        </div>

        <div className="auth-section">
          <h3>Register</h3>
          {registerMessage && <div className={registerMessage.includes('successful') ? 'success-message' : 'error-message'}>{registerMessage}</div>}
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-button">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;


