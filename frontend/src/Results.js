import { useLocation, Link } from 'react-router-dom';
import './Results.css'; // Import CSS for styling

function Results() {
  const location = useLocation();
  const data = location.state?.data || []; // Access data from navigation state

  if (data.length === 0) {
    return <p>No data available. Please try searching again.</p>;
  }

  const stores = Object.keys(data[0].prices); // Dynamically get store names

  return (
    <div className="results-container">
      <Link to="/" className="back-link">Back to Search</Link>
      <h2>Grocery Prices Comparison</h2>
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
          {data.map((entry, index) => (
            <tr key={index}>
              <td>{entry.item}</td>
              {stores.map((store) => (
                <td key={store}>{entry.prices[store]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Results;