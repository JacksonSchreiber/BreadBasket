import React, { useState } from 'react';

function Home() {
  const [zipCode, setZipCode] = useState('');

  const handleZipCodeChange = (event) => {
    setZipCode(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent page reload

    const response = await fetch('http://127.0.0.1:5000/api/publix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ zipCode, item: 'eggs' }),
    });

    const data = await response.json();
    console.log(data.publix_prices);
  };

  return (
    <section>
      <h2>Find Affordable Groceries</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="zipCode">Enter your ZIP code:</label>
        <input
          type="text"
          id="zipCode"
          value={zipCode}
          onChange={handleZipCodeChange}
          placeholder="e.g., 33713"
        />
        <button type="submit">Search</button>
      </form>
    </section>
  );
}

export default Home;