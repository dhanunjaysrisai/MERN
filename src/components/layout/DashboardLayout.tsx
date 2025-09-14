import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PrincipalDashboard } from '../../views/PrincipalDashboard';
import { GuideDashboard } from '../../views/GuideDashboard';
import { StudentDashboard } from '../../views/StudentDashboard';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!user) return null;

  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    switch (path) {
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
    switch (user.role) {
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        user={user} 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} title={getPageTitle()} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={renderDashboard()} />
            <Route path="/*" element={renderDashboard()} />
          </Routes>
        </main>
      </div>
    </div>
  );
};