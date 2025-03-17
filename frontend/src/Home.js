import { useState } from 'react';

function Home() {
  const [zipCode, setZipCode] = useState('');
  const [prices, setPrices] = useState([]);

  const handleZipCodeChange = (event) => {
    setZipCode(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent page reload

    const items = ['milk', 'eggs', 'bread', 'chicken breast'];
    const fetchedPrices = [];

    for (const item of items) {
      const response = await fetch('http://127.0.0.1:5000/api/publix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zipCode, item }),
      });

      const data = await response.json();
      fetchedPrices.push({ item, price: data.publix_prices[0].price });
    }

    setPrices(fetchedPrices);
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

      {prices.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((entry, index) => (
              <tr key={index}>
                <td>{entry.item}</td>
                <td>{entry.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default Home;
