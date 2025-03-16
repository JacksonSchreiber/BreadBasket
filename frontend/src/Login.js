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

  // Handle form submissions (placeholders for now)
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', { loginEmail, loginPassword });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    console.log('Registration submitted:', { regUsername, regEmail, regPassword });
  };

  return (
    <section className="login-section">
      <h2>Login or Register</h2>
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