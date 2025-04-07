import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Login from './Login';
import Results from './Results';
import Admin from './Admin';
import PrivateRoute from './PrivateRoute';
import './App.css';

function AppContent() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // Check for stored user and role on initial load
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    if (storedUser && storedRole) {
      setLoggedInUser(storedUser);
      setUserRole(storedRole);
    }

    // Add scroll animation observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all elements with animation classes after a short delay
    setTimeout(() => {
      document.querySelectorAll('.scroll-fade-in, .scroll-scale').forEach(
        element => observer.observe(element)
      );
    }, 100);

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      observer.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [location.pathname]); // Re-run when route changes

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setLoggedInUser(null);
    setUserRole(null);
    setDropdownOpen(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="logo-container">
          <Link to="/">
            <img src="/BreadBasket Logo.png" alt="BreadBasket Logo" className="app-logo" />
          </Link>
        </div>
        <div className="header-right">
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
          {loggedInUser && (
            <div className="welcome-container" ref={dropdownRef}>
              <div 
                className="welcome-message" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                Welcome, {loggedInUser}
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="currentColor" 
                  style={{ 
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
              <div className={`welcome-dropdown ${dropdownOpen ? 'show' : ''}`}>
                <Link to="/account" className="dropdown-item">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Account Settings
                </Link>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item" onClick={handleLogout}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  Log Out
                </div>
              </div>
            </div>
          )}
        </div>
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
          <Route path="/admin" element={
            <PrivateRoute adminOnly={true}>
              <Admin />
            </PrivateRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;