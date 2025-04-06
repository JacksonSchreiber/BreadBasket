import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Login from './Login';
import Results from './Results'; // New import for the Results page
import Admin from './Admin';
import './App.css';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check for stored user and role on initial load
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    if (storedUser && storedRole) {
      setLoggedInUser(storedUser);
      setUserRole(storedRole);
    }
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <header className="App-header">
          <h1>BreadBasket</h1>
          {loggedInUser && (
            <div className="welcome-message">
              Welcome, {loggedInUser}
            </div>
          )}
          <nav>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              {!loggedInUser && (
                <li><Link to="/login">Login</Link></li>
              )}
              {userRole === 'admin' && (
                <li><Link to="/admin">Admin</Link></li>
              )}
            </ul>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route
              path="/login"
              element={<Login onLoginSuccess={(user, role) => {
                setLoggedInUser(user);
                setUserRole(role);
              }} />}
            />
            <Route path="/results" element={<Results />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;