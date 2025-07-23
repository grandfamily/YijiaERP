import React, { useState } from 'react';
import { X, Calendar, User, Package, Tag } from 'lucide-react';

interface FilterPanelProps {
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ onClose }) => {
  const [filters, setFilters] = useState({
    status: [] as string[],
    type: [] as string[],
    dateRange: {
      start: '',
      end: ''
    },
    requester: '',
    supplier: ''
  });

  const statusOptions = [
    { value: 'draft', label: '草稿' },
    { value: 'submitted', label: '已提交' },
    { value: 'approved', label: '已批准' },
    { value: 'rejected', label: '已拒绝' },
    { value: 'in_production', label: '生产中' },
    { value: 'quality_check', label: '质检中' },
    { value: 'ready_to_ship', label: '待发货' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' }
  ];

  const typeOptions = [
    { value: 'external', label: '厂家包装' },
    { value: 'in_house', label: '自己包装' }
  ];

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const handleTypeChange = (type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  const handleApplyFilters = () => {
    // Apply filters logic here
    console.log('Applied filters:', filters);
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      type: [],
      dateRange: { start: '', end: '' },
      requester: '',
      supplier: ''
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">筛选条件</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Tag className="h-4 w-4 inline mr-2" />
            状态
          </label>
          <div className="space-y-2">
            {statusOptions.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.status.includes(option.value)}
                  onChange={() => handleStatusChange(option.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Package className="h-4 w-4 inline mr-2" />
            类型
          </label>
          <div className="space-y-2">
            {typeOptions.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.type.includes(option.value)}
                  onChange={() => handleTypeChange(option.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Calendar className="h-4 w-4 inline mr-2" />
            日期范围
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="开始日期"
            />
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="结束日期"
            />
          </div>
        </div>

        {/* Requester Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <User className="h-4 w-4 inline mr-2" />
            申请人
          </label>
          <input
            type="text"
            value={filters.requester}
            onChange={(e) => setFilters(prev => ({ ...prev, requester: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入申请人姓名"
          />
        </div>

        {/* Supplier Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Package className="h-4 w-4 inline mr-2" />
            供应商
          </label>
          <input
            type="text"
            value={filters.supplier}
            onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入供应商名称"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          清空筛选
        </button>
        <button
          onClick={handleApplyFilters}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          应用筛选
        </button>
      </div>
    </div>
  );
};