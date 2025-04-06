import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { allItems } from './categories';

function Home() {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleZipCodeChange = (event) => {
    setZipCode(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

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
        if (!response.ok) return 'N/A';
        const data = await response.json();
        return data.product_data.price || 'N/A'; // product_data is what all backend API should return to keep it friendly with frontend. each product_data should have a "price" in it
      } catch {
        return 'N/A';
      }
    };

    try {
      // Fetch prices for all items across all stores
      const itemPromises = allItems.map(async (item) => {
        const storePromises = stores.map((store) => fetchPrices(item, store));
        const storePrices = await Promise.all(storePromises);
        const prices = stores.reduce((acc, store, index) => {
          acc[store.name] = storePrices[index];
          return acc;
        }, {});
        return { item, prices };
      });

      const fetchedData = await Promise.all(itemPromises);
      navigate('/results', { state: { data: fetchedData } });
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <h1>Find Affordible Groceries</h1>
      <form onSubmit={handleSubmit}>
        {/* ZIP Code Input Field */}
        <label htmlFor="zipCode">Enter your ZIP code:</label>
        <input
          type="text"
          id="zipCode"
          value={zipCode}
          onChange={handleZipCodeChange}
          placeholder="e.g., 33713"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Compare Prices'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

export default Home;