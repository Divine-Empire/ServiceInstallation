import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    // Simulate API delay
    setTimeout(async () => {
      const result = await login(username, password);

      if (result === true) {
        // Get user from localStorage to determine first accessible page
        const storedUser = localStorage.getItem('service_installation_user');
        let firstPage = '/login'; // Default to login if no access

        if (storedUser) {
          const userData = JSON.parse(storedUser);

          // Mapping of page names to routes (includes common typo variations)
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

          // Go to first accessible page for ALL users
          const accessiblePages = userData.pageAccess || [];
          if (accessiblePages.length > 0) {
            const pageName = accessiblePages[0].trim();
            firstPage = pageRoutes[pageName] || '/login';
          }
        }

        navigate(firstPage);
      } else if (result === 'deactivated') {
        setError('Access denied! Your account has been deactivated. Please contact Admin.');
        setIsLoading(false);
      } else if (result === 'no_access') {
        setError('You have no access to any page. Please contact Admin.');
        setIsLoading(false);
      } else {
        setError('Invalid username or password.');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Main Container without Border */}
        <div className="w-full max-w-md bg-white shadow-lg">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col">
              {/* Logo Section - Centered */}
              <div className="mb-8 text-center">
                <div className="mb-4">
                  <img
                    src="/Image/Logo.jpg"
                    alt="Service Installation Logo"
                    className="h-28 sm:h-32 mx-auto object-contain mb-4"
                  />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ color: '#0066CC' }}>
                  Service Installation
                </h1>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-sky-50 border-l-4 border-sky-600 p-3">
                  <div className="flex items-center">
                    <AlertCircle size={16} className="text-sky-600 mr-2 flex-shrink-0" />
                    <span className="text-sky-800 text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form className="space-y-5 w-full" onSubmit={handleSubmit} autoComplete="off">
                {/* User ID Input */}
                <div>
                  <label htmlFor="username" className="block text-lg font-bold mb-2" style={{ color: '#0066CC' }}>
                    User ID
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-shadow"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-lg font-bold mb-2" style={{ color: '#0066CC' }}>
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-shadow"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-6 text-white text-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-70 bg-sky-600"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default Login;