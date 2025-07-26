import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { CameraView } from './components/CameraView';
import { Navigation } from './components/Navigation';
import { AnalyticsView } from './components/AnalyticsView';
import { Dashboard } from './components/Dashboard';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { LeaveManagement } from './components/employee/LeaveManagement';
import { ODManagement } from './components/employee/ODManagement';
import { CalendarView } from './components/employee/CalendarView';
import { voiceAnnouncer } from './utils/voiceAnnouncements';
import { authManager } from './utils/authManager';
import { User } from './types';

function App() {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check authentication status on app load
  useEffect(() => {
    if (authManager.isAuthenticated()) {
      const user = authManager.getCurrentUser();
      setCurrentUser(user);
    }
  }, []);

  // Update voice announcer when view changes
  useEffect(() => {
    voiceAnnouncer.setOnCameraView(activeView === 'camera');
  }, [activeView]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Set default view based on role
    setActiveView(user.role === 'admin' ? 'dashboard' : 'dashboard');
  };

  const handleLogout = () => {
    authManager.logout();
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  // Show login screen if not authenticated
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = currentUser.role === 'admin';
  const isStudent = currentUser.role === 'student';
  const isTeacher = currentUser.role === 'teacher';

  const renderView = () => {
    switch (activeView) {
      case 'camera':
        return <CameraView />;
      case 'dashboard':
        return (isStudent || isTeacher) ? <EmployeeDashboard /> : <Dashboard />;
      case 'analytics':
        return <AnalyticsView />;
      case 'leave':
        return (isStudent || isTeacher) ? <LeaveManagement /> : <div>Access Denied</div>;
      case 'od':
        return (isStudent || isTeacher) ? <ODManagement /> : <div>Access Denied</div>;
      case 'calendar':
        return (isStudent || isTeacher) ? <CalendarView /> : <div>Access Denied</div>;
      case 'admin':
        return isAdmin ? <div>Admin Panel - Coming Soon</div> : <div>Access Denied</div>;
      default:
        return (isStudent || isTeacher) ? <EmployeeDashboard /> : <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation 
        activeView={activeView} 
        setActiveView={setActiveView}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      <main className="py-6">
        {renderView()}
      </main>
    </div>
  );
}

export default App;