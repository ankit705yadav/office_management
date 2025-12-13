import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { setNavigationHandler } from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeavesPage from './pages/LeavesPage';
import AttendancePage from './pages/AttendancePage';
import HolidaysPage from './pages/HolidaysPage';
import ProfilePage from './pages/ProfilePage';
import PayrollPage from './pages/PayrollPage';
import SalarySetupPage from './pages/SalarySetupPage';
import ExpensesPage from './pages/ExpensesPage';
import EmployeesPage from './pages/EmployeesPage';
import VendorsPage from './pages/VendorsPage';
import CustomersPage from './pages/CustomersPage';
import InventoryPage from './pages/InventoryPage';
import AssetsPage from './pages/AssetsPage';
import ProjectsPage from './pages/ProjectsPage';
import StoragePage from './pages/StoragePage';
import PublicFilePage from './pages/PublicFilePage';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Set up navigation handler for API interceptor
  useEffect(() => {
    setNavigationHandler(() => {
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route path="/shared/:token" element={<PublicFilePage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="salary-setup" element={<SalarySetupPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="storage" element={<StoragePage />} />
        <Route path="holidays" element={<HolidaysPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
