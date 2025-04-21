import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { categories, itemToCategory, itemUnits } from './categories';
import './Results.css';

const ChevronIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

function Results() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showUnitPrice, setShowUnitPrice] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending', storeIndex: null });
  const [addedToCart, setAddedToCart] = useState({});
  const [cartQuantities, setCartQuantities] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchPriceData = async () => {
      if (!location.state?.selectedItems || !location.state?.zipCode) {
        navigate('/');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Simulate fetching price data for each item
        // In a real app, this would be an API call
        const mockPriceData = location.state.selectedItems.map(item => ({
          item,
          prices: {
            'Walmart': (Math.random() * 10 + 1).toFixed(2),
            'Target': (Math.random() * 10 + 1).toFixed(2),
            'Kroger': (Math.random() * 10 + 1).toFixed(2),
            'Whole Foods': (Math.random() * 15 + 2).toFixed(2),
          }
        }));

        setData(mockPriceData);
      initializeCategories();
      } catch (err) {
        setError('Failed to fetch price data. Please try again.');
        console.error('Error fetching price data:', err);
      } finally {
        setLoading(false);
    }
    };

    fetchPriceData();
  }, [location.state, navigate]);

  useEffect(() => {
    loadCartQuantities();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const initializeCategories = () => {
    const expanded = {};
    Object.keys(categories).forEach(cat => {
      expanded[cat] = true;
    });
    setExpandedCategories(expanded);
  };

  const handleCartUpdate = (event) => {
    if (event.detail?.cartItems) {
      updateCartQuantities(event.detail.cartItems);
    } else {
      loadCartQuantities();
    }
  };

  const loadCartQuantities = () => {
    try {
      const savedCart = localStorage.getItem('cartItems_v2');
      if (savedCart) {
        updateCartQuantities(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const updateCartQuantities = (cartItems) => {
    const quantities = {};
    cartItems.forEach(item => {
      quantities[`${item.item}-${item.store}`] = item.quantity;
    });
    setCartQuantities(quantities);
  };

  const addToCart = (item, store, price) => {
    const itemId = `${item}-${store}`;
    try {
      const savedCart = localStorage.getItem('cartItems_v2');
      let cartItems = savedCart ? JSON.parse(savedCart) : [];
      
      const existingIndex = cartItems.findIndex(i => i.id === itemId);
      if (existingIndex >= 0) {
        cartItems[existingIndex].quantity += 1;
      } else {
        cartItems.push({
          id: itemId,
          item: item,
          store: store,
          price: price,
          quantity: 1,
          image: '/placeholder-grocery.jpg'
        });
      }

      localStorage.setItem('cartItems_v2', JSON.stringify(cartItems));
      updateCartQuantities(cartItems);
      
      setAddedToCart(prev => ({ ...prev, [itemId]: true }));
      setTimeout(() => {
        setAddedToCart(prev => ({ ...prev, [itemId]: false }));
      }, 1500);

      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cartItems } }));
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const updateQuantity = (item, store, price, newQuantity) => {
    if (newQuantity < 0) return;

    const itemId = `${item}-${store}`;
    try {
      const savedCart = localStorage.getItem('cartItems_v2');
      let cartItems = savedCart ? JSON.parse(savedCart) : [];
      
      if (newQuantity === 0) {
        cartItems = cartItems.filter(i => i.id !== itemId);
      } else {
        const existingIndex = cartItems.findIndex(i => i.id === itemId);
        if (existingIndex >= 0) {
          cartItems[existingIndex].quantity = newQuantity;
        } else {
          cartItems.push({
            id: itemId,
            item: item,
            store: store,
            price: price,
            quantity: newQuantity,
            image: '/placeholder-grocery.jpg'
          });
        }
      }

      localStorage.setItem('cartItems_v2', JSON.stringify(cartItems));
      updateCartQuantities(cartItems);
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cartItems } }));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const requestSort = (key, storeIndex = null) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.storeIndex === storeIndex) {
      direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    }
    setSortConfig({ key, direction, storeIndex });
  };

  const findCheapestStoreForCategory = (items) => {
    if (!items || items.length === 0) return { store: null, average: 0 };
    
    const storeTotals = {};
    const storeCounts = {};
    
    items.forEach(item => {
      Object.entries(item.prices).forEach(([store, price]) => {
        if (!storeTotals[store]) {
          storeTotals[store] = 0;
          storeCounts[store] = 0;
        }
        storeTotals[store] += parseFloat(price);
        storeCounts[store]++;
      });
    });
    
    let cheapestStore = null;
    let lowestAverage = Infinity;
    
    Object.entries(storeTotals).forEach(([store, total]) => {
      const average = total / storeCounts[store];
      if (average < lowestAverage) {
        lowestAverage = average;
        cheapestStore = store;
      }
    });
    
    return {
      store: cheapestStore,
      average: lowestAverage.toFixed(2)
    };
  };

  const filteredData = React.useMemo(() => {
    const result = {};
    Object.keys(categories).forEach(category => {
      result[category] = data
        .filter(item => categories[category].includes(item.item))
        .filter(item => 
          item.item.toLowerCase().includes(filterQuery.toLowerCase()) ||
          Object.entries(item.prices).some(([store, price]) => 
            store.toLowerCase().includes(filterQuery.toLowerCase()) ||
            price.toString().includes(filterQuery)
          )
        )
        .sort((a, b) => {
          if (sortConfig.key === 'item') {
            return sortConfig.direction === 'ascending' 
              ? a.item.localeCompare(b.item)
              : b.item.localeCompare(a.item);
          }
          if (sortConfig.key === 'store' && sortConfig.storeIndex !== null) {
            const stores = Object.keys(a.prices);
            const store = stores[sortConfig.storeIndex];
            return sortConfig.direction === 'ascending'
              ? parseFloat(a.prices[store]) - parseFloat(b.prices[store])
              : parseFloat(b.prices[store]) - parseFloat(a.prices[store]);
          }
          return 0;
        });
    });
    return result;
  }, [data, filterQuery, sortConfig]);

  const getSortIndicator = (key, storeIndex = null) => {
    if (sortConfig.key !== key || (key === 'store' && sortConfig.storeIndex !== storeIndex)) {
      return '⇵';
    }
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  const findCheapestStore = (prices) => {
    let cheapestStore = null;
    let lowestPrice = Infinity;
    
    Object.entries(prices).forEach(([store, price]) => {
      if (price !== 'N/A') {
        const priceNum = parseFloat(price);
        if (priceNum < lowestPrice) {
          lowestPrice = priceNum;
          cheapestStore = store;
        }
      }
    });
    
    return { store: cheapestStore, price: lowestPrice };
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Expand all categories
      const newExpandedCategories = {};
      Object.keys(categories).forEach(category => {
        newExpandedCategories[category] = true;
      });
      setExpandedCategories(newExpandedCategories);
    } else {
      // Collapse all categories
      setExpandedCategories({});
    }
  };

  const clearCart = () => {
    localStorage.removeItem('cartItems');
    setCartQuantities({});
    // Dispatch event to update cart count in App.js
    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: { cartItems: [] }
    }));
  };

  if (loading) {
    return (
      <div className="results-container loading">
        <div className="loading-spinner"></div>
        <p>Loading results...</p>
        <button onClick={clearCart} style={{marginTop: '20px'}}>Clear Cart</button>
        <Link to="/" className="back-link">← Back to Search</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-container error">
        <p>Error: {error}</p>
        <button onClick={clearCart} style={{marginTop: '20px'}}>Clear Cart</button>
        <Link to="/" className="back-link">← Back to Search</Link>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="no-results">
        <p>No data available. Please try searching again.</p>
        <Link to="/" className="back-link">← Back to Search</Link>
      </div>
    );
  }

  const stores = data.length > 0 ? Object.keys(data[0].prices) : [];

  return (
    <div className="results-container">
      <Link to="/" className="back-link">← Back to Search</Link>
      <h2>Grocery Prices Comparison</h2>
      
      <div className="results-controls">
        <div className="filter-section">
          <input
            type="text"
            className="filter-input"
            placeholder="Search items..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">Categories</option>
            {Object.keys(categories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button 
            className={`toggle-expand-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={toggleExpand}
          >
            <ChevronIcon />
            {isExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>
      
      {Object.keys(categories).map((category) => {
        if (!filteredData[category] || filteredData[category].length === 0) {
          return null;
        }
        
        const cheapestStoreInfo = findCheapestStoreForCategory(filteredData[category] || []);
        
        return (
          <div key={category} className="category-section">
            <div className="category-header">
              <h3
                onClick={() => toggleCategory(category)}
                className="clickable"
              >
                {category} {expandedCategories[category] ? '▼' : '▶'}
              </h3>
              {cheapestStoreInfo.store && (
                <div className="best-store-tag">
                  Best Store: <span className="best-store">{cheapestStoreInfo.store}</span> 
                  (avg. ${cheapestStoreInfo.average})
                </div>
              )}
            </div>
            
            {expandedCategories[category] && (
              <div className="category-content">
                <div className="items-grid">
                  {filteredData[category]?.map(item => {
                    const cheapestPrice = findCheapestStore(item.prices);
                    
                    return (
                      <div key={item.item} className="item-card">
                        <div className="item-header">
                          <h4>{(item.item || '').split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          ).join(' ')}</h4>
                          {showUnitPrice && <span className="unit">per unit</span>}
                        </div>
                        <div className="store-prices">
                          {Object.entries(item.prices).map(([store, price]) => {
                            const itemId = `${item.item}-${store}`;
                            const quantity = cartQuantities[itemId] || 0;
                            const priceNum = parseFloat(price);
                            const isAvailable = !isNaN(priceNum) && price !== 'N/A';
                            const isCheapest = isAvailable && store === cheapestPrice.store;

                            return (
                              <div key={store} className={`store-price ${isCheapest ? 'best-price' : ''}`}>
                                <div className="store-price-row">
                                  <div className="store-info-container">
                                    <div className="store-info">
                                      <span className="store-name">{store}</span>
                                      {isAvailable && (
                                        <span className="price">
                                          ${priceNum.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    {isCheapest && isAvailable && (
                                      <span className="best-price-tag">Best Price</span>
                                    )}
                                  </div>
                                  {isAvailable ? (
                                    quantity > 0 ? (
                                      <div className="quantity-controls">
                                        <button 
                                          onClick={() => updateQuantity(item.item, store, priceNum, quantity - 1)}
                                          className="quantity-btn"
                                        >
                                          −
                                        </button>
                                        <span className="quantity">{quantity}</span>
                                        <button 
                                          onClick={() => updateQuantity(item.item, store, priceNum, quantity + 1)}
                                          className="quantity-btn"
                                        >
                                          +
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        className={`add-to-cart-btn ${addedToCart[itemId] ? 'added' : ''}`}
                                        onClick={() => addToCart(item.item, store, priceNum)}
                                      >
                                        Add to Cart
                                      </button>
                                    )
                                  ) : (
                                    <span className="not-available">Not Available</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      <div className="savings-summary">
        <h3>Potential Savings</h3>
        <p>If you buy each item at the best price available, you could save compared to shopping at just one store.</p>
        
        <div className="savings-by-store">
          {stores.map(store => {
            // Calculate total if all items bought at this store
            let storeTotal = 0;
            let availableItemCount = 0;
            
            Object.values(filteredData).forEach(categoryItems => {
              categoryItems.forEach(item => {
                if (item.prices[store] !== 'N/A') {
                  storeTotal += parseFloat(item.prices[store]);
                  availableItemCount++;
                }
              });
            });
            
            // Calculate total if all items bought at best price
            let bestPriceTotal = 0;
            let bestPriceItemCount = 0;
            
            Object.values(filteredData).forEach(categoryItems => {
              categoryItems.forEach(item => {
                const cheapestStore = findCheapestStore(item.prices);
                if (cheapestStore) {
                  bestPriceTotal += parseFloat(item.prices[cheapestStore]);
                  bestPriceItemCount++;
                }
              });
            });
            
            // Only calculate if the store has prices for items
            if (availableItemCount === 0) return null;
            
            const potential = storeTotal - bestPriceTotal;
            const percentage = (potential / storeTotal) * 100;
            
            return (
              <div key={store} className="store-savings">
                <h4>{store}</h4>
                <p>Total: ${storeTotal.toFixed(2)}</p>
                <p>Potential savings: ${potential.toFixed(2)} ({percentage.toFixed(1)}%)</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Results;