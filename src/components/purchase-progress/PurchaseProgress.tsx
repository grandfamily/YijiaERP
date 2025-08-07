import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Package,
  Bell,
  DollarSign,
  CreditCard,
  Truck,
  CheckSquare,
  Square,
  Send,
  Eye,
  ZoomIn,
  X,
  Filter,
  Download
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

type TabType = 'in_progress' | 'rejected_orders';

export const PurchaseProgress: React.FC = () => {
  const { user } = useAuth();
  const { 
    getPurchaseRequests,
    getOrderAllocations,
    getProcurementProgress,
    updateProcurementProgressStage,
    addPaymentReminder,
    requestCardDelivery,
    getCardDeliveryReminderTime,
    handleArrivalNotificationBatchComplete
  } = useProcurement();

  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [rejectedOrders, setRejectedOrders] = useState<any[]>([]);

  // 监听不合格订单事件
  useEffect(() => {
    const handleAddRejectedOrder = (event: CustomEvent) => {
      const rejectedOrder = event.detail;
      console.log('采购进度：接收到不合格订单', rejectedOrder);
      
      setRejectedOrders(prev => {
        const exists = prev.some(order => 
          order.purchaseRequestId === rejectedOrder.purchaseRequestId && 
          order.skuId === rejectedOrder.skuId
        );
        
        if (!exists) {
          return [...prev, rejectedOrder];
        }
        return prev;
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('addRejectedOrder', handleAddRejectedOrder as EventListener);
      return () => {
        window.removeEventListener('addRejectedOrder', handleAddRejectedOrder as EventListener);
      };
    }
  }, []);

  // 获取已分配的订单
  const { data: allocatedRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'updatedAt', direction: 'desc' }
  );

  const orderAllocations = getOrderAllocations();

  // 获取当前标签页数据
  const getCurrentTabData = () => {
    if (activeTab === 'rejected_orders') {
      return rejectedOrders;
    }
    return allocatedRequests;
  };

  // 过滤数据
  const filteredData = getCurrentTabData().filter((item: any) => {
    if (!searchTerm) return true;
    
    if (activeTab === 'rejected_orders') {
      return item.purchaseRequestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.sku?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.sku?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return item.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.items?.some((i: any) => 
               i.sku?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               i.sku?.name?.toLowerCase().includes(searchTerm.toLowerCase())
             );
    }
  });

  // 获取订单分配信息
  const getOrderAllocation = (requestId: string) => {
    return orderAllocations.find(a => a.purchaseRequestId === requestId);
  };

  // 获取采购进度信息
  const getProcurementProgressInfo = (requestId: string) => {
    return getProcurementProgress().find(p => p.purchaseRequestId === requestId);
  };

  // 处理图片点击
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 处理选择
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    setSelectedOrders(prev => 
      prev.length === filteredData.length ? [] : filteredData.map((item: any) => item.id)
    );
  };

  // 批量完成到货通知
  const handleBatchArrivalNotification = async () => {
    if (selectedOrders.length === 0) return;
    
    try {
      // 分别处理厂家包装和自己包装订单
      const externalOrders: string[] = [];
      const inHouseOrders: string[] = [];
      
      selectedOrders.forEach(orderId => {
        const allocation = getOrderAllocation(orderId);
        if (allocation?.type === 'external') {
          externalOrders.push(orderId);
        } else if (allocation?.type === 'in_house') {
          inHouseOrders.push(orderId);
        }
      });
      
      // 批量完成厂家包装订单的到货通知
      if (externalOrders.length > 0) {
        await handleArrivalNotificationBatchComplete(externalOrders, 'finished');
      }
      
      // 批量完成自己包装订单的到货通知
      if (inHouseOrders.length > 0) {
        await handleArrivalNotificationBatchComplete(inHouseOrders, 'semi_finished');
      }
      
      setSelectedOrders([]);
      alert('批量到货通知完成！相关SKU的到货状态已更新');
    } catch (error) {
      console.error('批量到货通知失败:', error);
      alert('批量到货通知失败，请重试');
    }
  };

  // 获取统计数据
  const getTabStats = () => {
    const inProgress = allocatedRequests.length;
    const rejected = rejectedOrders.length;
    return { inProgress, rejected };
  };

  const tabStats = getTabStats();

  // 渲染不合格订单栏目
  const renderRejectedOrders = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-900">订单编号</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">图片</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">品名</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">产品类型</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">不合格原因</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">处理人员</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">处理时间</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((order: any) => (
              <tr key={`${order.purchaseRequestId}-${order.skuId}`} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-blue-600">{order.purchaseRequestNumber}</div>
                </td>
                <td className="py-4 px-4 text-center">
                  {order.sku?.imageUrl ? (
                    <div className="relative group inline-block">
                      <img 
                        src={order.sku.imageUrl} 
                        alt={order.sku.name}
                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(order.sku.imageUrl!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                           onClick={() => handleImageClick(order.sku.imageUrl!)}>
                        <ZoomIn className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">{order.sku?.code}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-900">{order.sku?.name}</div>
                </td>
                <td className="py-4 px-4">
                  <StatusBadge
                    status={order.productType === 'semi_finished' ? '半成品' : '成品'}
                    color={order.productType === 'semi_finished' ? 'blue' : 'green'}
                    size="sm"
                  />
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-red-600">{order.rejectionReason}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-900">{order.rejectedBy}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-500">
                    {order.rejectionDate ? new Date(order.rejectionDate).toLocaleDateString('zh-CN') : '-'}
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <button className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染进行中订单
  const renderInProgressOrders = () => (
    <div className="space-y-6">
      {filteredData.map((request: any) => {
        const allocation = getOrderAllocation(request.id);
        const progress = getProcurementProgressInfo(request.id);
        const isSelected = selectedOrders.includes(request.id);
        
        return (
          <div key={request.id} className={`bg-white rounded-lg shadow-sm border-2 transition-colors ${
            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          } p-6`}>
            {/* Order Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleSelectOrder(request.id)}
                  className="flex items-center"
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {request.requestNumber}
                </h3>
                <StatusBadge
                  status={allocation?.type === 'external' ? '厂家包装' : '自己包装'}
                  color={allocation?.type === 'external' ? 'blue' : 'green'}
                />
              </div>
              <div className="text-sm text-gray-600">
                {request.items?.length || 0} 个SKU
              </div>
            </div>

            {/* Progress Overview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">整体进度</span>
                <span className="text-sm text-gray-600">{progress?.overallProgress || 0}%</span>
              </div>
              <ProgressBar progress={progress?.overallProgress || 0} color="blue" />
            </div>

            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">申请人:</span>
                <span className="ml-2 font-medium text-gray-900">{request.requester?.name}</span>
              </div>
              <div>
                <span className="text-gray-600">总金额:</span>
                <span className="ml-2 font-medium text-gray-900">¥{request.totalAmount?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">创建时间:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {request.createdAt ? new Date(request.createdAt).toLocaleDateString('zh-CN') : '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">截止时间:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {allocation?.deliveryDate ? new Date(allocation.deliveryDate).toLocaleDateString('zh-CN') : '-'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">采购进度</h1>
            <p className="text-gray-600">管理采购订单的全流程进度跟踪</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号或SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">
                订单: {filteredData.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'in_progress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>进行中订单</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.inProgress}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('rejected_orders')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'rejected_orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
              <span>不合格订单</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'rejected_orders' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.rejected}
              </span>
            </button>
          </nav>
        </div>

        {/* Action Bar */}
        {activeTab === 'in_progress' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {selectedOrders.length === filteredData.length && filteredData.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-medium">全选订单</span>
                </button>
                {selectedOrders.length > 0 && (
                  <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    已选择 {selectedOrders.length} 个订单
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {selectedOrders.length > 0 && (
                  <button
                    onClick={handleBatchArrivalNotification}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Bell className="w-4 h-4" />
                    <span>批量到货通知 ({selectedOrders.length})</span>
                  </button>
                )}
                <div className="text-sm text-gray-500">
                  管理采购订单的全流程进度跟踪
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'in_progress' ? '没有进行中的订单' : '没有不合格的订单'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'in_progress' ? '所有订单都已完成' : '所有订单都通过了验收'}
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'in_progress' && renderInProgressOrders()}
            {activeTab === 'rejected_orders' && renderRejectedOrders()}
          </>
        )}
      </div>

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
    </>
  );
};