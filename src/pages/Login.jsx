import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, User, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyu-ZSfqc7JeysL6qh62ySVaCib8DUUyan1F7Bk6TxsTu6mfn0X9cyw78rK2TawiOKz/exec";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Fetch login data from Google Sheets
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Login Master&action=fetch`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch login data');
      }

      // Parse the sheet data
      const loginData = result.data;
      
      // Skip header row and find matching user
      const userRow = loginData.slice(1).find(row => {
        const userId = row[1]?.toString().trim(); // Column B - User ID
        const userPassword = row[2]?.toString().trim(); // Column C - Password
        
        return userId.toLowerCase() === username.toLowerCase() && userPassword === password;
      });

      if (userRow) {
        // Extract user information
        const userData = {
          name: userRow[0]?.toString().trim() || '', // Column A - Name
          id: userRow[1]?.toString().trim() || '', // Column B - User ID
          role: (userRow[3]?.toString().trim() || '').toLowerCase(), // Column D - Role
          pageAccess: userRow[4]?.toString().trim() || '' // Column E - Page Access
        };

        // Parse page access - convert comma-separated string to array
        const allowedPages = userData.pageAccess 
          ? userData.pageAccess.split(',').map(page => page.trim()).filter(page => page)
          : [];

        // Create user object for auth store
        const user = {
          id: userData.id,
          name: userData.name,
          role: userData.role,
          allowedPages: allowedPages
        };

        // Login user
        const loginSuccess = login(user);
        
        if (loginSuccess) {
          toast.success(`Welcome ${userData.name || userData.id}!`);
          
          // Navigate to first accessible page instead of default route
          const firstPage = allowedPages[0];
          if (firstPage) {
            const pageRoutes = {
              'Dashboard': '/dashboard',
              'Service Installation': '/service-installation',
              'Service Intimation': '/service-intimation'
            };
            
            // Find the route for the first accessible page
            const routePath = pageRoutes[firstPage];
            if (routePath) {
              navigate(routePath);
            } else {
              // If no exact match, try partial matching
              const matchedRoute = Object.entries(pageRoutes).find(([pageName]) => 
                firstPage.toLowerCase().includes(pageName.toLowerCase()) ||
                pageName.toLowerCase().includes(firstPage.toLowerCase())
              );
              navigate(matchedRoute ? matchedRoute[1] : '/dashboard');
            }
          } else {
            navigate('/dashboard');
          }
        } else {
          toast.error('Login failed. Please try again.');
        }
      } else {
        toast.error('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Wrench className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Service Installation</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                  placeholder="Enter your username"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="appearance-none relative block w-full pl-10 pr-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:from-indigo-400 disabled:to-purple-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Sign in to Continue
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Powered by{' '}
            <a 
              href="https://www.botivate.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Botivate
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;