import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home,
  Phone,
  FileText,
  FileCode,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    // For logout, you might want to clear any auth data before navigating
    if (path === '/logout') {
      localStorage.removeItem('isAuthenticated');
      // Any other auth cleanup
    }
    navigate(path);
  };

  // Helper function to check if current path starts with a specific route
  const isPathActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">Voice AI Platform</h1>
        </div>

        <nav className="mt-5">
          <ul>
            <li>
              <button 
                onClick={() => handleNavigation('/')} 
                className={`flex items-center px-4 py-3 w-full text-left ${location.pathname === '/' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Home className="h-5 w-5 mr-3" />
                <span>Dashboard</span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/call-management')} 
                className={`flex items-center justify-between px-4 py-3 w-full text-left ${isPathActive('/call-management') ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3" />
                  <span>Call Management</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/call-logs')} 
                className={`flex items-center px-4 py-3 ml-8 w-full text-left ${location.pathname === '/call-logs' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <span>Call Logs</span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/appointments')} 
                className={`flex items-center px-4 py-3 ml-8 w-full text-left ${location.pathname === '/appointments' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <span>Appointments</span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/knowledge')} 
                className={`flex items-center justify-between px-4 py-3 w-full text-left ${isPathActive('/knowledge') ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3" />
                  <span>Knowledge</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/knowledge/upload')} 
                className={`flex items-center px-4 py-3 ml-8 w-full text-left ${location.pathname === '/knowledge/upload' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <span>Upload Documents</span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/scripts')} 
                className={`flex items-center px-4 py-3 w-full text-left ${location.pathname === '/scripts' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FileCode className="h-5 w-5 mr-3" />
                <span>Scripts</span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/configuration')} 
                className={`flex items-center px-4 py-3 w-full text-left ${location.pathname === '/configuration' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Settings className="h-5 w-5 mr-3" />
                <span>Configuration</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-64 border-t border-gray-200">
          <div className="p-4 flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-white mr-3">
              A
            </div>
            <div>
              <p className="font-medium">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          
          <button 
            onClick={() => handleNavigation('/logout')} 
            className="flex items-center px-4 py-3 w-full text-left text-gray-600 hover:bg-gray-100 border-t border-gray-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;