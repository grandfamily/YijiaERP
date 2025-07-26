import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Edit, Save, ZoomIn, X, BarChart3 } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseRequest } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

export const Approvals: React.FC = () => {
  const { getPurchaseRequests, approvePurchaseRequest, rejectPurchaseRequest, updatePurchaseRequest, getInventoryBySKU } = useProcurement();
  const { user, hasPermission } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [editingQuantities, setEditingQuantities] = useState<{[key: string]: number}>({});
  const [partialApprovals, setPartialApprovals] = useState<{[key: string]: boolean}>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [expandedSalesInfo, setExpandedSalesInfo] = useState<{[key: string]: boolean}>({});
  const [salesData, setSalesData] = useState<{[key: string]: any}>({});
  const pageSize = 15;

  // 获取所有需要审批或已审批的订单（所有角色都能看到）
  const getRequestsForApproval = () => {
    return getPurchaseRequests(
      { status: ['submitted', 'first_approved', 'approved', 'rejected', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
      { field: 'createdAt', direction: 'desc' }
    );
  };

  const { data: allRequests } = getRequestsForApproval();

  // 计算分页
  const totalRequests = allRequests.length;
  const totalPages = Math.ceil(totalRequests / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPageRequests = allRequests.slice(startIndex, endIndex);

  // 检查用户是否有审批权限
  const hasApprovalPermission = user?.role === 'department_manager' || user?.role === 'general_manager';

  // 检查用户是否可以查看销量
  const canViewSales = user?.role === 'department_manager' || user?.role === 'general_manager';

  // 获取当前用户可以操作的订单
  const getOperableRequests = () => {
    if (user?.role === 'department_manager') {
      return allRequests.filter(req => req.status === 'submitted');
    } else if (user?.role === 'general_manager') {
      return allRequests.filter(req => req.status === 'first_approved');
    }
    return [];
  };

  const operableRequests = getOperableRequests();

  // 处理销量查询
  const handleSalesQuery = async (skuId: string, skuCode: string) => {
    try {
      // 根据SKU编号查询库存销量数据
      const inventoryData = getInventoryBySKU(skuId);
      
      if (inventoryData) {
        setSalesData(prev => ({
          ...prev,
          [skuId]: inventoryData
        }));
        
        setExpandedSalesInfo(prev => ({
          ...prev,
          [skuId]: !prev[skuId]
        }));
      } else {
        // 如果没有找到数据，显示提示信息
        setSalesData(prev => ({
          ...prev,
          [skuId]: null
        }));
        setExpandedSalesInfo(prev => ({
          ...prev,
          [skuId]: !prev[skuId]
        }));
      }
    } catch (error) {
      console.error('查询销量数据失败:', error);
      alert('查询销量数据失败，请重试');
    }
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setEditingQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  const handlePartialApprovalToggle = (itemId: string) => {
    setPartialApprovals(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSaveQuantityChanges = async () => {
    if (!selectedRequest || !user) return;
    
    try {
      const updatedItems = selectedRequest.items.map(item => ({
        ...item,
        quantity: editingQuantities[item.id] || item.quantity,
        totalPrice: (editingQuantities[item.id] || item.quantity) * (item.unitPrice || 0)
      }));
      
      const totalAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      await updatePurchaseRequest(selectedRequest.id, {
        items: updatedItems,
        totalAmount
      });
      
      setEditingQuantities({});
    } catch (error) {
      console.error('保存数量修改失败:', error);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!user) return;
    
    try {
      const hasPartialApprovals = Object.values(partialApprovals).some(Boolean);
      if (hasPartialApprovals && selectedRequest) {
        const updatedItems = selectedRequest.items.map(item => ({
          ...item,
          status: partialApprovals[item.id] ? 'approved' : 'rejected'
        }));
        
        await updatePurchaseRequest(requestId, { items: updatedItems });
      }
      
      await approvePurchaseRequest(requestId, user.id, approvalRemarks);
      setSelectedRequest(null);
      setApprovalRemarks('');
    } catch (error) {
      console.error('批准失败:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user) return;
    
    try {
      await rejectPurchaseRequest(requestId, user.id, approvalRemarks);
      setSelectedRequest(null);
      setApprovalRemarks('');
    } catch (error) {
      console.error('拒绝失败:', error);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 获取初审状态
  const getFirstApprovalStatus = (request: PurchaseRequest) => {
    if (request.status === 'submitted') return '未审批';
    if (request.status === 'rejected' && request.firstApprovalDate) return '未通过';
    if (request.firstApprovalDate) return '通过';
    return '未审批';
  };

  // 获取终审状态
  const getFinalApprovalStatus = (request: PurchaseRequest) => {
    if (request.status === 'approved') return '通过';
    if (request.status === 'rejected' && request.finalApprovalDate) return '未通过';
    if (request.status === 'first_approved') return '未审批';
    return '未审批';
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '通过': return 'green';
      case '未通过': return 'red';
      case '未审批': return 'yellow';
      default: return 'gray';
    }
  };

  // 检查是否可以操作该订单
  const canOperateRequest = (request: PurchaseRequest) => {
    return operableRequests.some(req => req.id === request.id);
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">工单审批</h1>
            <p className="text-gray-600">
              {hasApprovalPermission 
                ? (user?.role === 'department_manager' ? '部门主管审批待处理的采购申请' : '总经理最终审批采购申请')
                : '查看采购申请的审批状态'
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {hasApprovalPermission && (
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-gray-600">
                  {user?.role === 'department_manager' ? '待一级审批' : '待最终审批'}: {operableRequests.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 分页控件 - 移到底部 */}
        {totalRequests > 0 && (
          <div className="bg-white border-t border-gray-200 px-4 py-3 mt-4 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>显示 {startIndex + 1} - {Math.min(endIndex, totalRequests)} 条，共 {totalRequests} 条记录</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  首页
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                
                {/* 页码显示 */}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {totalPages <= 7 ? (
                    // 总页数少于等于7页时，显示所有页码
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))
                  ) : (
                    // 总页数大于7页时，显示省略号
                    <>
                      {currentPage > 3 && (
                        <>
                          <button
                            onClick={() => setCurrentPage(1)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                          >
                            1
                          </button>
                          {currentPage > 4 && <span className="text-gray-400">...</span>}
                        </>
                      )}
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        
                        if (page < 1 || page > totalPages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 border rounded text-sm ${
                              currentPage === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  末页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        {allRequests.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有审批记录</h3>
            <p className="text-gray-600">还没有提交的采购申请</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">申请编号</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">申请人</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">SKU数量</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">总金额</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">提交时间</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">初审状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">终审状态</th>
                    {hasApprovalPermission && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allRequests.map((request) => {
                    const firstApprovalStatus = getFirstApprovalStatus(request);
                    const finalApprovalStatus = getFinalApprovalStatus(request);
                    const canOperate = canOperateRequest(request);
                    
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{request.requestNumber}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900">{request.requester.name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900">{request.items.length}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900 font-medium">
                            ¥{request.totalAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-500 text-sm">
                            {new Date(request.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge
                            status={firstApprovalStatus}
                            color={getStatusColor(firstApprovalStatus)}
                            size="sm"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge
                            status={finalApprovalStatus}
                            color={getStatusColor(finalApprovalStatus)}
                            size="sm"
                          />
                        </td>
                        {hasApprovalPermission && (
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                              >
                                查看
                              </button>
                              {canOperate && (
                                <>
                                  <button
                                    onClick={() => handleApprove(request.id)}
                                    className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                  >
                                    通过
                                  </button>
                                  <button
                                    onClick={() => handleReject(request.id)}
                                    className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    驳回
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  工单详情 - {selectedRequest.requestNumber}
                </h2>
                <div className="flex items-center space-x-2">
                  {Object.keys(editingQuantities).length > 0 && hasApprovalPermission && (
                    <button
                      onClick={handleSaveQuantityChanges}
                      className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>保存修改</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">申请人</h3>
                    <p className="text-gray-900">{selectedRequest.requester.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">采购类型</h3>
                    <p className="text-gray-900">
                      {selectedRequest.type === 'external' ? '厂家包装' : '自己包装'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">申请总金额</h3>
                    <p className="text-gray-900 font-bold text-lg">
                      ¥{selectedRequest.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">提交时间</h3>
                    <p className="text-gray-900">
                      {new Date(selectedRequest.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  {selectedRequest.firstApprovalDate && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">一级审批人</h3>
                        <p className="text-gray-900">{selectedRequest.firstApprover?.name || '部门主管'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">一级审批时间</h3>
                        <p className="text-gray-900">
                          {new Date(selectedRequest.firstApprovalDate).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedRequest.finalApprovalDate && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">最终审批人</h3>
                        <p className="text-gray-900">{selectedRequest.finalApprover?.name || '总经理'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">最终审批时间</h3>
                        <p className="text-gray-900">
                          {new Date(selectedRequest.finalApprovalDate).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Approval Remarks */}
                {selectedRequest.firstApprovalRemarks && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">一级审批备注</h3>
                    <p className="text-gray-900">{selectedRequest.firstApprovalRemarks}</p>
                  </div>
                )}

                {selectedRequest.finalApprovalRemarks && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">最终审批备注</h3>
                    <p className="text-gray-900">{selectedRequest.finalApprovalRemarks}</p>
                  </div>
                )}

                {/* Items - Compact Table Layout */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">采购项目</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {hasApprovalPermission && user?.role === 'department_manager' && canOperateRequest(selectedRequest) && (
                            <th className="text-left py-3 px-3 font-medium text-gray-900 w-12">选择</th>
                          )}
                          <th className="text-left py-3 px-3 font-medium text-gray-900 w-20">图片</th>
                          <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">SKU</th>
                          <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">产品名称</th>
                          <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">英文品名</th>
                          <th className="text-left py-3 px-3 font-medium text-gray-900 w-20">识别码</th>
                          <th className="text-left py-3 px-3 font-medium text-gray-900 w-20">材料</th>
                          <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">包装方式</th>
                          <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">单价</th>
                          <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">数量</th>
                          <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">小计</th>
                          {canViewSales && (
                            <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">销量查询</th>
                          )}
                          {selectedRequest.items.some(item => item.supplier) && (
                            <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">供应商</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedRequest.items.map((item) => (
                          <React.Fragment key={item.id}>
                            <tr className="hover:bg-gray-50">
                            {hasApprovalPermission && user?.role === 'department_manager' && canOperateRequest(selectedRequest) && (
                              <td className="py-3 px-3">
                                <input
                                  type="checkbox"
                                  checked={partialApprovals[item.id] || false}
                                  onChange={() => handlePartialApprovalToggle(item.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                            )}
                            <td className="py-3 px-3">
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
                                  <span className="text-xs text-gray-400">无图</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-sm font-medium text-gray-900">{item.sku.code}</td>
                            <td className="py-3 px-3 text-sm text-gray-900">{item.sku.name}</td>
                            <td className="py-3 px-3 text-sm text-gray-600">{item.sku.englishName}</td>
                            <td className="py-3 px-3 text-sm text-gray-600">{item.sku.identificationCode}</td>
                            <td className="py-3 px-3 text-sm text-gray-600">{item.material || '-'}</td>
                            <td className="py-3 px-3 text-sm text-gray-600">{item.packagingMethod || '-'}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-sm font-medium text-gray-900">
                                ¥{(item.unitPrice || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {hasApprovalPermission && user?.role === 'department_manager' && canOperateRequest(selectedRequest) ? (
                                <input
                                  type="number"
                                  min="1"
                                  value={editingQuantities[item.id] || item.quantity}
                                  onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                  className="w-20 border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                                />
                              ) : (
                                <span className="text-sm text-gray-900 text-center block">{item.quantity}</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-sm font-bold text-blue-600">
                                ¥{((item.unitPrice || 0) * (editingQuantities[item.id] || item.quantity)).toFixed(2)}
                              </span>
                            </td>
                            {canViewSales && (
                              <td className="py-3 px-3">
                                <button
                                  onClick={() => handleSalesQuery(item.sku.id, item.sku.code)}
                                  className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                                >
                                  销量查询
                                </button>
                              </td>
                            )}
                            {selectedRequest.items.some(item => item.supplier) && (
                              <td className="py-3 px-3 text-sm text-gray-600">
                                {item.supplier?.name || '-'}
                              </td>
                            )}
                          </tr>
                          {/* 展开的销量信息行 */}
                          {canViewSales && expandedSalesInfo[item.sku.id] && (
                            <tr className="bg-blue-50">
                              <td colSpan={selectedRequest.items.some(item => item.supplier) ? (canViewSales ? 12 : 11) : (canViewSales ? 11 : 10)} className="py-4 px-3">
                                <div className="bg-white rounded-lg p-4 border border-blue-200">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                    <h4 className="font-medium text-gray-900">SKU {item.sku.code} 销量信息</h4>
                                  </div>
                                  
                                  {salesData[item.sku.id] ? (
                                    <div className="grid grid-cols-6 gap-4">
                                      <div className="text-center">
                                        <div className="text-lg font-semibold text-blue-600">
                                          {salesData[item.sku.id].inTransitQuantity.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600">在途数量</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-semibold text-green-600">
                                          {salesData[item.sku.id].inStockQuantity.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600">在库数量</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-semibold text-purple-600">
                                          {salesData[item.sku.id].totalQuantity.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600">总库存</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-semibold text-orange-600">
                                          {salesData[item.sku.id].forecastMonthlySales.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600">预测月销量</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-semibold text-red-600">
                                          {salesData[item.sku.id].estimatedSalesDays}天
                                        </div>
                                        <div className="text-sm text-gray-600">预计可售时间</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-semibold text-indigo-600">
                                          {salesData[item.sku.id].suggestedReplenishment.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-600">建议补货量</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-gray-500">
                                      暂无该SKU的销量数据
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Remarks */}
                {selectedRequest.remarks && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">申请备注</h3>
                    <p className="text-gray-900">{selectedRequest.remarks}</p>
                  </div>
                )}

                {/* Approval Remarks Input - Only for users with approval permission */}
                {hasApprovalPermission && canOperateRequest(selectedRequest) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {user?.role === 'department_manager' ? '一级审批备注' : '最终审批备注'}
                    </label>
                    <textarea
                      value={approvalRemarks}
                      onChange={(e) => setApprovalRemarks(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={user?.role === 'department_manager' ? '请输入一级审批备注...' : '请输入最终审批备注...'}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    关闭
                  </button>
                  {hasApprovalPermission && canOperateRequest(selectedRequest) && (
                    <>
                      <button
                        onClick={() => handleReject(selectedRequest.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        驳回
                      </button>
                      <button
                        onClick={() => handleApprove(selectedRequest.id)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {user?.role === 'department_manager' ? '一级批准' : '最终批准'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col h-full">
        {/* 表格区域 - 占据剩余空间 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-[600px]">
          <div className="flex-1 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">申请编号</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">申请人</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">SKU数量</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">总金额</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">提交时间</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">初审状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">终审状态</th>
                  {hasApprovalPermission && (
                    <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentPageRequests.length === 0 ? (
                  <tr>
                    <td colSpan={hasApprovalPermission ? 8 : 7} className="py-12 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">没有审批记录</h3>
                      <p className="text-gray-600">还没有提交的采购申请</p>
                    </td>
                  </tr>
                ) : (
                  currentPageRequests.map((request) => {
                    const firstApprovalStatus = getFirstApprovalStatus(request);
                    const finalApprovalStatus = getFinalApprovalStatus(request);
                    const canOperate = canOperateRequest(request);
                    
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{request.requestNumber}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-gray-900">{request.requester.name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900">{request.items.length}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900 font-medium">
                            ¥{request.totalAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-500 text-sm">
                            {new Date(request.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge
                            status={firstApprovalStatus}
                            color={getStatusColor(firstApprovalStatus)}
                            size="sm"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge
                            status={finalApprovalStatus}
                            color={getStatusColor(finalApprovalStatus)}
                            size="sm"
                          />
                        </td>
                        {hasApprovalPermission && (
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelectedRequest(request)}
                                className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                              >
                                查看
                              </button>
                              {canOperate && (
                                <>
                                  <button
                                    onClick={() => handleApprove(request.id)}
                                    className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                  >
                                    通过
                                  </button>
                                  <button
                                    onClick={() => handleReject(request.id)}
                                    className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    驳回
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>