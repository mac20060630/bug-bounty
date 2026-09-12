import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070A11] flex flex-col items-center justify-center text-cyan-400 gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
          Authenticating Security Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and preserve intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce role-based access control (RBAC)
  if (requiredRole && user?.role !== requiredRole) {
    // Researcher attempting to view admin pages gets redirected to researcher dashboard
    return <Navigate to="/researcher/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
