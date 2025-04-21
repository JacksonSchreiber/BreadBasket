import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Login from './Login';
import Results from './Results';
import Admin from './Admin';
import AccountSettings from './AccountSettings';
import ShoppingCart from './components/ShoppingCart';
import BreadyChat from './components/BreadyChat';
import PrivateRoute from './PrivateRoute';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import './App.css';

function AppContent() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/verify-token', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserRole(data.user.role);
          setLoggedInUser(data.user.email);
        } else {
          // Clear invalid session
          handleLogout();
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        handleLogout();
      }
      setIsLoading(false);
    };

    verifyToken();

    // Update initial cart count
    const updateCartCount = (items = null) => {
      try {
        const cartItems = items || JSON.parse(localStorage.getItem('cartItems') || '[]');
        const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        setCartItemCount(count);
      } catch (error) {
        console.error('Error updating cart count:', error);
        setCartItemCount(0);
      }
    };

    // Initial cart count update
    updateCartCount();

    // Listen for cart updates
    const handleCartUpdate = (event) => {
      if (event.detail?.cartItems) {
        updateCartCount(event.detail.cartItems);
      } else {
        updateCartCount();
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    // Handle clicks outside dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserRole(null);
    setLoggedInUser(null);
    setDropdownOpen(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
              <li>
                <Link to="/" className={isActiveRoute('/') ? 'active' : ''}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className={isActiveRoute('/about') ? 'active' : ''}>
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className={isActiveRoute('/contact') ? 'active' : ''}>
                  Contact
                </Link>
              </li>
              {!isAuthenticated && (
                <li>
                  <Link to="/login" className={isActiveRoute('/login') ? 'active' : ''}>
                    Login
                  </Link>
                </li>
              )}
              {userRole === 'admin' && (
                <li>
                  <Link to="/admin" className={isActiveRoute('/admin') ? 'active' : ''}>
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>
          <div className="header-actions">
            {isAuthenticated && (
              <button 
                className="cart-button" 
                onClick={() => setIsCartOpen(true)}
                aria-label="Shopping Cart"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"></path>
                </svg>
                {cartItemCount > 0 && (
                  <span className="cart-count">{cartItemCount}</span>
                )}
              </button>
            )}
            {loggedInUser && (
              <div className="welcome-container" ref={dropdownRef}>
                <div 
                  className="welcome-message"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {loggedInUser}
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
        </div>
      </header>
      <main>
        <TransitionGroup>
          <CSSTransition
            key={location.key}
            timeout={300}
            classNames="page-transition"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route
                path="/login"
                element={
                  <Login 
                    onLoginSuccess={(token, role, email) => {
                      setIsAuthenticated(true);
                      setUserRole(role);
                      setLoggedInUser(email);
                      navigate('/'); // Redirect to home page after login
                    }} 
                  />
                }
              />
              <Route path="/results" element={<Results />} />
              <Route 
                path="/admin" 
                element={
                  <PrivateRoute adminOnly={true}>
                    <Admin />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/account" 
                element={
                  <PrivateRoute>
                    <AccountSettings />
                  </PrivateRoute>
                } 
              />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
          </CSSTransition>
        </TransitionGroup>
      </main>
      {isAuthenticated && (
        <>
          <ShoppingCart 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)} 
          />
          <BreadyChat />
        </>
      )}
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