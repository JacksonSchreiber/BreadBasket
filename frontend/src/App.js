import React, { useState } from 'react'; // Import useState
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Login from './Login'; // New import
import './App.css';

function App() {
  // Track the logged in user at the App level
  const [loggedInUser, setLoggedInUser] = useState(null); 

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

              {/* Only show "Login" link if no one is logged in */}
              {!loggedInUser && (
                <li><Link to="/login">Login</Link></li> 
              )}
            </ul>

            {/* Display welcome message in top right if logged in */}
            {loggedInUser && (
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                Welcome, {loggedInUser}
              </div>
            )} 
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/*Pass a callback to Login to set the loggedInUser */}
            <Route 
              path="/login" 
              element={<Login onLoginSuccess={(user) => setLoggedInUser(user)} />} 
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
