import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Search, 
  Eye, 
  Settings,
  Calendar,
  User,
  Package,
  Truck,
  CreditCard,
  Factory,
  FileText
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseRequest, OrderAllocation as OrderAllocationType, PurchaseType, PaymentMethod, CardType } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { AllocationForm } from './AllocationForm';

type TabType = 'pending' | 'allocated';

export const OrderAllocation: React.FC = () => {
  const { 
    getPurchaseRequests, 
    getOrderAllocations, 
    getOrderAllocationByRequestId,
    createOrderAllocation,
    createCardProgressForRequest,
    createAccessoryProgressForRequest,
    createProcurementProgressForRequest
  } = useProcurement();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [showAllocationForm, setShowAllocationForm] = useState<string | null>(null);

  // 获取已批准的采购申请
  const { data: approvedRequests } = getPurchaseRequests(
    { status: ['approved'] },
    { field: 'finalApprovalDate', direction: 'desc' }
  );

  // 获取已分配的订单
  const allocatedOrders = getOrderAllocations();

  // 获取待分配的订单（已批准但未分配的）
  const pendingOrders = approvedRequests.filter(request => 
    !allocatedOrders.some(allocation => allocation.purchaseRequestId === request.id)
  );

  // 获取已分配的订单详情
  const getAllocatedOrdersWithDetails = () => {
    return allocatedOrders.map(allocation => {
      const request = approvedRequests.find(req => req.id === allocation.purchaseRequestId);
      return {
        allocation,
        request
      };
    }).filter(item => item.request); // 过滤掉找不到对应请求的分配
  };

  const allocatedOrdersWithDetails = getAllocatedOrdersWithDetails();

  // 根据当前标签页获取数据
  const getCurrentTabData = () => {
    if (activeTab === 'pending') {
      return pendingOrders.filter(request =>
        !searchTerm || 
        request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.items.some(item => 
          item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      return allocatedOrdersWithDetails.filter(({ request }) =>
        !searchTerm || 
        request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.items.some(item => 
          item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  };

  const filteredData = getCurrentTabData();

  const canAllocateOrders = hasPermission('manage_order_allocation');

  const handleAllocation = async (requestId: string, allocationData: Omit<OrderAllocationType, 'id' | 'purchaseRequestId' | 'allocatedBy' | 'allocatedAt' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const request = approvedRequests.find(req => req.id === requestId);
      if (!request) return;

      // 创建订单分配
      const allocation = await createOrderAllocation({
        purchaseRequestId: requestId,
        allocatedBy: user.id,
        allocatedAt: new Date(),
        ...allocationData
      });

      // 🎯 自动创建相关进度记录
      console.log(`🎯 订单分配完成，开始创建进度记录...`);
      
      // 1. 创建采购进度
      createProcurementProgressForRequest(request);
      console.log(`✅ 已创建采购进度记录`);
      
      // 2. 创建纸卡进度（如果需要纸卡）
      if (allocationData.cardType && allocationData.cardType !== 'none') {
        createCardProgressForRequest(request);
        console.log(`✅ 已创建纸卡进度记录`);
      }
      
      // 3. 创建辅料进度（如果是自己包装）
      if (allocationData.type === 'in_house') {
        createAccessoryProgressForRequest(request);
        console.log(`✅ 已创建辅料进度记录`);
      }

      setShowAllocationForm(null);
    } catch (error) {
      console.error('分配订单失败:', error);
      alert('分配订单失败，请重试');
    }
  };

  const getTypeText = (type: PurchaseType) => {
    return type === 'external' ? '厂家包装' : '自己包装';
  };

  const getPaymentMethodText = (method: PaymentMethod) => {
    const methodMap = {
      'payment_on_delivery': '付款发货',
      'cash_on_delivery': '货到付款',
      'credit_terms': '账期'
    };
    return methodMap[method] || method;
  };

  const getCardTypeText = (cardType?: CardType) => {
    const typeMap = {
      'finished': '纸卡成品',
      'design': '设计稿',
      'none': '不需要'
    };
    return typeMap[cardType as keyof typeof typeMap] || '不需要';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      allocated: 'blue',
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
      allocated: '已分配',
      in_production: '生产中',
      quality_check: '质检中',
      ready_to_ship: '待发货',
      shipped: '已发货',
      completed: '已完成'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // 获取统计数据
  const getStats = () => {
    const pendingCount = pendingOrders.length;
    const allocatedCount = allocatedOrdersWithDetails.length;
    const overdueCount = 0; // 可以根据需要计算逾期订单
    const totalAmount = (activeTab === 'pending' ? pendingOrders : allocatedOrdersWithDetails.map(item => item.request))
      .reduce((sum, request) => sum + (request.totalAmount || 0), 0);

    return { pendingCount, allocatedCount, overdueCount, totalAmount };
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单分配</h1>
          <p className="text-gray-600">管理已审批订单的分配和流转</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、申请人或SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">待分配订单</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">逾期订单</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.overdueCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">本周到期</h3>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">总金额</h3>
              <p className="text-2xl font-bold text-gray-900">¥{stats.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

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
            <span>待分配订单</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {stats.pendingCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('allocated')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'allocated'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircle className="h-5 w-5" />
            <span>已分配订单</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'allocated' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {stats.allocatedCount}
            </span>
          </button>
        </nav>
      </div>

      {/* Content */}
      {filteredData.length === 0 ? (
        <div className="text-center py-12">
          {activeTab === 'pending' ? (
            <>
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有待分配的订单</h3>
              <p className="text-gray-600">所有已批准的订单都已分配</p>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有已分配的订单</h3>
              <p className="text-gray-600">还没有分配任何订单</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">订单编号</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">申请人</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">SKU数量</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">总金额</th>
                  {activeTab === 'allocated' && (
                    <>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">分配类型</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">付款方式</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">纸卡类型</th>
                    </>
                  )}
                  <th className="text-left py-3 px-4 font-medium text-gray-900">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">终审时间</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeTab === 'pending' ? (
                  // 待分配订单
                  filteredData.map((request: PurchaseRequest) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{request.requestNumber}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{request.requester.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{request.items.length}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-900 font-medium">
                          ¥{request.totalAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge
                          status="待分配"
                          color="yellow"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-500 text-sm">
                          {request.finalApprovalDate 
                            ? new Date(request.finalApprovalDate).toLocaleDateString('zh-CN')
                            : '-'
                          }
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            查看详情
                          </button>
                          {canAllocateOrders && (
                            <button
                              onClick={() => setShowAllocationForm(request.id)}
                              className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                            >
                              分配订单
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  // 已分配订单
                  filteredData.map((item: any) => {
                    const { allocation, request } = item;
                    return (
                      <tr key={allocation.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{request.requestNumber}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{request.requester.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{request.items.length}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900 font-medium">
                            ¥{request.totalAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {allocation.type === 'external' ? (
                              <Factory className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Truck className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-gray-900">{getTypeText(allocation.type)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-purple-500" />
                            <span className="text-gray-900">{getPaymentMethodText(allocation.paymentMethod)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-orange-500" />
                            <span className="text-gray-900">{getCardTypeText(allocation.cardType)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <StatusBadge
                            status={getStatusText(allocation.allocationStatus)}
                            color={getStatusColor(allocation.allocationStatus)}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-500 text-sm">
                            {allocation.allocatedAt.toLocaleDateString('zh-CN')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                订单详情 - {selectedRequest.requestNumber}
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">申请人</h3>
                  <p className="text-gray-900">{selectedRequest.requester.name}</p>
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
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">终审时间</h3>
                  <p className="text-gray-900">
                    {selectedRequest.finalApprovalDate 
                      ? new Date(selectedRequest.finalApprovalDate).toLocaleDateString('zh-CN')
                      : '-'
                    }
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">采购项目</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">产品名称</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">数量</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">单价</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">总价</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedRequest.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.sku.code}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{item.sku.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{item.quantity}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">¥{(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-sm font-medium text-blue-600">¥{(item.totalPrice || 0).toFixed(2)}</td>
                        </tr>
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

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  关闭
                </button>
                {canAllocateOrders && activeTab === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedRequest(null);
                      setShowAllocationForm(selectedRequest.id);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    分配订单
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Form Modal */}
      {showAllocationForm && (
        <AllocationForm
          requestId={showAllocationForm}
          onClose={() => setShowAllocationForm(null)}
          onSuccess={(allocationData) => handleAllocation(showAllocationForm, allocationData)}
        />
      )}
    </div>
  );
};