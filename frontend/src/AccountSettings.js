import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AccountSettings.css';

function AccountSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    email: localStorage.getItem('user') || '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: true,
    emailUpdates: true
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch user details when component mounts
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://127.0.0.1:5002/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUser(prev => ({
          ...prev,
          username: data.username || '',
          notifications: data.notifications ?? true,
          emailUpdates: data.emailUpdates ?? true
        }));
      } catch (error) {
        console.error('Error fetching user details:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      }
    };

    fetchUserDetails();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validate passwords if changing
      if (user.newPassword) {
        if (user.newPassword !== user.confirmPassword) {
          setMessage({ type: 'error', text: 'New passwords do not match' });
          setLoading(false);
          return;
        }
        if (user.newPassword.length < 8) {
          setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://127.0.0.1:5002/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: user.username,
          currentPassword: user.currentPassword,
          newPassword: user.newPassword,
          notifications: user.notifications,
          emailUpdates: user.emailUpdates
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        // Clear password fields
        setUser(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error updating profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-settings">
      <div className="account-settings-container">
        <h2>Account Settings</h2>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-section">
            <h3>Profile Information</h3>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="disabled-input"
              />
              <small>Email cannot be changed</small>
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={user.username}
                onChange={handleChange}
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Change Password</h3>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={user.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={user.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={user.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Preferences</h3>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="notifications"
                  checked={user.notifications}
                  onChange={handleChange}
                />
                Enable Notifications
              </label>
              <small>Receive notifications about price changes and deals</small>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="emailUpdates"
                  checked={user.emailUpdates}
                  onChange={handleChange}
                />
                Email Updates
              </label>
              <small>Receive email updates about your account and deals</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AccountSettings; 