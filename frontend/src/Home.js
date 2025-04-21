import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allItems } from './categories';
import StoreLogos from './StoreLogos';
import './Home.css';

function Home() {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setLoggedIn(!!token);

    // Add visible class to elements with a stagger effect
    const elements = document.querySelectorAll('.scroll-fade-in, .scroll-scale');
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('visible');
      }, index * 150); // 150ms delay between each element
    });
  }, []);

  const handleZipCodeSubmit = async (event) => {
    event.preventDefault();
    
    setLoading(true);
    setError(null);

    try {
      // Automatically select all items
      // setSelectedItems(allItems);
      
      // Navigate to results with all items selected
      navigate('/results', { 
        state: { 
          zipCode,
          selectedItems: allItems 
        } 
      });
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Find the Best Grocery
            <span className="highlight"> Deals Near You</span>
          </h1>
          <p className="hero-subtitle">
            Compare prices across multiple stores and save money on your groceries with our smart shopping assistant
          </p>
          {loggedIn ? (
              <form onSubmit={handleZipCodeSubmit} className="zip-form">
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Enter your ZIP code"
                  className="zip-input"
                  pattern="[0-9]{5}"
                  title="Please enter a valid 5-digit ZIP code"
                  required
                />
                <button type="submit" className="cta-button" disabled={loading}>
                {loading ? (
                  <span className="loading-text">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Compare All Prices'
                )}
                </button>
                {error && <p className="error-message">{error}</p>}
              </form>
          ) : (
            <Link to="/login" className="cta-button">
              Get Started
            </Link>
          )}
        </div>
        <div className="hero-graphics">
          <div className="floating-card card-1">
            <span className="save-tag">Save 25%</span>
            <h3>Fresh Produce</h3>
            <p>Compare local deals</p>
          </div>
          <div className="floating-card card-2">
            <span className="save-tag">Best Price</span>
            <h3>Weekly Deals</h3>
            <p>Updated daily</p>
          </div>
          <div className="floating-card card-3">
            <span className="save-tag">Smart Shopping</span>
            <h3>Price History</h3>
            <p>Track changes</p>
          </div>
          <div className="floating-card card-4">
            <span className="save-tag">Save 30%</span>
            <h3>Seasonal Items</h3>
            <p>Holiday specials</p>
          </div>
          <div className="floating-card card-5">
            <span className="save-tag">Local Stores</span>
            <h3>Store Finder</h3>
            <p>Find nearby deals</p>
          </div>
          <div className="floating-card card-6">
            <span className="save-tag">AI Powered</span>
            <h3>Smart Lists</h3>
            <p>Personalized savings</p>
          </div>
          <div className="floating-card card-7">
            <span className="save-tag">Save 20%</span>
            <h3>Bulk Buying</h3>
            <p>Wholesale prices</p>
          </div>
          <div className="floating-card card-8">
            <span className="save-tag">Price Match</span>
            <h3>Best Value</h3>
            <p>Guaranteed savings</p>
          </div>
          <div className="floating-card card-9">
            <span className="save-tag">Digital Coupons</span>
            <h3>Extra Savings</h3>
            <p>Auto-applied deals</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features scroll-scale">
        <h2>Why Choose BreadBasket?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Smart Price Comparison</h3>
            <p>Compare prices across multiple stores in real-time with AI-powered insights</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Price History Tracking</h3>
            <p>Monitor price changes over time and find the best moments to buy</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏪</div>
            <h3>Local Store Coverage</h3>
            <p>Get prices from various local grocery stores in your neighborhood</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Maximize Savings</h3>
            <p>Save up to 30% on your grocery bills with smart shopping recommendations</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Price Drop Alerts</h3>
            <p>Get instant notifications when prices drop on your favorite items</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Shopping Lists</h3>
            <p>Create and manage smart shopping lists synchronized across all your devices</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section scroll-fade-in">
        <div className="cta-content">
          <h2>Start Saving Today</h2>
          <p>Join thousands of smart shoppers who save money with BreadBasket's intelligent price comparison</p>
          {!loggedIn && (
            <Link to="/login" className="cta-button">
              Create Free Account
            </Link>
          )}
        </div>
      </section>

      {/* Store Logos Section */}
      <StoreLogos />
    </div>
  );
}

export default Home;