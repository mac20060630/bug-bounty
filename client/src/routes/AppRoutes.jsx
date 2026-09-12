import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Layouts
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Guard
import ProtectedRoute from './ProtectedRoute';

// Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ResearcherDashboard from '../pages/ResearcherDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

// Public Route Guard: If authenticated, redirect away from login/register
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/researcher/dashboard'} replace />;
  }
  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages with Main Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Authenticated Dashboard Pages */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/researcher/dashboard" element={<ResearcherDashboard />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
