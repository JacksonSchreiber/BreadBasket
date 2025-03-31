import React, { useState } from 'react';
import './App.css'; // Reusing App.css for consistent styling
import { GoogleLogin } from '@react-oauth/google';

function Login(props) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    console.log('Login submitted:', { loginEmail, loginPassword });

    try {
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginEmail,
          password: loginPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Login success:', data.message);
        setLoginMessage('Login successful!');
        // Store the token and role
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', loginEmail);
        localStorage.setItem('role', data.role);

        if (props.onLoginSuccess) {
          props.onLoginSuccess(loginEmail, data.role);
        }
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
    setRegisterMessage('Registering...');

    try {
      const response = await fetch('http://127.0.0.1:5000/register', {
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

    // If you later want to send this token to your backend:
    // fetch('http://localhost:5000/google-login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token: credentialResponse.credential })
    // });

    if (props.onLoginSuccess) {
      props.onLoginSuccess("Google User");
    }

    setLoginMessage("Google login successful!");
  };

  const handleGoogleError = () => {
    console.log("❌ Google login failed");
    setLoginMessage("Google login failed. Please try again.");
  };

  return (
    <section className="login-section">
      <h2>Login or Register</h2>

      {loginMessage && <p style={{ color: 'red' }}>{loginMessage}</p>}

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

          <div style={{ marginTop: '20px' }}>
            <p>Or login with Google:</p>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={handleGoogleError}
            />
          </div>
        </div>

        {/* Registration Form */}
        <div className="form-box">
          <h3>Register</h3>
          {registerMessage && <p style={{ color: registerMessage.includes('successful') ? 'green' : 'red' }}>{registerMessage}</p>}
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


