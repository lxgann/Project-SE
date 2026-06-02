import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }
  if (requiredRole === 'uploader' && user?.role !== 'uploader' && user?.role !== 'admin') return <Navigate to="/" />;
  if (requiredRole === 'admin' && user?.role !== 'admin') return <Navigate to="/" />;

  return children;
};

export default ProtectedRoute;
