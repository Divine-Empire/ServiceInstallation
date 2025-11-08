import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServiceInstallation from './pages/ServiceInstallation';
import ServiceIntimation from './pages/ServiceIntimation';
import Service1 from './pages/Service1';
import Service2 from './pages/Service2';
import Service3 from './pages/Service3';

// Component to handle automatic redirection to first accessible page
const DefaultRedirect = () => {
  const { user, getFirstAccessibleRoute } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && location.pathname === '/') {
      const firstRoute = getFirstAccessibleRoute();
      if (firstRoute !== '/') {
        navigate(firstRoute, { replace: true });
      }
    }
  }, [user, navigate, location.pathname, getFirstAccessibleRoute]);

  // If user has dashboard access, show dashboard
  if (user && user.allowedPages && user.allowedPages.some(page => 
    page.toLowerCase().includes('dashboard')
  )) {
    return <Dashboard />;
  }

  // Otherwise show a default message
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to MaintenancePro</h2>
        <p className="text-gray-600">Please select a page from the sidebar to get started.</p>
      </div>
    </div>
  );
};

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#4ade80',
              },
            },
            error: {
              duration: 4000,
              theme: {
                primary: '#ef4444',
              },
            },
          }}
        />
        
        <Routes>
          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login />
            } 
          />
          
          {/* Protected Routes with Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Default route - redirects to first accessible page */}
            <Route
              index
              element={<DefaultRedirect />}
            />
            
            {/* Dashboard - accessible to users with Dashboard access */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute requiredPage="Dashboard">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Service Installation */}
            <Route
              path="service-installation"
              element={
                <ProtectedRoute requiredPage="Service Installation">
                  <ServiceInstallation />
                </ProtectedRoute>
              }
            />
            
            {/* Service Intimation */}
            <Route
              path="service-intimation"
              element={
                <ProtectedRoute requiredPage="Service Intimation">
                  <ServiceIntimation />
                </ProtectedRoute>
              }
            />

            <Route
              path="service1"
              element={
                <ProtectedRoute requiredPage="Service 1">
                  <Service1 />
                </ProtectedRoute>
              }
            />
            <Route
              path="service2"
              element={
                <ProtectedRoute requiredPage="Service 2">
                  <Service2 />
                </ProtectedRoute>
              }
            />
            <Route
              path="service3"
              element={
                <ProtectedRoute requiredPage="Service 3">
                  <Service3 />
                </ProtectedRoute>
              }
            />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;