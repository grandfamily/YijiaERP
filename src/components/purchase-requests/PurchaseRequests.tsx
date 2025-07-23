import React, { useState } from 'react';
import { Plus, Search, Filter, Download, Upload, Send } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseRequestList } from './PurchaseRequestList';
import { CreatePurchaseRequest } from './CreatePurchaseRequest';
import { BulkImportPurchaseRequests } from './BulkImportPurchaseRequests';
import { FilterPanel } from './FilterPanel';

export const PurchaseRequests: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const { hasPermission, user } = useAuth();
  const { updatePurchaseRequest } = useProcurement();

  const canCreateRequest = hasPermission('create_purchase_request');
  const canBulkSubmit = hasPermission('bulk_submit_requests');

  const handleBulkSubmit = async () => {
    if (selectedRequests.length === 0) return;
    
    try {
      for (const requestId of selectedRequests) {
        await updatePurchaseRequest(requestId, { 
          status: 'submitted',
          updatedAt: new Date()
        });
      }
      setSelectedRequests([]);
      // Refresh the list
    } catch (error) {
      console.error('批量提交失败:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购申请</h1>
          <p className="text-gray-600">管理所有采购请求和订单</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {canBulkSubmit && selectedRequests.length > 0 && (
            <button
              onClick={handleBulkSubmit}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Send className="h-5 w-5" />
              <span>批量提交 ({selectedRequests.length})</span>
            </button>
          )}
          {canCreateRequest && (
            <button
              onClick={() => setShowBulkImport(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span>批量导入申请</span>
            </button>
          )}
          {canCreateRequest && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>新建采购申请</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索采购申请..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-5 w-5" />
          <span>筛选</span>
        </button>
        
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="h-5 w-5" />
          <span>导出</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel onClose={() => setShowFilters(false)} />
      )}

      {/* Purchase Request List */}
      <PurchaseRequestList 
        searchTerm={searchTerm}
        selectedRequests={selectedRequests}
        onSelectionChange={setSelectedRequests}
      />

      {/* Create Purchase Request Modal */}
      {showCreateForm && (
        <CreatePurchaseRequest 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            // 清空选中的申请
            setSelectedRequests([]);
          }}
        />
      )}

      {/* Bulk Import Purchase Requests Modal */}
      {showBulkImport && (
        <BulkImportPurchaseRequests 
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            setShowBulkImport(false);
            // 清空选中的申请
            setSelectedRequests([]);
          }}
        />
      )}
    </div>
  );
};