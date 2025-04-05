import { useState } from 'react';

function Home() {
  const [zipCode, setZipCode] = useState('');
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleZipCodeChange = (event) => {
    setZipCode(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setPrices([]);

    const items = ['milk', 'eggs', 'bread', 'chicken breast'];
    const apiEndpoint = 'http://127.0.0.1:5000/api/kroger'; 

    try {
      const promises = items.map(async (item) => {
        try {
          console.log(`Fetching price for ${item} in ZIP ${zipCode}`);
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zipCode, item }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log(`Received data for ${item}:`, data);

          if (data.kroger_prices && data.kroger_prices.price) {
            return { item, price: data.kroger_prices.price };
          } else {
            throw new Error(`Invalid response format for ${item}`);
          }
        } catch (err) {
          console.error(`Error fetching ${item}:`, err);
          return { item, price: 'Error' };
        }
      });

      const fetchedPrices = await Promise.all(promises);
      setPrices(fetchedPrices);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Overall fetch error:', err);
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

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