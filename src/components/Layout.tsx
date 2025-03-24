import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Brain, Zap, Activity, Upload, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  Neural Compression
                </span>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  Dashboard
                </NavLink>

                {isAdmin && (
                  <NavLink
                    to="/model-training"
                    className={({ isActive }) =>
                      `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        isActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`
                    }
                  >
                    <Brain className="h-4 w-4 mr-1" />
                    Model Training
                  </NavLink>
                )}

                <NavLink
                  to="/image-compression"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Image Compression
                </NavLink>

                <NavLink
                  to="/model-compression"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Model Compression
                </NavLink>

                <NavLink
                  to="/model-evaluation"
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`
                  }
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Model Evaluation
                </NavLink>
              </div>
            </div>

            {/* User Menu */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <span className="mr-2">{user?.username}</span>
                    <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-800">
                      {user?.role}
                    </span>
                    <LogOut className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                <svg
                  className={`h-6 w-6 ${isMenuOpen ? 'hidden' : 'block'}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`h-6 w-6 ${isMenuOpen ? 'block' : 'hidden'}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="pt-2 pb-3 space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/model-training"
                className={({ isActive }) =>
                  `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <Brain className="h-4 w-4 mr-1" />
                  Model Training
                </div>
              </NavLink>
            )}

            <NavLink
              to="/image-compression"
              className={({ isActive }) =>
                `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Upload className="h-4 w-4 mr-1" />
                Image Compression
              </div>
            </NavLink>

            <NavLink
              to="/model-compression"
              className={({ isActive }) =>
                `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                Model Compression
              </div>
            </NavLink>

            <NavLink
              to="/model-evaluation"
              className={({ isActive }) =>
                `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Activity className="h-4 w-4 mr-1" />
                Model Evaluation
              </div>
            </NavLink>

            {/* Mobile User Info & Logout */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user?.username}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user?.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <LogOut className="h-4 w-4 mr-1" />
                    Sign out
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;