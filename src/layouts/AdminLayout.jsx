import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  FileText,
  Truck,
  CheckSquare,
  MapPin,
  Settings,
  History,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (sidebarOpen) setSidebarOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30 h-14 shadow-sm">
        <div className="px-3 sm:px-4 lg:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden hover:text-gray-700 focus:outline-none focus:ring-2 rounded-md p-1.5 transition-colors"
              style={{ color: '#0066CC', focusRingColor: '#0066CC' }}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold" style={{ color: '#0066CC' }}>
                {(() => {
                  if (location.pathname.includes('/installation-followup')) return 'Inst. FollowUp';
                  if (location.pathname.includes('/installation')) return 'Installation';
                  if (location.pathname.includes('/intimation')) return 'Intimation Service 1';
                  if (location.pathname.includes('/service2')) return 'Intimation Service 3';
                  if (location.pathname.includes('/service')) return 'Intimation Service 2';
                  if (location.pathname.includes('/settings')) return 'Settings';
                  if (location.pathname.includes('/dashboard')) return 'Dashboard';
                  return 'Dashboard';
                })()}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* User Name Display */}
            {user && (
              <div className="flex items-center gap-1.5 text-gray-700">
                <User size={16} className="text-gray-500" />
                <span className="text-sm font-medium hidden sm:inline-block">{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 hover:text-green-700 focus:outline-none focus:ring-2 rounded-md px-2 py-1.5 transition-colors"
              style={{ color: '#0066CC', focusRingColor: '#0066CC' }}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline-block text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <aside
          className={`w-52 sm:w-56 bg-white border-r border-gray-200 fixed top-14 bottom-0 left-0 z-20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="h-full overflow-y-auto pb-16">
            <nav className="p-3 space-y-1">
              {/* Helper to check access */}
              {(() => {
                const hasAccess = (pageName) => {
                  // If no user, don't show anything
                  if (!user) {
                    return false;
                  }

                  // Check page access for ALL users (including Admin)
                  if (!user.pageAccess || user.pageAccess.length === 0) {
                    return false;
                  }

                  // Handle common typos (e.g., Dashborad -> Dashboard)
                  const typoMap = {
                    'Dashboard': ['Dashboard', 'Dashborad']
                  };

                  // Check if the page or its typo variations are in user's pageAccess
                  const variations = typoMap[pageName] || [pageName];
                  return variations.some(name => user.pageAccess.includes(name));
                };

                return (
                  <>
                    {hasAccess('Dashboard') && (
                      <Link
                        to="/admin/dashboard"
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isActive('/admin/dashboard')
                          ? 'text-white border-r-4'
                          : 'text-gray-700 hover:bg-sky-50 hover:text-sky-900'
                          }`}
                        style={isActive('/admin/dashboard') ? { backgroundColor: '#0066CC', borderRightColor: '#22c55e' } : {}}
                        onClick={closeSidebar}
                      >
                        <LayoutDashboard size={18} className="shrink-0" />
                        <span className="truncate">Dashboard</span>
                      </Link>
                    )}

                    {hasAccess('Installation') && (
                      <Link
                        to="/admin/installation"
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isActive('/admin/installation')
                          ? 'text-white border-r-4'
                          : 'text-gray-700 hover:bg-sky-50 hover:text-sky-900'
                          }`}
                        style={isActive('/admin/installation') ? { backgroundColor: '#0066CC', borderRightColor: '#22c55e' } : {}}
                        onClick={closeSidebar}
                      >
                        <FileText size={18} className="shrink-0" />
                        <span className="truncate">Installation</span>
                      </Link>
                    )}

                    {hasAccess('Installation FollowUp') && (
                      <Link
                        to="/admin/installation-followup"
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isActive('/admin/installation-followup')
                          ? 'text-white border-r-4'
                          : 'text-gray-700 hover:bg-sky-50 hover:text-sky-900'
                          }`}
                        style={isActive('/admin/installation-followup') ? { backgroundColor: '#0066CC', borderRightColor: '#22c55e' } : {}}
                        onClick={closeSidebar}
                      >
                        <History size={18} className="shrink-0" />
                        <span className="truncate">Inst. FollowUp</span>
                      </Link>
                    )}

                    {hasAccess('Intimation Service 1') && (
                      <Link
                        to="/admin/intimation"
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isActive('/admin/intimation')
                          ? 'text-white border-r-4'
                          : 'text-gray-700 hover:bg-sky-50 hover:text-sky-900'
                          }`}
                        style={isActive('/admin/intimation') ? { backgroundColor: '#0066CC', borderRightColor: '#22c55e' } : {}}
                        onClick={closeSidebar}
                      >
                        <MapPin size={18} className="shrink-0" />
                        <span className="truncate">Intimation Service 1</span>
                      </Link>
                    )}

                    {hasAccess('Intimation Service 2') && (
                      <Link
                        to="/admin/service"
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isActive('/admin/service')
                          ? 'text-white border-r-4'
                          : 'text-gray-700 hover:bg-sky-50 hover:text-sky-900'
                          }`}
                        style={isActive('/admin/service') ? { backgroundColor: '#0066CC', borderRightColor: '#22c55e' } : {}}
                        onClick={closeSidebar}
                      >
                        <CheckSquare size={18} className="shrink-0" />
                        <span className="truncate">Intimation Service 2</span>
                      </Link>
                    )}

                    {hasAccess('Intimation Service 3') && (
                      <Link
                        to="/admin/service2"
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isActive('/admin/service2')
                          ? 'text-white border-r-4'
                          : 'text-gray-700 hover:bg-sky-50 hover:text-sky-900'
                          }`}
                        style={isActive('/admin/service2') ? { backgroundColor: '#0066CC', borderRightColor: '#22c55e' } : {}}
                        onClick={closeSidebar}
                      >
                        <Truck size={18} className="shrink-0" />
                        <span className="truncate">Intimation Service 3</span>
                      </Link>
                    )}

                    {hasAccess('Settings') && (
                      <Link
                        to="/admin/settings"
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isActive('/admin/settings')
                          ? 'text-white border-r-4'
                          : 'text-gray-700 hover:bg-sky-50 hover:text-sky-900'
                          }`}
                        style={isActive('/admin/settings') ? { backgroundColor: '#0066CC', borderRightColor: '#22c55e' } : {}}
                        onClick={closeSidebar}
                      >
                        <Settings size={18} className="shrink-0" />
                        <span className="truncate">Settings</span>
                      </Link>
                    )}
                  </>
                );
              })()}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile sidebar - positioned below sidebar z-index */}
        {sidebarOpen && (
          <div
            className="fixed top-14 left-0 right-0 bottom-0 bg-black/50 z-[15] lg:hidden"
            onClick={closeSidebar}
          ></div>
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-56 min-w-0 bg-gray-50 relative z-0">
          <div className="bg-gray-50">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Fixed Footer */}
      <Footer />
    </div>
  );
};

export default AdminLayout;