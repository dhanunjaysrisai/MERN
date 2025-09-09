import React from 'react';
import { 
  Home, 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  UserPlus,
  Calendar,
  Upload
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  user: User;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, currentView, onViewChange, onLogout }) => {
  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', icon: Home, label: 'Dashboard' },
    ];

    if (user.role === 'principal') {
      return [
        ...baseItems,
        { id: 'students', icon: UserPlus, label: 'Manage Students' },
        { id: 'teams', icon: Users, label: 'Teams' },
        { id: 'guides', icon: BookOpen, label: 'Project Guides' },
        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
        { id: 'settings', icon: Settings, label: 'Settings' }
      ];
    } else if (user.role === 'guide') {
      return [
        ...baseItems,
        { id: 'my-teams', icon: Users, label: 'My Teams' },
        { id: 'evaluations', icon: FileText, label: 'Evaluations' },
        { id: 'weekly-logs', icon: Calendar, label: 'Weekly Logs' }
      ];
    } else {
      return [
        ...baseItems,
        { id: 'my-team', icon: Users, label: 'My Team' },
        { id: 'progress', icon: BarChart3, label: 'Progress' },
        { id: 'documents', icon: Upload, label: 'Documents' },
        { id: 'weekly-logs', icon: Calendar, label: 'Weekly Logs' }
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">FYP Manager</h2>
            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${
                  currentView === item.id ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-6 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};