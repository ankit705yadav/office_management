import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { setNavigationHandler } from './services/api';

// Dashboard Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeavesPage from './pages/LeavesPage';
import AttendancePage from './pages/AttendancePage';
import HolidaysPage from './pages/HolidaysPage';
import ProfilePage from './pages/ProfilePage';
import EmployeesPage from './pages/EmployeesPage';
import ProjectsPage from './pages/ProjectsPage';
import DailyReportsPage from './pages/DailyReportsPage';
import PaymentsPage from './pages/PaymentsPage';
import ClientsPage from './pages/ClientsPage';

// Landing Pages
import HomePage from './pages/landing/HomePage';
import FeaturesPage from './pages/landing/FeaturesPage';
import HowItWorksPage from './pages/landing/HowItWorksPage';
import ContactPage from './pages/landing/ContactPage';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';
import LandingLayout from './components/landing/LandingLayout';

// Loading Component
const LoadingScreen = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Set up navigation handler for API interceptor
  useEffect(() => {
    setNavigationHandler(() => {
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {isAuthenticated ? (
        // Authenticated Routes - Dashboard
        <>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="leaves" element={<LeavesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="daily-reports" element={<DailyReportsPage />} />
            <Route path="holidays" element={<HolidaysPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          {/* Redirect any other route to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        // Public Routes - Landing Page
        <>
          <Route path="/" element={<LandingLayout />}>
            <Route index element={<HomePage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          {/* Redirect any other route to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
};

export default App;
