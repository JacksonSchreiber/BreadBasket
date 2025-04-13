import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5002';

function Admin() {
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('submissions');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // First verify the token is still valid
      const verifyResponse = await fetch(`${API_URL}/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!verifyResponse.ok) {
        throw new Error('Token verification failed');
      }

      // Fetch both submissions and users
      const [submissionsResponse, usersResponse] = await Promise.all([
        fetch(`${API_URL}/admin/contact-submissions?filter=${filter}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // Check for specific error cases
      if (submissionsResponse.status === 401 || usersResponse.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        navigate('/login');
        throw new Error('Session expired. Please login again.');
      }

      if (!submissionsResponse.ok) {
        throw new Error(`Failed to fetch submissions: ${submissionsResponse.statusText}`);
      }

      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.statusText}`);
      }

      const [submissionsData, usersData] = await Promise.all([
        submissionsResponse.json(),
        usersResponse.json()
      ]);

      setSubmissions(submissionsData);
      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error('Error in Admin:', err);
      setError(err.message || 'Failed to fetch data. Please try again.');
      
      // Handle specific error cases
      if (err.message.includes('Token verification failed') || 
          err.message.includes('Session expired')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResponse = async (submissionId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `${API_URL}/admin/contact-submissions/${submissionId}/toggle-response`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update submission status');
      }

      // Update the local state
      setSubmissions(submissions.map(submission =>
        submission.id === submissionId
          ? { ...submission, responded: !submission.responded }
          : submission
      ));
    } catch (err) {
      setError('Failed to update submission status');
    }
  };

  const handleUpdateNotes = async (submissionId, notes) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `${API_URL}/admin/contact-submissions/${submissionId}/update-notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ notes })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }

      // Update the local state
      setSubmissions(submissions.map(submission =>
        submission.id === submissionId
          ? { ...submission, admin_notes: notes }
          : submission
      ));
    } catch (err) {
      setError('Failed to update notes');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handlePromoteUser = async (email) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/admin/promote`, {
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
      const response = await fetch(`${API_URL}/admin/demote`, {
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

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

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

      {activeTab === 'submissions' && (
        <div className="submissions-section">
          <div className="filter-controls">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Submissions</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
            </select>
          </div>

          <div className="submissions-list">
            {submissions.length === 0 ? (
              <div className="no-submissions">No submissions found.</div>
            ) : (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`submission-card ${submission.responded ? 'responded' : ''}`}
                >
                  <div className="submission-header">
                    <h3>{submission.name}</h3>
                    <div className="submission-status">
                      <label className="status-toggle">
                        <input
                          type="checkbox"
                          checked={submission.responded}
                          onChange={() => handleToggleResponse(submission.id)}
                        />
                        <span className="status-label">
                          {submission.responded ? 'Responded' : 'Pending'}
                        </span>
                      </label>
                    </div>
                  </div>
                  <p className="submission-email">{submission.email}</p>
                  <p className="submission-message">{submission.message}</p>
                  <p className="submission-date">
                    Submitted: {formatDate(submission.submission_date)}
                  </p>
                  <div className="admin-notes">
                    <textarea
                      placeholder="Add notes about this submission..."
                      value={submission.admin_notes || ''}
                      onChange={(e) => {
                        setSubmissions(submissions.map(s =>
                          s.id === submission.id
                            ? { ...s, admin_notes: e.target.value }
                            : s
                        ));
                      }}
                      className="notes-textarea"
                    />
                    <button
                      className="save-notes-button"
                      onClick={() => handleUpdateNotes(submission.id, submission.admin_notes)}
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-section">
          <h2>User Management</h2>
          <div className="users-list">
            {users.length === 0 ? (
              <div className="no-users">No users found.</div>
            ) : (
              users.map((user) => (
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin; 