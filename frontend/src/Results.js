import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { categories, itemToCategory, itemUnits } from './categories';
import './Results.css';

function Results() {
  const location = useLocation();
  const data = location.state?.data || [];
  const [expandedCategories, setExpandedCategories] = useState({});
  const [groupedData, setGroupedData] = useState({});
  const [filteredData, setFilteredData] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showUnitPrice, setShowUnitPrice] = useState(false);
  
  useEffect(() => {
    // Initialize all categories as expanded
    const initialExpandState = {};
    Object.keys(categories).forEach(cat => {
      initialExpandState[cat] = true;
    });
    setExpandedCategories(initialExpandState);
    
    // Group data by category
    const grouped = {};
    data.forEach((entry) => {
      const category = itemToCategory[entry.item] || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(entry);
    });
    setGroupedData(grouped);
    setFilteredData(grouped);
  }, [data]);
  
  // Calculate average price for an item across all stores
  const calculateAverage = (prices) => {
    const validPrices = Object.values(prices).filter(price => price !== 'N/A');
    if (validPrices.length === 0) return 0;
    return validPrices.reduce((sum, price) => sum + parseFloat(price), 0) / validPrices.length;
  };
  
  // Find the cheapest store for an item
  const findCheapestStore = (prices) => {
    let cheapestStore = null;
    let lowestPrice = Infinity;
    
    Object.entries(prices).forEach(([store, price]) => {
      if (price !== 'N/A' && parseFloat(price) < lowestPrice) {
        lowestPrice = parseFloat(price);
        cheapestStore = store;
      }
    });
    
    return cheapestStore;
  };
  
  // Find the cheapest store for a category
  const findCheapestStoreForCategory = (categoryItems) => {
    const storeTotals = {};
    const storeCount = {};
    
    categoryItems.forEach(item => {
      Object.entries(item.prices).forEach(([store, price]) => {
        if (price !== 'N/A') {
          if (!storeTotals[store]) {
            storeTotals[store] = 0;
            storeCount[store] = 0;
          }
          storeTotals[store] += parseFloat(price);
          storeCount[store]++;
        }
      });
    });
    
    let cheapestStore = null;
    let lowestAverage = Infinity;
    
    Object.entries(storeTotals).forEach(([store, total]) => {
      const average = total / storeCount[store];
      if (average < lowestAverage) {
        lowestAverage = average;
        cheapestStore = store;
      }
    });
    
    return { store: cheapestStore, average: lowestAverage.toFixed(2) };
  };
  
  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  // Sort data by column
  const requestSort = (key, storeIndex = null) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction, storeIndex });
    
    // Create a copy of the grouped data
    const sortedData = { ...filteredData };
    
    // Sort each category's data
    Object.keys(sortedData).forEach(category => {
      sortedData[category] = [...sortedData[category]].sort((a, b) => {
        if (key === 'item') {
          return direction === 'ascending' 
            ? a.item.localeCompare(b.item)
            : b.item.localeCompare(a.item);
        } else if (key === 'store') {
          const storeA = Object.values(a.prices)[storeIndex] || 'N/A';
          const storeB = Object.values(b.prices)[storeIndex] || 'N/A';
          
          if (storeA === 'N/A') return direction === 'ascending' ? 1 : -1;
          if (storeB === 'N/A') return direction === 'ascending' ? -1 : 1;
          
          return direction === 'ascending'
            ? parseFloat(storeA) - parseFloat(storeB)
            : parseFloat(storeB) - parseFloat(storeA);
        }
        return 0;
      });
    });
    
    setFilteredData(sortedData);
  };
  
  // Filter data based on search query and category
  const handleFilter = () => {
    if (!filterQuery && selectedCategory === 'All') {
      setFilteredData(groupedData);
      return;
    }
    
    const filtered = {};
    
    Object.keys(groupedData).forEach(category => {
      if (selectedCategory !== 'All' && category !== selectedCategory) {
        return;
      }
      
      filtered[category] = groupedData[category].filter(entry => {
        return entry.item.toLowerCase().includes(filterQuery.toLowerCase());
      });
    });
    
    setFilteredData(filtered);
  };
  
  useEffect(() => {
    handleFilter();
  }, [filterQuery, selectedCategory, groupedData]);
  
  // Get sorting indicator
  const getSortIndicator = (key, storeIndex = null) => {
    if (sortConfig.key !== key || (key === 'store' && sortConfig.storeIndex !== storeIndex)) {
      return '⇵';
    }
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };
  
  if (data.length === 0) {
    return <p>No data available. Please try searching again.</p>;
  }

  const stores = data.length > 0 ? Object.keys(data[0].prices) : [];

  return (
    <div className="results-container">
      <Link to="/" className="back-link">Back to Search</Link>
      <h2>Grocery Prices Comparison</h2>
      
      <div className="results-controls">
        <div className="filter-section">
          <input
            type="text"
            placeholder="Search for items..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="filter-input"
          />
          
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="All">All Categories</option>
            {Object.keys(categories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <div className="toggle-container">
            <label>
              <input
                type="checkbox"
                checked={showUnitPrice}
                onChange={() => setShowUnitPrice(!showUnitPrice)}
              />
              Show Unit Prices
            </label>
          </div>
          
          <button 
            className="expand-all-btn"
            onClick={() => {
              const allExpanded = {};
              Object.keys(categories).forEach(cat => {
                allExpanded[cat] = true;
              });
              setExpandedCategories(allExpanded);
            }}
          >
            Expand All
          </button>
          
          <button 
            className="collapse-all-btn"
            onClick={() => {
              const allCollapsed = {};
              Object.keys(categories).forEach(cat => {
                allCollapsed[cat] = false;
              });
              setExpandedCategories(allCollapsed);
            }}
          >
            Collapse All
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
                <table className="results-table">
                  <thead>
                    <tr>
                      <th onClick={() => requestSort('item')}>
                        Item {getSortIndicator('item')}
                      </th>
                      {showUnitPrice && <th>Unit</th>}
                      {stores.map((store, index) => (
                        <th key={store} onClick={() => requestSort('store', index)}>
                          {store} {getSortIndicator('store', index)}
                        </th>
                      ))}
                      <th>Best Deal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData[category]?.map((entry, index) => {
                      const cheapestStore = findCheapestStore(entry.prices);
                      
                      return (
                        <tr key={index}>
                          <td className="item-name">{entry.item}</td>
                          {showUnitPrice && <td>{itemUnits[entry.item] || 'each'}</td>}
                          {stores.map((store) => {
                            const isCheapest = store === cheapestStore;
                            return (
                              <td 
                                key={store}
                                className={isCheapest ? 'best-price' : ''}
                              >
                                {entry.prices[store] !== 'N/A' ? `$${entry.prices[store]}` : 'N/A'}
                              </td>
                            );
                          })}
                          <td>
                            {cheapestStore ? (
                              <span className="best-deal-tag">
                                {cheapestStore} ${entry.prices[cheapestStore]}
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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