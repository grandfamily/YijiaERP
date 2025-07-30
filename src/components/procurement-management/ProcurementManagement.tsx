import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  DollarSign,
  CreditCard,
  Truck,
  Eye,
  Bell,
  ZoomIn,
  X,
  CheckSquare,
  Square,
  Send,
  Calendar
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

type TabType = 'in_progress' | 'external_completed' | 'in_house_completed' | 'rejected';

export const ProcurementManagement: React.FC = () => {
  const { user } = useAuth();
  const { 
    getPurchaseRequests, 
    getOrderAllocations,
    getProcurementProgress,
    updateProcurementProgressStage,
    addPaymentReminder,
    confirmCardDelivery,
    requestCardDelivery,
    getPaymentReminderTime,
    getCardDeliveryReminderTime
  } = useProcurement();

  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 权限检查
  const isProcurementStaff = user?.role === 'purchasing_officer';
  const canEdit = isProcurementStaff;

  // 获取已分配的订单（从订单分配流转而来）
  const { data: allocatedRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'updatedAt', direction: 'desc' }
  );

  const orderAllocations = getOrderAllocations();
  const procurementProgressData = getProcurementProgress();

  // 获取订单的分配信息
  const getOrderAllocation = (requestId: string) => {
    return orderAllocations.find(a => a.purchaseRequestId === requestId);
  };

  // 获取订单的采购进度
  const getProcurementProgressByRequest = (requestId: string) => {
    return procurementProgressData.find(p => p.purchaseRequestId === requestId);
  };

  // 处理节点完成
  const handleStageComplete = async (requestId: string, stageName: string) => {
    try {
      const progress = getProcurementProgressByRequest(requestId);
      if (!progress) return;

      await updateProcurementProgressStage(progress.id, stageName, {
        status: 'completed',
        completedDate: new Date()
      });
    } catch (error) {
      console.error('完成节点失败:', error);
    }
  };

  // 处理批量完成节点
  const handleBatchCompleteStage = async (stageName: string) => {
    if (selectedOrders.length === 0) return;

    try {
      const updates = [];
      for (const requestId of selectedOrders) {
        const progress = getProcurementProgressByRequest(requestId);
        if (progress) {
          updates.push(updateProcurementProgressStage(progress.id, stageName, {
            status: 'completed',
            completedDate: new Date()
          }));
        }
      }
      await Promise.all(updates);
      setSelectedOrders([]);
    } catch (error) {
      console.error('批量完成失败:', error);
    }
  };

  // 处理催付操作
  const handlePaymentReminder = async (type: 'deposit' | 'final') => {
    if (selectedOrders.length === 0) return;

    try {
      for (const requestId of selectedOrders) {
        await addPaymentReminder(requestId, type);
      }
      setSelectedOrders([]);
      alert(`已发送${type === 'deposit' ? '定金' : '尾款'}催付通知`);
    } catch (error) {
      console.error('催付失败:', error);
    }
  };

  // 处理催要纸卡
  const handleCardDeliveryRequest = async () => {
    if (selectedOrders.length === 0) return;

    try {
      for (const requestId of selectedOrders) {
        await requestCardDelivery(requestId);
      }
      setSelectedOrders([]);
      alert('已发送纸卡催要通知');
    } catch (error) {
      console.error('催要纸卡失败:', error);
    }
  };

  // 根据标签页过滤数据
  const getFilteredData = () => {
    let filtered = allocatedRequests;

    // 根据标签页过滤
    switch (activeTab) {
      case 'in_progress':
        // 进行中订单：已分配但未完成的订单
        filtered = allocatedRequests.filter(request => 
          ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped'].includes(request.status)
        );
        break;
      case 'external_completed':
        // 厂家包装已完成：厂家包装且已完成的订单
        filtered = allocatedRequests.filter(request => {
          const allocation = getOrderAllocation(request.id);
          return allocation?.type === 'external' && request.status === 'completed';
        });
        break;
      case 'in_house_completed':
        // 自己包装已完成：自己包装且已完成的订单
        filtered = allocatedRequests.filter(request => {
          const allocation = getOrderAllocation(request.id);
          return allocation?.type === 'in_house' && request.status === 'completed';
        });
        break;
      case 'rejected':
        // 不合格订单：质检不合格的订单
        filtered = allocatedRequests.filter(request => 
          request.status === 'quality_check' // 这里可以根据实际业务逻辑调整
        );
        break;
    }

    // 根据搜索条件过滤
    return filtered.filter(request =>
      request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.items.some(item => 
        item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const filteredData = getFilteredData();

  // 处理订单选择
  const handleOrderSelection = (requestId: string) => {
    setSelectedOrders(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    setSelectedOrders(prev => 
      prev.length === filteredData.length ? [] : filteredData.map(r => r.id)
    );
  };

  // 获取节点状态
  const getStageStatus = (requestId: string, stageName: string) => {
    const progress = getProcurementProgressByRequest(requestId);
    if (!progress) return 'not_started';
    
    const stage = progress.stages.find(s => s.name === stageName);
    return stage?.status || 'not_started';
  };

  // 获取统计数据
  const getTabStats = () => {
    const inProgress = allocatedRequests.filter(request => 
      ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped'].includes(request.status)
    ).length;
    
    const externalCompleted = allocatedRequests.filter(request => {
      const allocation = getOrderAllocation(request.id);
      return allocation?.type === 'external' && request.status === 'completed';
    }).length;
    
    const inHouseCompleted = allocatedRequests.filter(request => {
      const allocation = getOrderAllocation(request.id);
      return allocation?.type === 'in_house' && request.status === 'completed';
    }).length;
    
    const rejected = allocatedRequests.filter(request => 
      request.status === 'quality_check'
    ).length;
    
    return { inProgress, externalCompleted, inHouseCompleted, rejected };
  };

  const tabStats = getTabStats();

  // 处理图片点击
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 渲染进行中订单
  const renderInProgressOrders = () => (
    <div className="space-y-6">
      {/* 批量操作栏 */}
      {canEdit && (
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
            
            {selectedOrders.length > 0 && (
              <div className="flex items-center space-x-3">
                {/* 采购专员操作按钮 */}
                <button
                  onClick={() => handleBatchCompleteStage('安排生产')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  批量完成安排生产
                </button>
                <button
                  onClick={() => handleBatchCompleteStage('包装生产')}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  批量完成包装生产
                </button>
                <button
                  onClick={() => handleBatchCompleteStage('安排发货')}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                >
                  批量完成安排发货
                </button>
                <button
                  onClick={() => handleBatchCompleteStage('到货确认')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  批量完成到货确认
                </button>
                
                {/* 催付按钮 */}
                <button
                  onClick={() => handlePaymentReminder('deposit')}
                  className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  催付定金
                </button>
                <button
                  onClick={() => handlePaymentReminder('final')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  催付尾款
                </button>
                <button
                  onClick={handleCardDeliveryRequest}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  催要纸卡
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 订单列表 */}
      <div className="space-y-6">
        {filteredData.map((request) => {
          const allocation = getOrderAllocation(request.id);
          const isSelected = selectedOrders.includes(request.id);
          const depositReminderTime = getPaymentReminderTime(request.id, 'deposit');
          const finalReminderTime = getPaymentReminderTime(request.id, 'final');
          const cardReminderTime = getCardDeliveryReminderTime(request.id);
          
          return (
            <div key={request.id} className={`bg-white rounded-lg shadow-sm border-2 transition-colors ${
              isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            } p-6 relative`}>
              {/* 催付时间显示 */}
              <div className="absolute top-4 right-4 space-y-1">
                {depositReminderTime && (
                  <div className="flex items-center space-x-1 bg-orange-50 border border-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
                    <Bell className="h-3 w-3" />
                    <span>定金催付: {depositReminderTime.toLocaleDateString('zh-CN')}</span>
                  </div>
                )}
                {finalReminderTime && (
                  <div className="flex items-center space-x-1 bg-red-50 border border-red-200 text-red-800 px-2 py-1 rounded text-xs">
                    <Bell className="h-3 w-3" />
                    <span>尾款催付: {finalReminderTime.toLocaleDateString('zh-CN')}</span>
                  </div>
                )}
                {cardReminderTime && (
                  <div className="flex items-center space-x-1 bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                    <Bell className="h-3 w-3" />
                    <span>纸卡催要: {cardReminderTime.toLocaleDateString('zh-CN')}</span>
                  </div>
                )}
              </div>

              {/* 订单头部 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {canEdit && (
                    <button
                      onClick={() => handleOrderSelection(request.id)}
                      className="flex items-center"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {request.requestNumber}
                  </h3>
                  <StatusBadge
                    status={allocation?.type === 'external' ? '厂家包装' : '自己包装'}
                    color={allocation?.type === 'external' ? 'blue' : 'green'}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  {request.items.length} 个SKU
                </div>
              </div>

              {/* SKU进度表格 */}
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-3 font-medium text-gray-900 w-16">图片</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">SKU</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">产品名称</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">采购数量</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">采购进度</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">定金支付</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">安排生产</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">纸卡提供</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">包装生产</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">尾款支付</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">安排发货</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">到货确认</th>
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">验收确认</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {request.items.map((item) => {
                      const stages = [
                        '定金支付', '安排生产', '纸卡提供', '包装生产', 
                        '尾款支付', '安排发货', '到货确认', '验收确认'
                      ];
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          {/* 产品图片 */}
                          <td className="py-3 px-3">
                            {item.sku.imageUrl ? (
                              <div className="relative group">
                                <img 
                                  src={item.sku.imageUrl} 
                                  alt={item.sku.name}
                                  className="w-10 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
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
                              <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </td>
                          
                          {/* SKU信息 */}
                          <td className="py-3 px-3">
                            <div className="font-medium text-gray-900">{item.sku.code}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-gray-900">{item.sku.name}</div>
                            <div className="text-xs text-gray-500">{item.sku.category}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-sm font-medium text-gray-900">
                              {item.quantity.toLocaleString()}
                            </span>
                          </td>
                          
                          {/* 采购进度 */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center space-y-1">
                              <span className="text-sm font-bold text-blue-600">75%</span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '75%' }} />
                              </div>
                            </div>
                          </td>
                          
                          {/* 流程节点 */}
                          {stages.map((stageName) => {
                            const stageStatus = getStageStatus(request.id, stageName);
                            const isCompleted = stageStatus === 'completed';
                            const isSystemStage = ['定金支付', '纸卡提供', '尾款支付', '验收确认'].includes(stageName);
                            
                            return (
                              <td key={stageName} className="py-3 px-3 text-center">
                                <div className="flex flex-col items-center space-y-2">
                                  <StatusBadge
                                    status={isCompleted ? '已完成' : '未完成'}
                                    color={isCompleted ? 'green' : 'gray'}
                                    size="sm"
                                  />
                                  {canEdit && !isSystemStage && !isCompleted && (
                                    <button
                                      onClick={() => handleStageComplete(request.id, stageName)}
                                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                      完成
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 订单摘要 */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">申请人:</span>
                    <span className="ml-2 font-medium text-gray-900">{request.requester.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">总金额:</span>
                    <span className="ml-2 font-medium text-gray-900">¥{request.totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">付款方式:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {allocation?.paymentMethod === 'payment_on_delivery' ? '付款发货' : 
                       allocation?.paymentMethod === 'cash_on_delivery' ? '货到付款' : 
                       allocation?.paymentMethod === 'credit_terms' ? '账期' : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">交货日期:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {allocation?.deliveryDate ? new Date(allocation.deliveryDate).toLocaleDateString('zh-CN') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 渲染已完成订单（厂家包装/自己包装）
  const renderCompletedOrders = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-3 font-medium text-gray-900">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">SKU</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">品名</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">供应商</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">采购数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">到货数量</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">纸卡类型</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">付款方式</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">总金额</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">定金金额</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((request) => {
              const allocation = getOrderAllocation(request.id);
              
              return request.items.map((item) => (
                <tr key={`${request.id}-${item.id}`} className="hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <div className="text-sm font-medium text-blue-600">{request.requestNumber}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.sku.imageUrl ? (
                      <div className="relative group inline-block">
                        <img 
                          src={item.sku.imageUrl} 
                          alt={item.sku.name}
                          className="w-10 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
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
                      <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-sm font-medium text-gray-900">{item.sku.code}</div>
                    <div className="text-xs text-gray-500">{item.sku.category}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-sm text-gray-900">{item.sku.name}</div>
                    <div className="text-xs text-gray-500">{item.sku.englishName}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-sm text-gray-900">{item.supplier?.name || '-'}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {item.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-sm font-medium text-blue-600">
                      {item.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge
                      status={allocation?.cardType === 'finished' ? '纸卡成品' : 
                               allocation?.cardType === 'design' ? '设计稿' : '不需要'}
                      color="purple"
                      size="sm"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-gray-900">
                      {allocation?.paymentMethod === 'payment_on_delivery' ? '付款发货' : 
                       allocation?.paymentMethod === 'cash_on_delivery' ? '货到付款' : 
                       allocation?.paymentMethod === 'credit_terms' ? '账期' : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-sm font-bold text-blue-600">
                      ¥{request.totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-sm font-medium text-green-600">
                      ¥{(allocation?.prepaymentAmount || 0).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
            <p className="text-gray-600">管理采购订单的全流程进度和状态跟踪</p>
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
              <Package className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">
                订单: {filteredData.length}
              </span>
            </div>
          </div>
        </div>

        {/* 权限提示 */}
        {!canEdit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">权限提示</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  您当前是{user?.role === 'department_manager' ? '部门主管' : 
                           user?.role === 'general_manager' ? '总经理' : '其他角色'}，只能查看采购进度。只有采购专员可以编辑和操作。
                </p>
              </div>
            </div>
          </div>
        )}

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
              onClick={() => setActiveTab('external_completed')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'external_completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>厂家包装已完成</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'external_completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.externalCompleted}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('in_house_completed')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'in_house_completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>自己包装已完成</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'in_house_completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.inHouseCompleted}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'rejected'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
              <span>不合格订单</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'rejected' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.rejected}
              </span>
            </button>
          </nav>
        </div>

        {/* 内容区域 */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'in_progress' ? '没有进行中的订单' : 
               activeTab === 'external_completed' ? '没有厂家包装已完成的订单' :
               activeTab === 'in_house_completed' ? '没有自己包装已完成的订单' :
               '没有不合格的订单'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'in_progress' ? '所有订单都已完成' : '暂无相关订单'}
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'in_progress' && renderInProgressOrders()}
            {(activeTab === 'external_completed' || activeTab === 'in_house_completed' || activeTab === 'rejected') && renderCompletedOrders()}
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