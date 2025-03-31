import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" />;
  }

  if (adminOnly && role !== 'admin') {
    // Not an admin, redirect to home page
    return <Navigate to="/" />;
  }

  // Authorized, render component
  return children;
};

export default PrivateRoute; 