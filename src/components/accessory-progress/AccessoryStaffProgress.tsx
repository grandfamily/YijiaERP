import React, { useState } from 'react';
import { Search, Upload, Eye, Edit, Save, X, Filter, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface AccessoryStaffProgressProps {
  embedded?: boolean;
  requestId?: string;
}

export const AccessoryStaffProgress: React.FC<AccessoryStaffProgressProps> = ({ 
  embedded = false, 
  requestId 
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkCostUpload, setShowBulkCostUpload] = useState(false);

  // Mock data - replace with actual data fetching logic
  const mockData = {
    pending: [],
    in_progress: [],
    completed: []
  };

  const currentData = mockData[activeTab];
  const filteredData = currentData.filter((item: any) => 
    searchTerm === '' || 
    (item.requestNumber && item.requestNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Mock permission check - replace with actual permission logic
  const canAccessoryPersonnel = true;

  return (
    <div className="p-6 space-y-6">
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">辅料进度管理</h1>
            <p className="text-gray-600">管理辅料采购和生产进度</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-5 w-5" />
            <span>待处理</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {mockData.pending.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'in_progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
            <span>进行中</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {mockData.in_progress.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircle className="h-5 w-5" />
            <span>已完成</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {mockData.completed.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索订单号或SKU..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {canAccessoryPersonnel && activeTab === 'completed' && (
          <button
            onClick={() => setShowBulkCostUpload(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-4 h-4" />
            <span>批量导入成本</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {activeTab === 'pending' && <Clock className="h-12 w-12 mx-auto" />}
              {activeTab === 'in_progress' && <AlertTriangle className="h-12 w-12 mx-auto" />}
              {activeTab === 'completed' && <CheckCircle className="h-12 w-12 mx-auto" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无数据
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pending' && '暂无待处理的辅料订单'}
              {activeTab === 'in_progress' && '暂无进行中的辅料订单'}
              {activeTab === 'completed' && '暂无已完成的辅料订单'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">订单编号</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">更新时间</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Table rows would be rendered here */}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Cost Upload Modal */}
      {showBulkCostUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">批量导入成本</h3>
              <button
                onClick={() => setShowBulkCostUpload(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">请选择要上传的成本文件</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowBulkCostUpload(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => setShowBulkCostUpload(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                上传
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};