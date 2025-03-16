import React, { useState } from 'react';

function Home() {
  const [zipCode, setZipCode] = useState('');

  const handleZipCodeChange = (event) => {
    setZipCode(event.target.value);
  };

  return (
    <section>
      <h2>Find Affordable Groceries</h2>
      <form>
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