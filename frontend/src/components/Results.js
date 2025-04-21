import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location.state?.zipCode || !location.state?.selectedItems) {
      navigate('/');
      return;
    }

    const fetchResults = async () => {
      try {
        // TODO: Replace with actual API call
        const response = await fetch('/api/compare-prices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            zipCode: location.state.zipCode,
            items: location.state.selectedItems,
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch results');
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError('Failed to load comparison results. Please try again.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [location.state, navigate]);

  if (loading) {
    return (
      <div className="section">
        <div className="container">
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>Finding the Best Deals</h2>
            <p style={{ marginTop: '1rem' }}>Comparing prices across stores in {location.state?.zipCode}...</p>
            {/* Add loading animation here */}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <div className="container">
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>Oops!</h2>
            <p style={{ marginTop: '1rem' }}>{error}</p>
            <button 
              className="button button-primary" 
              style={{ marginTop: '2rem' }}
              onClick={() => navigate('/')}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title">Price Comparison Results</h1>
        <p style={{ textAlign: 'center', marginBottom: '3rem' }}>
          Showing best deals in {location.state.zipCode}
        </p>

        <div className="grid grid-3">
          {/* Best Deals Summary Card */}
          <div className="card">
            <h3>Best Deals Summary</h3>
            <div style={{ marginTop: '1rem' }}>
              <p>Total Potential Savings: <strong>$XX.XX</strong></p>
              <p style={{ marginTop: '0.5rem' }}>Items Compared: <strong>{location.state.selectedItems.length}</strong></p>
            </div>
          </div>

          {/* Stores Compared Card */}
          <div className="card">
            <h3>Stores Compared</h3>
            <div style={{ marginTop: '1rem' }}>
              <p>Number of Stores: <strong>X</strong></p>
              <p style={{ marginTop: '0.5rem' }}>Area Coverage: <strong>5 mile radius</strong></p>
            </div>
          </div>

          {/* Shopping List Card */}
          <div className="card">
            <h3>Shopping List</h3>
            <div style={{ marginTop: '1rem' }}>
              <p>Optimized for: <strong>Best Prices</strong></p>
              <button className="button button-secondary" style={{ marginTop: '1rem' }}>
                Export List
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="card" style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Detailed Price Comparison</h2>
          <div className="grid grid-2" style={{ gap: '3rem' }}>
            {location.state.selectedItems.map((item, index) => (
              <div key={index} className="card">
                <h3>{item}</h3>
                <div style={{ marginTop: '1rem' }}>
                  <p>Best Price: <strong>$X.XX</strong></p>
                  <p style={{ marginTop: '0.5rem' }}>Store: <strong>Store Name</strong></p>
                  <p style={{ marginTop: '0.5rem' }}>Savings: <strong>$X.XX</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem', 
          marginTop: '3rem' 
        }}>
          <button className="button button-primary">
            Save Results
          </button>
          <button className="button button-secondary" onClick={() => navigate('/')}>
            New Comparison
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results; 