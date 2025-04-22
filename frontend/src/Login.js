import React, { useState } from 'react';
import './App.css'; // Reusing App.css for consistent styling
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import './Login.css';

// Update API URL to match the backend port (5000)
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

function Login({ onLoginSuccess }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [isGoogleLoginEnabled, setIsGoogleLoginEnabled] = useState(false); // Temporarily disable Google login
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', formData.username);
        localStorage.setItem('role', data.role);
        onLoginSuccess(data.token, data.role, formData.username);
        navigate('/');
      } else {
        setMessage(data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setMessage('Error connecting to server. Please try again.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Registration successful! Please log in.');
        setIsLoginView(true);
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
      } else {
        setMessage(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Error registering:', error);
      setMessage('Error connecting to server. Please try again.');
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
          
          setMessage("Google login successful!");
        } else {
          setMessage("Google login failed: " + data.message);
        }
      })
      .catch(error => {
        console.error("Error during Google login:", error);
        setMessage("Error connecting to server. Please try again.");
      });
  };

  const handleGoogleError = () => {
    console.log("❌ Google login failed");
    setMessage("Google login failed. Please try again.");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>BreadBasket</h1>
        <p className="subtitle">Your AI-powered shopping assistant</p>

        <div className="auth-tabs">
          <button 
            className={`tab-button ${isLoginView ? 'active' : ''}`}
            onClick={() => setIsLoginView(true)}
          >
            Login
          </button>
          <button 
            className={`tab-button ${!isLoginView ? 'active' : ''}`}
            onClick={() => setIsLoginView(false)}
          >
            Register
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      
        <form onSubmit={isLoginView ? handleLoginSubmit : handleRegisterSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name={isLoginView ? "username" : "email"}
              value={isLoginView ? formData.username : formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
            />
          </div>

          {!isLoginView && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button type="submit" className="submit-button">
            {isLoginView ? 'Sign In' : 'Register'}
          </button>
        </form>

        <p className="terms">
          By using BreadBasket, you agree to our{' '}
          <a href="/terms" className="link">Terms of Service</a> and{' '}
          <a href="/privacy" className="link">Privacy Policy</a>.
        </p>
      </div>

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
  );
}

export default Login;


