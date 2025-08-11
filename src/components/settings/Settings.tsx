import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Save,
  Eye
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

type SettingsTab = 'users' | 'notifications' | 'security' | 'data' | 'system';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    orderReminders: true,
    paymentAlerts: true,
    qualityAlerts: true
  });

  const tabs = [
    { id: 'users' as SettingsTab, label: '用户管理', icon: <User className="h-4 w-4" /> },
    { id: 'notifications' as SettingsTab, label: '通知设置', icon: <Bell className="h-4 w-4" /> },
    { id: 'security' as SettingsTab, label: '安全设置', icon: <Shield className="h-4 w-4" /> },
    { id: 'data' as SettingsTab, label: '数据管理', icon: <Database className="h-4 w-4" /> },
    { id: 'system' as SettingsTab, label: '系统维护', icon: <SettingsIcon className="h-4 w-4" /> }
  ];

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">当前用户信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input 
              type="text" 
              value={user?.name || ''} 
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input 
              type="email" 
              value={user?.email || ''} 
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <input 
              type="text" 
              value={getRoleName(user?.role || '')} 
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
            <input 
              type="text" 
              value={user?.department || ''} 
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">密码修改</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入当前密码"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入新密码"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请再次输入新密码"
            />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            更新密码
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">通知偏好设置</h3>
        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: '邮件通知', description: '接收系统邮件通知' },
            { key: 'pushNotifications', label: '推送通知', description: '浏览器推送通知' },
            { key: 'orderReminders', label: '订单提醒', description: '订单状态变更提醒' },
            { key: 'paymentAlerts', label: '付款提醒', description: '付款相关通知' },
            { key: 'qualityAlerts', label: '质量警报', description: '质量问题通知' }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div>
                <h4 className="font-medium text-gray-900">{label}</h4>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings[key as keyof typeof notificationSettings]}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>保存设置</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">安全策略</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h4 className="font-medium text-gray-900">双因素认证</h4>
              <p className="text-sm text-gray-600">启用双因素身份验证以增强账户安全</p>
            </div>
            <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">
              配置
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h4 className="font-medium text-gray-900">登录日志</h4>
              <p className="text-sm text-gray-600">查看最近的登录活动记录</p>
            </div>
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>查看</span>
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">会话管理</h4>
              <p className="text-sm text-gray-600">管理活跃的登录会话</p>
            </div>
            <button className="px-3 py-1 bg-red-600 text-white rounded text-sm">
              注销所有会话
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">数据备份与恢复</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">数据导出</h4>
            <p className="text-sm text-gray-600 mb-3">导出系统数据用于备份或分析</p>
            <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded text-sm">
              <Download className="h-4 w-4" />
              <span>导出数据</span>
            </button>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">数据导入</h4>
            <p className="text-sm text-gray-600 mb-3">从备份文件恢复系统数据</p>
            <button className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded text-sm">
              <Upload className="h-4 w-4" />
              <span>导入数据</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">数据清理</h3>
        <div className="space-y-4">
          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ 危险操作</h4>
            <p className="text-sm text-yellow-700 mb-3">以下操作将永久删除数据，请谨慎操作</p>
            <div className="space-y-2">
              <button className="flex items-center space-x-2 px-3 py-2 bg-yellow-600 text-white rounded text-sm mr-2">
                <Trash2 className="h-4 w-4" />
                <span>清理日志文件</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded text-sm">
                <Trash2 className="h-4 w-4" />
                <span>重置系统数据</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemMaintenance = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700">系统版本</h4>
            <p className="text-gray-900">v1.0.0</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">最后更新</h4>
            <p className="text-gray-900">2024-01-26</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">数据库状态</h4>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">正常</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-700">系统负载</h4>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">低</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibent text-gray-900 mb-4">系统维护</h3>
        <div className="space-y-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
            <RefreshCw className="h-4 w-4" />
            <span>刷新缓存</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg">
            <Database className="h-4 w-4" />
            <span>优化数据库</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg">
            <RefreshCw className="h-4 w-4" />
            <span>重启系统服务</span>
          </button>
        </div>
      </div>
    </div>
  );

  const getRoleName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'purchasing_officer': '采购专员',
      'department_manager': '部门主管',
      'general_manager': '总经理',
      'card_designer': '纸卡设计人员',
      'production_staff': '生产排单人员',
      'warehouse_staff': '仓管人员',
      'logistics_staff': '物流专员',
      'finance_personnel': '财务人员',
      'accessory_staff': '辅料人员',
      'qc_officer': '质检专员'
    };
    return roleNames[role] || role;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUserManagement();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'data':
        return renderDataManagement();
      case 'system':
        return renderSystemMaintenance();
      default:
        return renderUserManagement();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-600">管理系统配置和个人设置</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};