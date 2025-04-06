import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { categories, itemToCategory } from './categories';
import './Results.css';

function Results() {
  const location = useLocation();
  const data = location.state?.data || [];
  const [isDairyExpanded, setIsDairyExpanded] = useState(false);

  if (data.length === 0) {
    return <p>No data available. Please try searching again.</p>;
  }

  // Group data by category
  const groupedData = {};
  data.forEach((entry) => {
    const category = itemToCategory[entry.item] || 'Other';
    if (!groupedData[category]) {
      groupedData[category] = [];
    }
    groupedData[category].push(entry);
  });

  const stores = data.length > 0 ? Object.keys(data[0].prices) : [];

  return (
    <div className="results-container">
      <Link to="/" className="back-link">Back to Search</Link>
      <h2>Grocery Prices Comparison</h2>
      {Object.keys(categories).map((category) => (
        <div key={category} className="category-section">
          <h3
            onClick={() => category === 'Dairy' && setIsDairyExpanded(!isDairyExpanded)}
            className={category === 'Dairy' ? 'clickable' : ''}
          >
            {category}
          </h3>
          {(category !== 'Dairy' || isDairyExpanded) && groupedData[category]?.length > 0 ? (
            <table className="results-table">
              <thead>
                <tr>
                  <th>Item</th>
                  {stores.map((store) => (
                    <th key={store}>{store}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedData[category].map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.item}</td>
                    {stores.map((store) => (
                      <td key={store}>{entry.prices[store]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : category === 'Dairy' && !isDairyExpanded ? (
            <p>Click to view Dairy products</p>
          ) : (
            <p>No items found for this category.</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default Results;