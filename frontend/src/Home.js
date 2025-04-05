import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook for navigation

  const handleZipCodeChange = (event) => {
    setZipCode(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const items = ['milk', 'eggs', 'bread', 'chicken breast'];
    const stores = [
      { name: 'Kroger', endpoint: 'http://127.0.0.1:5001/api/kroger' },
      { name: 'Publix', endpoint: 'http://127.0.0.1:5002/api/publix' },
      { name: 'ALDI', endpoint: 'http://127.0.0.1:5003/api/aldi' },
    ];

    const fetchPrices = async (item, store) => {
      try {
        const response = await fetch(store.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zipCode, item }),
        });
        if (!response.ok) throw new Error(`Failed to fetch ${item} from ${store.name}`);
        const data = await response.json();
        const priceKey = `${store.name.toLowerCase()}_prices`;
        return data[priceKey]?.price || 'N/A';
      } catch (err) {
        console.error(`Error fetching ${item} from ${store.name}:`, err);
        return 'Error';
      }
    };

    try {
      const itemPromises = items.map(async (item) => {
        const storePromises = stores.map((store) => fetchPrices(item, store));
        const storePrices = await Promise.all(storePromises);
        const prices = stores.reduce((acc, store, index) => {
          acc[store.name] = storePrices[index];
          return acc;
        }, {});
        return { item, prices };
      });

      const fetchedData = await Promise.all(itemPromises);
      navigate('/results', { state: { data: fetchedData } }); // Navigate with data
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
    </section>
  );
}

export default Home;