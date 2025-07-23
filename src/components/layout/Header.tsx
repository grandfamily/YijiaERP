import React from 'react';
import { User, Settings, LogOut, Users, Cog } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getRoleDisplayName, authStore } from '../../store/auth';
import { Settings as SettingsPage } from '../settings/Settings';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showSettings, setShowSettings] = React.useState(false);

  const handleUserSwitch = (userId: string) => {
    authStore.switchUser(userId);
  };

  if (!user) return null;

  return (
    <>
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            一家百货采购管理系统
          </h1>
          <span className="text-sm text-gray-500">
            Procurement Management System
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* User Role Switch for Demo */}
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <select 
              className="text-sm border-gray-300 rounded-md"
              value={user.id}
              onChange={(e) => handleUserSwitch(e.target.value)}
            >
              {authStore.getAllUsers().map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({getRoleDisplayName(u.role)})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-gray-500">{getRoleDisplayName(user.role)}</div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
              title="系统设置"
            >
              <Settings className="h-5 w-5" />
            </button>
            
            <button 
              onClick={logout}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Settings Modal */}
    {showSettings && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">系统设置</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <SettingsPage />
          </div>
        </div>
      </div>
    )}
    </>
  );
};