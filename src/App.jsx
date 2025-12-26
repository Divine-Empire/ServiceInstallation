import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';

import Dashboard from './pages/admin/Dashboard';
import Installation from './pages/admin/Installation';
import Intimation from './pages/admin/Intimation';
import Service from './pages/admin/Service';
import Service2 from './pages/admin/Service2';
import InstallationFollowUp from './pages/admin/InstallationFollowUp';
import Settings from './pages/admin/Settings';

import AdminLayout from './layouts/AdminLayout';

// Helper to get first accessible page based on user's page access
const getFirstAccessiblePage = (user) => {
  if (!user) return '/login';

  // Page name to route mapping (includes common typo variations)
  const pageRoutes = {
    'Dashboard': '/admin/dashboard',
    'Dashborad': '/admin/dashboard', // Common typo
    'Installation': '/admin/installation',
    'Installation FollowUp': '/admin/installation-followup',
    'Intimation Service 1': '/admin/intimation',
    'Intimation Service 2': '/admin/service',
    'Intimation Service 3': '/admin/service2',
    'Settings': '/admin/settings'
  };

  // Check page access for ALL users (including Admin)
  const accessiblePages = user.pageAccess || [];

  // Go to first accessible page from their list
  if (accessiblePages.length > 0) {
    // Find the route for the first page (check exact match first, then trimmed)
    const firstPage = accessiblePages[0].trim();
    return pageRoutes[firstPage] || '/login';
  }

  // No access - go back to login
  return '/login';
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={user ? <Navigate to={getFirstAccessiblePage(user)} /> : <Login />}
      />

      {/* ADMIN ROUTES */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to={getFirstAccessiblePage(user)} replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="installation" element={<Installation />} />
        <Route path="intimation" element={<Intimation />} />
        <Route path="service" element={<Service />} />
        <Route path="service2" element={<Service2 />} />
        <Route path="installation-followup" element={<InstallationFollowUp />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* USER ROUTES */}
      <Route path="/user" element={<AdminLayout />}>
        <Route index element={<Navigate to={getFirstAccessiblePage(user)} replace />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>

      {/* ROOT */}
      <Route
        path="/"
        element={
          user
            ? <Navigate to={getFirstAccessiblePage(user)} />
            : <Navigate to="/login" />
        }
      />
    </Routes>
  );
}

export default App;
