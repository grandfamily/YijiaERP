import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">用户管理</h3>
          </div>
          <p className="text-gray-600 mb-4">
            管理系统用户账户和角色权限
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            管理用户
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">通知设置</h3>
          </div>
          <p className="text-gray-600 mb-4">
            配置系统通知和提醒规则
          </p>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            配置通知
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">安全设置</h3>
          </div>
          <p className="text-gray-600 mb-4">
            配置系统安全策略和访问控制
          </p>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
            安全配置
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">数据管理</h3>
          </div>
          <p className="text-gray-600 mb-4">
            数据备份、导入导出和系统维护
          </p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            数据管理
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">系统配置功能开发中...</h3>
        <p className="text-gray-600">
          完整的系统设置功能正在开发中，将包括用户权限管理、系统参数配置、数据备份等功能。
        </p>
      </div>
    </div>
  );
};