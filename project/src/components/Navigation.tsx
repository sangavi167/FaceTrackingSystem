import React, { useState } from 'react';
import { Camera, BarChart3, Users, TrendingUp, LogOut, FileText, Calendar, AlertTriangle, Settings, Menu, X } from 'lucide-react';
import { authManager } from '../utils/authManager';
import { User } from '../types';

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeView, 
  setActiveView, 
  currentUser,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';
  const isTeacher = currentUser?.role === 'teacher';

  const navigationItems = [
    ...(isAdmin || isStudent || isTeacher ? [
      { id: 'camera', label: 'Camera', icon: Camera },
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    ] : []),
    ...(isStudent || isTeacher ? [
      { id: 'leave', label: 'Leave', icon: FileText },
      { id: 'od', label: 'OD', icon: Calendar },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
    ] : []),
    ...(isAdmin ? [
      { id: 'admin', label: 'Admin', icon: Settings },
    ] : [])
  ];

  const handleMenuItemClick = (viewId: string) => {
    setActiveView(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Menu button and Logo */}
            <div className="flex items-center">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors mr-3"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">School Management System</h1>
            </div>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-4">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeView === item.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* User Info & Logout */}
            {currentUser && (
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-medium">{currentUser.fullName}</span>
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {currentUser.role === 'admin' ? 'Admin' : 
                       currentUser.role === 'student' ? 'Student' : 'Teacher'}
                    </span>
                    <span className="text-xs text-gray-400">
                      ID: {currentUser.employeeId}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span className="text-sm hidden sm:block">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* User Info in Mobile Menu */}
            {currentUser && (
              <div className="p-6 bg-blue-50 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{currentUser.fullName}</p>
                    <p className="text-sm text-gray-600">{currentUser.department}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {currentUser.role === 'admin' ? 'Admin' : 
                         currentUser.role === 'student' ? 'Student' : 'Teacher'}
                      </span>
                      <span className="text-xs text-gray-500">
                        ID: {currentUser.employeeId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Items */}
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeView === item.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Logout Button in Mobile Menu */}
            <div className="absolute bottom-6 left-4 right-4">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};