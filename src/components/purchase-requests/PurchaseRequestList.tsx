import React, { useState } from 'react';
import { Eye, Edit, Trash2, Calendar, User, Package, DollarSign, CheckSquare, Square, Send, AlertTriangle, CheckCircle, ZoomIn, X } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseRequest } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { EditPurchaseRequest } from './EditPurchaseRequest';

interface PurchaseRequestListProps {
  searchTerm: string;
  selectedRequests?: string[];
  onSelectionChange?: (selected: string[]) => void;
}

export const PurchaseRequestList: React.FC<PurchaseRequestListProps> = ({ 
  searchTerm, 
  selectedRequests = [], 
  onSelectionChange 
}) => {
  const { getPurchaseRequests, deletePurchaseRequest, updatePurchaseRequest } = useProcurement();
  const { hasPermission, user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<PurchaseRequest | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const pageSize = 10;

  // 获取草稿和被驳回的申请
  const { data: requests, total } = getPurchaseRequests(
    { status: ['draft', 'rejected', 'submitted', 'first_approved', 'approved', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'createdAt', direction: 'desc' },
    { page: currentPage, pageSize, total: 0 }
  );


  const filteredRequests = requests.filter(request => 
    request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.items.some(item => item.sku.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  const totalPages = Math.ceil(total / pageSize);

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (selectedRequests.length === filteredRequests.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredRequests.map(r => r.id));
    }
  };

  const handleSelectRequest = (requestId: string) => {
    if (!onSelectionChange) return;
    
    if (selectedRequests.includes(requestId)) {
      onSelectionChange(selectedRequests.filter(id => id !== requestId));
    } else {
      onSelectionChange([...selectedRequests, requestId]);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (window.confirm('确定要删除这个采购申请吗？此操作不可撤销。')) {
      try {
        await deletePurchaseRequest(requestId);
        // 从选中列表中移除
        if (selectedRequests.includes(requestId)) {
          onSelectionChange?.(selectedRequests.filter(id => id !== requestId));
        }
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleResubmit = async (requestId: string) => {
    try {
      await updatePurchaseRequest(requestId, {
        status: 'submitted',
        approvalStatus: 'pending',
        // 清除之前的审批信息
        firstApproverId: undefined,
        firstApprover: undefined,
        firstApprovalDate: undefined,
        firstApprovalRemarks: undefined,
        finalApproverId: undefined,
        finalApprover: undefined,
        finalApprovalDate: undefined,
        finalApprovalRemarks: undefined,
        updatedAt: new Date()
      });
      
      // 从选中列表中移除
      if (selectedRequests.includes(requestId)) {
        onSelectionChange?.(selectedRequests.filter(id => id !== requestId));
      }
    } catch (error) {
      console.error('重新提交失败:', error);
      alert('重新提交失败，请重试');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'gray',
      rejected: 'red',
      submitted: 'blue',
      first_approved: 'yellow',
      approved: 'green',
      in_production: 'yellow',
      quality_check: 'purple',
      ready_to_ship: 'indigo',
      shipped: 'green',
      completed: 'emerald'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      draft: '草稿',
      rejected: '已驳回',
      submitted: '已提交',
      first_approved: '一级审批通过',
      approved: '已批准',
      in_production: '生产中',
      quality_check: '质检中',
      ready_to_ship: '待发货',
      shipped: '已发货',
      completed: '已完成'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getTypeText = (type: string) => {
    return type === 'external' ? '厂家包装' : '自己包装';
  };

  const getApprovalStatusText = (request: PurchaseRequest) => {
    // 如果是草稿状态
    if (request.status === 'draft') {
      return '草稿';
    }
    
    // 如果是已提交但未审批状态
    if (request.status === 'submitted' && request.approvalStatus === 'pending') {
      return '未审核';
    }
    
    // 检查是否有终审驳回
    if (request.status === 'rejected' && request.finalApprovalDate) {
      return '终审驳回';
    }
    
    // 检查是否有一级审批驳回
    if (request.status === 'rejected' && request.firstApprovalDate) {
      return '一级驳回';
    }
    
    // 检查是否有终审通过
    if (request.finalApprovalDate && request.finalApprover) {
      // 根据当前状态显示更详细的信息
      if (request.status === 'approved') return '终审通过';
      if (request.status === 'in_production') return '生产中';
      if (request.status === 'quality_check') return '质检中';
      if (request.status === 'ready_to_ship') return '待发货';
      if (request.status === 'shipped') return '已发货';
      if (request.status === 'completed') return '已完成';
      return '终审通过';
    }
    
    // 检查是否有一级审批通过
    if (request.firstApprovalDate && request.firstApprover) {
      return '一级通过';
    }
    
    // 默认返回状态文本
    return getStatusText(request.status);
  };

  const getApprovalStatusColor = (request: PurchaseRequest) => {
    // 如果是草稿状态
    if (request.status === 'draft') {
      return 'gray';
    }
    
    // 如果是已提交但未审批状态
    if (request.status === 'submitted' && request.approvalStatus === 'pending') {
      return 'blue';
    }
    
    const statusText = getApprovalStatusText(request);
    switch (statusText) {
      case '终审通过': return 'green';
      case '生产中': return 'yellow';
      case '质检中': return 'purple';
      case '待发货': return 'indigo';
      case '已发货': return 'blue';
      case '已完成': return 'emerald';
      case '一级通过': return 'yellow';
      case '终审驳回': return 'red';
      case '一级驳回': return 'red';
      default: return getStatusColor(request.status);
    }
  };

  // 获取初审状态文本
  const getFirstApprovalStatusText = (request: PurchaseRequest) => {
    if (request.status === 'draft') return '草稿';
    if (request.status === 'submitted' && !request.firstApprovalDate) return '未审核';
    if (request.status === 'rejected' && request.firstApprovalDate && !request.finalApprovalDate) return '未通过';
    if (request.firstApprovalDate) return '已审核';
    return '未审核';
  };

  // 获取初审状态颜色
  const getFirstApprovalStatusColor = (request: PurchaseRequest) => {
    const statusText = getFirstApprovalStatusText(request);
    switch (statusText) {
      case '已审核': return 'green';
      case '未通过': return 'red';
      case '未审核': return 'yellow';
      case '草稿': return 'gray';
      default: return 'gray';
    }
  };

  // 获取终审状态文本
  const getFinalApprovalStatusText = (request: PurchaseRequest) => {
    if (request.status === 'draft') return '草稿';
    if (!request.firstApprovalDate) return '待初审';
    if (request.status === 'first_approved') return '未审核';
    if (request.status === 'rejected' && request.finalApprovalDate) return '未通过';
    if (request.finalApprovalDate && ['approved', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'].includes(request.status)) {
      return '已审核';
    }
    if (request.firstApprovalDate && !request.finalApprovalDate) return '未审核';
    return '待初审';
  };

  // 获取终审状态颜色
  const getFinalApprovalStatusColor = (request: PurchaseRequest) => {
    const statusText = getFinalApprovalStatusText(request);
    switch (statusText) {
      case '已审核': return 'green';
      case '未通过': return 'red';
      case '未审核': return 'yellow';
      case '待初审': return 'gray';
      case '草稿': return 'gray';
      default: return 'gray';
    }
  };

  // 判断是否可以修改（新增的权限逻辑）
  const canModify = (request: PurchaseRequest) => {
    const firstApprovalStatus = getFirstApprovalStatusText(request);
    return firstApprovalStatus === '未审核' || firstApprovalStatus === '草稿';
  };

  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  const canEdit = (request: PurchaseRequest) => {
    return hasPermission('edit_purchase_request') && 
           (request.requesterId === user?.id || hasPermission('edit_all_requests')) &&
           ['draft', 'rejected'].includes(request.status); // 只有草稿和被驳回的可以编辑
  };

  const canDelete = (request: PurchaseRequest) => {
    return hasPermission('delete_requests') && 
           (request.requesterId === user?.id || hasPermission('delete_all_requests')) &&
           ['draft', 'rejected'].includes(request.status); // 只有草稿和被驳回的可以删除
  };

  const canResubmit = (request: PurchaseRequest) => {
    return request.status === 'rejected' && 
           (request.requesterId === user?.id || hasPermission('resubmit_requests'));
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {onSelectionChange && (
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center space-x-2"
                    >
                      {selectedRequests.length === filteredRequests.length && filteredRequests.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className="text-left py-3 px-4 font-medium text-gray-900">申请编号</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">申请人</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">SKU数量</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">初审状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">终审状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">创建时间</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  {onSelectionChange && (
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleSelectRequest(request.id)}
                        className="flex items-center"
                      >
                        {selectedRequests.includes(request.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                  )}
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-900">{request.requestNumber}</div>
                    {request.status === 'rejected' && (
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600">已被驳回</span>
                      </div>
                    )}
                    {['approved', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'].includes(request.status) && (
                      <div className="flex items-center space-x-1 mt-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">审批通过</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{request.requester.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2 relative group">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 cursor-help">{request.items.length}</span>
                      
                      {/* SKU详情悬停提示 */}
                      <div className="absolute left-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="text-sm font-medium text-gray-900 mb-3">SKU详情列表</div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {request.items.map((item, index) => (
                            <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded border">
                              {item.sku.imageUrl ? (
                                <img 
                                  src={item.sku.imageUrl} 
                                  alt={item.sku.name}
                                  className="w-10 h-10 object-cover rounded border"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900 text-sm">{item.sku.code}</span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {item.sku.category}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 truncate">{item.sku.name}</div>
                                <div className="text-sm text-gray-500">数量: {item.quantity.toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {request.items.length > 8 && (
                          <div className="text-sm text-gray-500 mt-3 text-center">
                            共 {request.items.length} 个SKU
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge
                      status={getFirstApprovalStatusText(request)}
                      color={getFirstApprovalStatusColor(request)}
                    />
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge
                      status={getFinalApprovalStatusText(request)}
                      color={getFinalApprovalStatusColor(request)}
                    />
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setViewingRequest(request)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="查看详情"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setEditingRequest(request)}
                        disabled={!canModify(request)}
                        className={`p-1 rounded transition-colors ${
                          canModify(request) 
                            ? 'text-gray-400 hover:text-blue-600 cursor-pointer' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={canModify(request) ? "修改申请" : "订单已审核，无法修改"}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {canEdit(request) && (
                        <button 
                          onClick={() => setEditingRequest(request)}
                          className="p-1 text-gray-400 hover:text-green-600 rounded"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete(request) && (
                        <button 
                          onClick={() => handleDelete(request.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {canResubmit(request) && (
                        <button 
                          onClick={() => handleResubmit(request.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="重新提交"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} 条，共 {total} 条</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-sm text-gray-700">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Purchase Request Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                采购申请详情 - {viewingRequest.requestNumber}
              </h2>
              <button
                onClick={() => setViewingRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Alert for Rejected Requests */}
              {viewingRequest.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h3 className="text-sm font-medium text-red-800">申请已被驳回</h3>
                  </div>
                  {viewingRequest.firstApprovalRemarks && (
                    <div className="text-sm text-red-700 mb-2">
                      <span className="font-medium">一级审批备注：</span>
                      {viewingRequest.firstApprovalRemarks}
                    </div>
                  )}
                  {viewingRequest.finalApprovalRemarks && (
                    <div className="text-sm text-red-700">
                      <span className="font-medium">最终审批备注：</span>
                      {viewingRequest.finalApprovalRemarks}
                    </div>
                  )}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">申请人</h3>
                  <p className="text-gray-900">{viewingRequest.requester.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">采购类型</h3>
                  <p className="text-gray-900">
                    {viewingRequest.type === 'external' ? '外部采购' : '工厂自产'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">当前状态</h3>
                  <StatusBadge
                    status={getApprovalStatusText(viewingRequest)}
                    color={getApprovalStatusColor(viewingRequest)}
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">采购项目</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">图片</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">SKU编码</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">产品名称</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">英文名称</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">产品类别</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">识别码</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">材料</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">包装方式</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">单价(元)</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">数量</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">总价(元)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewingRequest.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          {/* SKU图片 */}
                          <td className="py-3 px-3 text-center">
                            {item.sku.imageUrl ? (
                              <div className="relative group">
                                <img 
                                  src={item.sku.imageUrl} 
                                  alt={item.sku.name}
                                  className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => handleImageClick(item.sku.imageUrl!)}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                                     onClick={() => handleImageClick(item.sku.imageUrl!)}>
                                  <ZoomIn className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </td>
                          
                          {/* SKU编码 */}
                          <td className="py-3 px-3">
                            <span className="font-medium text-gray-900">{item.sku.code}</span>
                          </td>
                          
                          {/* 产品名称 */}
                          <td className="py-3 px-3">
                            <span className="text-gray-900">{item.sku.name}</span>
                          </td>
                          
                          {/* 英文名称 */}
                          <td className="py-3 px-3">
                            <span className="text-gray-600">{item.sku.englishName}</span>
                          </td>
                          
                          {/* 产品类别 */}
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.sku.category}
                            </span>
                          </td>
                          
                          {/* 识别码 */}
                          <td className="py-3 px-3">
                            <span className="text-gray-600">{item.sku.identificationCode}</span>
                          </td>
                          
                          {/* 材料 */}
                          <td className="py-3 px-3">
                            <span className="text-gray-900">{item.material && item.material.trim() !== '' ? item.material : '-'}</span>
                          </td>
                          
                          {/* 包装方式 */}
                          <td className="py-3 px-3">
                            <span className="text-gray-900">{item.packagingMethod && item.packagingMethod.trim() !== '' ? item.packagingMethod : '-'}</span>
                          </td>
                          
                          {/* 单价 */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-medium text-gray-900">
                              ¥{(item.unitPrice || 0).toFixed(2)}
                            </span>
                          </td>
                          
                          {/* 数量 */}
                          <td className="py-3 px-3 text-center">
                            <span className="text-gray-900">{item.quantity.toLocaleString()}</span>
                          </td>
                          
                          {/* 总价 */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-blue-600">
                              ¥{(item.totalPrice || 0).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks */}
              {viewingRequest.remarks && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">申请备注</h3>
                  <p className="text-gray-900">{viewingRequest.remarks}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setViewingRequest(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  关闭
                </button>
                {canEdit(viewingRequest) && (
                  <button
                    onClick={() => {
                      setViewingRequest(null);
                      setEditingRequest(viewingRequest);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    编辑申请
                  </button>
                )}
                {canResubmit(viewingRequest) && (
                  <button
                    onClick={() => {
                      setViewingRequest(null);
                      handleResubmit(viewingRequest.id);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    重新提交
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={zoomedImage}
              alt="放大图片"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={() => setZoomedImage(null)}
            />
          </div>
        </div>
      )}

      {/* Edit Purchase Request Modal */}
      {editingRequest && (
        <EditPurchaseRequest 
          request={editingRequest}
          onClose={() => setEditingRequest(null)}
          onSuccess={() => {
            setEditingRequest(null);
          }}
        />
      )}
    </>
  );
};