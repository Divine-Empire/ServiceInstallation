import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requiredPage = null 
}) => {
  const { isAuthenticated, user, hasPageAccess } = useAuthStore();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no user data, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Check page-based access
  if (requiredPage && !hasPageAccess(requiredPage)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;