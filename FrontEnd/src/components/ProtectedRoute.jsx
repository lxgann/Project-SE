import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (requiredRole === 'uploader' && user?.role !== 'uploader' && user?.role !== 'admin') return <Navigate to="/" />;
  if (requiredRole === 'admin' && user?.role !== 'admin') return <Navigate to="/" />;

  return children;
};

export default ProtectedRoute;
