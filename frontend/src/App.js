import React, { useState } from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Login from './Login';
import Results from './Results'; // New import for the Results page
import './App.css';

function App() {
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
              {!loggedInUser && (
                <li><Link to="/login">Login</Link></li>
              )}
            </ul>
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
            <Route
              path="/login"
              element={<Login onLoginSuccess={(user) => setLoggedInUser(user)} />}
            />
            <Route path="/results" element={<Results />} /> {/* New route */}
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;