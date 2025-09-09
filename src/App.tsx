import React, { useState } from 'react';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PrincipalDashboard } from './views/PrincipalDashboard';
import { GuideDashboard } from './views/GuideDashboard';
import { StudentDashboard } from './views/StudentDashboard';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');

  const handleLogin = (email: string, password: string, role: string) => {
    // In a real app, this would validate credentials against a backend
    const mockUser: User = {
      id: `user-${Date.now()}`,
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role: role as User['role']
    };
    setUser(mockUser);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'students':
        return 'Student Management';
      case 'teams':
        return 'Team Management';
      case 'guides':
        return 'Guide Management';
      case 'analytics':
        return 'Analytics';
      case 'my-teams':
        return 'My Teams';
      case 'evaluations':
        return 'Evaluations';
      case 'weekly-logs':
        return 'Weekly Logs';
      case 'my-team':
        return 'My Team';
      case 'progress':
        return 'Progress';
      case 'documents':
        return 'Documents';
      case 'settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const renderDashboard = () => {
    switch (user?.role) {
      case 'principal':
        return <PrincipalDashboard />;
      case 'guide':
        return <GuideDashboard />;
      case 'team_lead':
      case 'student':
        return <StudentDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        user={user} 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} title={getPageTitle()} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderDashboard()}
        </main>
      </div>
    </div>
  );
}

export default App;