import React, { useState, useEffect } from 'react';
import {
  Camera, BarChart3, Users, TrendingUp, LogOut,
  FileText, Calendar, Settings, Menu, X
} from 'lucide-react';
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

  useEffect(() => {
    console.log('✅ Current User:', currentUser);
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';
  const isTeacher = currentUser?.role === 'teacher';

  const navigationItems = [
    ...(isAdmin || isStudent || isTeacher ? [
      { id: 'camera', label: 'Camera', icon: Camera },
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    ] : []),
    ...(isStudent ? [
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'leave', label: 'Leave', icon: FileText },
      { id: 'od', label: 'OD', icon: Calendar },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
    ] : []),
    ...(isAdmin ? [
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'admin', label: 'Admin', icon: Settings },
    ] : []),
  ];

  const handleMenuItemClick = (viewId: string) => {
    setActiveView(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* LEFT - Logo */}
          <div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600" />
            <span className="text-base font-semibold text-gray-800 tracking-tight whitespace-nowrap">
              School Management System
            </span>
          </div>

          {/* CENTER - Nav Items */}
          <div className="hidden lg:flex items-center gap-4">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeView === item.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <item.icon className="h-5 w-5 mr-2" />
                {item.label}
              </button>
            ))}
          </div>

          {/* RIGHT - User Info + Logout + Mobile Menu */}
          <div className="flex items-center gap-4">

            {/* User Info */}
            {currentUser && (
              <div className="hidden sm:flex flex-col items-end text-sm text-gray-700 leading-tight">
                <span className="font-medium whitespace-nowrap">Welcome, {currentUser.fullName}</span>
                <span className="text-xs text-gray-500">
                  {currentUser.role} <span className="mx-1 text-gray-400">|</span> ID: {currentUser.employeeId}
                </span>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm transition"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3 shadow-md">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.id)}
              className={`w-full flex items-center px-4 py-2 rounded-md text-sm font-medium transition ${
                activeView === item.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          ))}

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center px-4 py-2 mt-4 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-md"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      )}
    </>
  );
};
