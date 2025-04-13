import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  if (!token) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && userRole !== 'admin') {
    // Not an admin, redirect to home page
    return <Navigate to="/" replace />;
  }

  // Authorized, render component
  return children;
};

export default PrivateRoute; 