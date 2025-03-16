import React, { useState } from 'react';
import './App.css';

function App() {
  const [zipCode, setZipCode] = useState('');

  const handleZipCodeChange = (event) => {
    setZipCode(event.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>BreadBasket</h1>
        <nav>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <section>
          <h2>Find Affordable Groceries</h2>
          <form>
            <label htmlFor="zipCode">Enter your ZIP code:</label>
            <input
              type="text"
              id="zipCode"
              value={zipCode}
              onChange={handleZipCodeChange}
              placeholder="e.g., 12345"
            />
            <button type="submit">Search</button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;