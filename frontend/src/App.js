import React from 'react';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Login from './Login'; // New import
import './App.css';

function App() {
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
              <li><Link to="/login">Login</Link></li> {/* New link */}
            </ul>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} /> {/* New route */}
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;