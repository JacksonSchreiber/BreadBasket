import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { allItems, categories } from './categories';
import StoreLogos from './StoreLogos';
import './Home.css';

function Home() {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setLoggedIn(!!token);

    // Add visible class to elements immediately when component mounts
    document.querySelectorAll('.scroll-fade-in, .scroll-scale').forEach(
      element => element.classList.add('visible')
    );
    
    // Initialize selected categories
    const initialCategoryState = {};
    Object.keys(categories).forEach(category => {
      initialCategoryState[category] = false;
    });
    setSelectedCategories(initialCategoryState);
  }, []);
  
  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      } else {
        return [...prev, item];
      }
    });
  };
  
  const toggleCategory = (category) => {
    const updatedCategories = {
      ...selectedCategories,
      [category]: !selectedCategories[category]
    };
    setSelectedCategories(updatedCategories);
    
    // Update selected items based on category selection
    const newSelectedItems = [...selectedItems];
    
    if (updatedCategories[category]) {
      // Add all items from this category that aren't already selected
      categories[category].forEach(item => {
        if (!newSelectedItems.includes(item)) {
          newSelectedItems.push(item);
        }
      });
    } else {
      // Remove all items from this category
      return setSelectedItems(newSelectedItems.filter(item => !categories[category].includes(item)));
    }
    
    setSelectedItems(newSelectedItems);
  };
  
  const selectAllItems = () => {
    setSelectedItems([...allItems]);
    const allSelected = {};
    Object.keys(categories).forEach(category => {
      allSelected[category] = true;
    });
    setSelectedCategories(allSelected);
  };
  
  const clearSelection = () => {
    setSelectedItems([]);
    const noneSelected = {};
    Object.keys(categories).forEach(category => {
      noneSelected[category] = false;
    });
    setSelectedCategories(noneSelected);
  };

  const handleZipCodeSubmit = async (event) => {
    event.preventDefault();
    
    if (!showItemSelector) {
      setShowItemSelector(true);
      return;
    }
    
    if (selectedItems.length === 0) {
      setError('Please select at least one item to compare');
      return;
    }
    
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
      const itemPromises = selectedItems.map(async (item) => {
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
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content scroll-fade-in">
          <h1 className="hero-title">
            Find the Best Grocery Deals
            <span className="highlight"> Near You</span>
          </h1>
          <p className="hero-subtitle">
            Compare prices across multiple stores and save money on your groceries
          </p>
          {loggedIn ? (
            <>
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
                  {loading ? 'Loading...' : showItemSelector ? 'Compare Prices' : 'Continue'}
                </button>
                {error && <p className="error-message">{error}</p>}
              </form>
              
              {showItemSelector && (
                <div className="item-selector">
                  <h3>Select items to compare</h3>
                  <div className="selection-controls">
                    <button type="button" onClick={selectAllItems} className="select-btn">Select All</button>
                    <button type="button" onClick={clearSelection} className="clear-btn">Clear All</button>
                    <span className="items-count">{selectedItems.length} items selected</span>
                  </div>
                  
                  <div className="categories-container">
                    {Object.entries(categories).map(([category, items]) => (
                      <div key={category} className="category-container">
                        <div className="category-header">
                          <label className="category-checkbox">
                            <input 
                              type="checkbox" 
                              checked={selectedCategories[category] || false}
                              onChange={() => toggleCategory(category)}
                            />
                            <span className="category-name">{category}</span>
                          </label>
                        </div>
                        <div className="items-grid">
                          {items.map(item => (
                            <label key={item} className="item-checkbox">
                              <input 
                                type="checkbox"
                                checked={selectedItems.includes(item)}
                                onChange={() => toggleItemSelection(item)}
                              />
                              <span className="item-name">{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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
        </div>
      </section>

      {/* Features Section */}
      <section className="features scroll-scale">
        <h2>Why Choose BreadBasket?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Price Comparison</h3>
            <p>Compare prices across multiple stores in real-time</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Price History</h3>
            <p>Track price changes and find the best time to buy</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏪</div>
            <h3>Multiple Stores</h3>
            <p>Compare prices from various local grocery stores</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Save Money</h3>
            <p>Find the best deals and save on your grocery bills</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section scroll-fade-in">
        <div className="cta-content">
          <h2>Start Saving Today</h2>
          <p>Join thousands of smart shoppers who save money with BreadBasket</p>
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