import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GlobalStyles.css';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedLists, setSavedLists] = useState([]);
  const [recentComparisons, setRecentComparisons] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // TODO: Replace with actual API call
        const response = await fetch('/api/user-profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch user data');
        const data = await response.json();
        setUser(data);
        setSavedLists(data.savedLists || []);
        setRecentComparisons(data.recentComparisons || []);
      } catch (err) {
        setError('Failed to load profile data. Please try again.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="section">
        <div className="container">
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>Loading Profile</h2>
            <p style={{ marginTop: '1rem' }}>Please wait...</p>
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
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        {/* Profile Header */}
        <div className="card" style={{ marginBottom: '3rem', textAlign: 'center', padding: '3rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '60px', 
              background: '#e2e8f0', 
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem'
            }}>
              {user?.name?.[0] || '?'}
            </div>
            <h1>{user?.name || 'User'}</h1>
            <p style={{ marginTop: '0.5rem' }}>{user?.email}</p>
          </div>
          <button className="button button-secondary">
            Edit Profile
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-4" style={{ marginBottom: '3rem' }}>
          <div className="card">
            <h3>Total Savings</h3>
            <p style={{ fontSize: '2rem', marginTop: '1rem' }}>
              <strong>$XXX.XX</strong>
            </p>
          </div>
          <div className="card">
            <h3>Comparisons</h3>
            <p style={{ fontSize: '2rem', marginTop: '1rem' }}>
              <strong>{recentComparisons.length}</strong>
            </p>
          </div>
          <div className="card">
            <h3>Saved Lists</h3>
            <p style={{ fontSize: '2rem', marginTop: '1rem' }}>
              <strong>{savedLists.length}</strong>
            </p>
          </div>
          <div className="card">
            <h3>Favorite Stores</h3>
            <p style={{ fontSize: '2rem', marginTop: '1rem' }}>
              <strong>X</strong>
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Recent Comparisons</h2>
          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            {recentComparisons.map((comparison, index) => (
              <div key={index} className="card">
                <h3>{comparison.date}</h3>
                <div style={{ marginTop: '1rem' }}>
                  <p>Items Compared: <strong>{comparison.itemCount}</strong></p>
                  <p style={{ marginTop: '0.5rem' }}>Savings: <strong>${comparison.savings}</strong></p>
                  <button 
                    className="button button-secondary" 
                    style={{ marginTop: '1rem' }}
                    onClick={() => navigate(`/results/${comparison.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Shopping Lists */}
        <div className="card">
          <h2 style={{ marginBottom: '2rem' }}>Saved Shopping Lists</h2>
          <div className="grid grid-3" style={{ gap: '1.5rem' }}>
            {savedLists.map((list, index) => (
              <div key={index} className="card">
                <h3>{list.name}</h3>
                <div style={{ marginTop: '1rem' }}>
                  <p>Items: <strong>{list.items.length}</strong></p>
                  <p style={{ marginTop: '0.5rem' }}>Last Updated: <strong>{list.lastUpdated}</strong></p>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginTop: '1rem' 
                  }}>
                    <button className="button button-primary">
                      Compare Prices
                    </button>
                    <button className="button button-secondary">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile; 