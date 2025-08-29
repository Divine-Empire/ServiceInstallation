import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      
      // Updated login function for Google Sheets integration
      login: (userData) => {
        if (userData) {
          set({ 
            isAuthenticated: true, 
            user: userData 
          });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ 
          isAuthenticated: false, 
          user: null 
        });
      },
      
      // Check if user has access to a specific page
      hasPageAccess: (pageName) => {
        const { user } = get();
        if (!user || !user.allowedPages) return false;
        
        // Convert page names to match route names
        const pageMapping = {
          'Dashboard': 'dashboard',
          'Service Installation': 'service-installation',
          'Service Intimation': 'service-intimation'
        };
        
        const routeName = pageMapping[pageName] || pageName.toLowerCase();
        return user.allowedPages.some(page => 
          page.toLowerCase().includes(routeName.replace('-', ' ')) || 
          routeName.includes(page.toLowerCase().replace(' ', '-')) ||
          page.toLowerCase() === pageName.toLowerCase()
        );
      },
      
      // Get user's allowed pages
      getAllowedPages: () => {
        const { user } = get();
        return user?.allowedPages || [];
      },
      
      // Get the first accessible page route for redirection
      getFirstAccessibleRoute: () => {
        const { user } = get();
        if (!user || !user.allowedPages || user.allowedPages.length === 0) {
          return '/dashboard';
        }
        
        const firstPage = user.allowedPages[0];
        const pageRoutes = {
          'Dashboard': '/dashboard',
          'Service Installation': '/service-installation',
          'Service Intimation': '/service-intimation'
        };
        
        // Try exact match first
        if (pageRoutes[firstPage]) {
          return pageRoutes[firstPage];
        }
        
        // Try partial matching
        const matchedRoute = Object.entries(pageRoutes).find(([pageName]) => 
          firstPage.toLowerCase().includes(pageName.toLowerCase()) ||
          pageName.toLowerCase().includes(firstPage.toLowerCase())
        );
        
        return matchedRoute ? matchedRoute[1] : '/dashboard';
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;