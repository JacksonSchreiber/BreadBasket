import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function Admin() {
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('submissions');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetch both submissions and users
        const [submissionsResponse, usersResponse] = await Promise.all([
          fetch('http://127.0.0.1:5000/admin/contact-submissions', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('http://127.0.0.1:5000/admin/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (!submissionsResponse.ok || !usersResponse.ok) {
          if (submissionsResponse.status === 401 || usersResponse.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch data');
        }

        const [submissionsData, usersData] = await Promise.all([
          submissionsResponse.json(),
          usersResponse.json()
        ]);

        setSubmissions(submissionsData);
        setUsers(usersData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handlePromoteUser = async (email) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://127.0.0.1:5000/admin/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to promote user');
      }

      // Update users list
      setUsers(users.map(user => 
        user.email === email ? { ...user, role: 'admin' } : user
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDemoteUser = async (email) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://127.0.0.1:5000/admin/demote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to demote user');
      }

      // Update users list
      setUsers(users.map(user => 
        user.email === email ? { ...user, role: 'user' } : user
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return (
    <div className="admin-container">
      <h2>Loading...</h2>
    </div>
  );

  if (error) return (
    <div className="admin-container">
      <h2>Error</h2>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="admin-container">
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          Contact Submissions
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
      </div>

      {activeTab === 'submissions' ? (
        <div className="submissions-section">
          <h2>Contact Submissions</h2>
          {submissions.length === 0 ? (
            <p>No submissions yet.</p>
          ) : (
            <div className="submissions-list">
              {submissions.map((submission) => (
                <div key={submission.id} className="submission-card">
                  <h3>From: {submission.name}</h3>
                  <p>Email: {submission.email}</p>
                  <p>Date: {new Date(submission.created_at).toLocaleString()}</p>
                  <p className="message">{submission.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="users-section">
          <h2>User Management</h2>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="user-info">
                    <h3>{user.username}</h3>
                    <p>Email: {user.email}</p>
                    <p>Role: {user.role}</p>
                  </div>
                  <div className="user-actions">
                    {user.role === 'user' ? (
                      <button 
                        className="promote-button"
                        onClick={() => handlePromoteUser(user.email)}
                      >
                        Promote to Admin
                      </button>
                    ) : (
                      <button 
                        className="demote-button"
                        onClick={() => handleDemoteUser(user.email)}
                      >
                        Remove Admin
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin; 