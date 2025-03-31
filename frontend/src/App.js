import React, { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Login from './Login';
import Admin from './Admin';
import PrivateRoute from './PrivateRoute';
import './App.css';

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const user = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    if (user) {
      setLoggedInUser(user);
      setUserRole(role);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setLoggedInUser(null);
    setUserRole(null);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <header className="App-header">
          <h1>BreadBasket</h1>
          <nav>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              {loggedInUser ? (
                <>
                  {userRole === 'admin' && <li><Link to="/admin">Admin</Link></li>}
                  <li><button onClick={handleLogout}>Logout</button></li>
                </>
              ) : (
                <li><Link to="/login">Login</Link></li>
              )}
            </ul>

            {loggedInUser && (
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                Welcome, {loggedInUser}
                {userRole === 'admin' && ' (Admin)'}
              </div>
            )}
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
            <Route
              path="/admin"
              element={
                <PrivateRoute adminOnly>
                  <Admin />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
