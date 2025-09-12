import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  ClipboardList, 
  LogOut, 
  X, 
  User 
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = ({ onClose }) => {
  const { user, logout, hasPageAccess } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  // Define all available menu items with correct routes
  const menuItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      requiredAccess: 'Dashboard'
    },
    {
      path: '/service-installation',
      name: 'Service Installation',
      icon: Wrench,
      requiredAccess: 'Service Installation'
    },
    {
      path: '/service-intimation',
      name: 'Service Intimation',
      icon: ClipboardList,
      requiredAccess: 'Service Intimation'
    }
  ];

  // Filter menu items based on user's page access
  const allowedMenuItems = menuItems.filter(item => {
    if (!user || !user.allowedPages) return false;
    
    // Check if user has access to this page
    return user.allowedPages.some(allowedPage => {
      const normalizedAllowed = allowedPage.toLowerCase().trim();
      const normalizedRequired = item.requiredAccess.toLowerCase().trim();
      
      return normalizedAllowed.includes(normalizedRequired) ||
             normalizedRequired.includes(normalizedAllowed) ||
             normalizedAllowed === normalizedRequired;
    });
  });

  return (
    <div className="flex flex-col h-full bg-indigo-900">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-indigo-800">
        <h1 className="text-xl font-bold flex items-center gap-2 text-white">
         
          <span>Service & Installation</span>
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
           
      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {allowedMenuItems.length > 0 ? (
          allowedMenuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center py-2.5 px-4 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-800 text-white shadow-lg'
                      : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                  }`
                }
                onClick={onClose}
              >
                <IconComponent className="mr-3 flex-shrink-0" size={20} />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })
        ) : (
          <div className="flex items-center py-2.5 px-4 text-indigo-300">
            <span className="text-sm">No accessible pages</span>
          </div>
        )}
      </nav>

      {/* User Info and Logout */}
      <div className="p-4 border-t border-indigo-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || user?.id || 'Guest'}
            </p>
            <p className="text-xs text-indigo-200 truncate">
              {user?.role === 'admin' ? 'Administrator' : 'User'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center py-2.5 px-4 rounded-lg text-indigo-100 hover:bg-indigo-800 hover:text-white cursor-pointer transition-colors duration-200 w-full"
        >
          <LogOut className="mr-3 flex-shrink-0" size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;