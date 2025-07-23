import React, { useState } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Search, 
  Bell, 
  CheckCircle, 
  AlertTriangle,
  Package,
  User,
  Clock,
  TrendingUp,
  Download,
  Filter,
  Eye,
  CreditCard,
  Truck
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../ui/StatusBadge';

type TabType = 'deposit' | 'payment' | 'credit_terms' | 'reports';

export const FinanceManagement: React.FC = () => {
  const { 
    getPurchaseRequests, 
    getOrderAllocations,
    getPaymentReminders,
    getPaymentReminderDetails,
    getPaymentReminderTime,
    confirmPayment,
    getPaymentStatus,
    isPaymentConfirmed
  } = useProcurement();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('deposit');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // 获取已分配的订单
  const { data: allocatedRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'updatedAt', direction: 'desc' }
  );

  const orderAllocations = getOrderAllocations();

  // 获取催付记录数据
  const paymentReminders = getPaymentReminders();
  const paymentReminderDetails = getPaymentReminderDetails();
  const paymentStatus = getPaymentStatus();

  // 获取订单的分配信息
  const getOrderAllocation = (requestId: string) => {
    return orderAllocations.find(a => a.purchaseRequestId === requestId);
  };

  // 检查是否需要定金支付
  const needsDepositPayment = (requestId: string) => {
    const allocation = getOrderAllocation(requestId);
    return allocation && (allocation.prepaymentAmount || 0) > 0;
  };

  // 获取定金支付订单
  const getDepositPaymentOrders = () => {
    return allocatedRequests.filter(request => needsDepositPayment(request.id));
  };

  // 获取付款发货订单
  const getPaymentDeliveryOrders = () => {
    return allocatedRequests.filter(request => {
      const allocation = getOrderAllocation(request.id);
      return allocation && (
        allocation.paymentMethod === 'payment_on_delivery' || 
        allocation.paymentMethod === 'cash_on_delivery'
      );
    });
  };

  // 获取账期付款订单
  const getCreditTermsOrders = () => {
    return allocatedRequests.filter(request => {
      const allocation = getOrderAllocation(request.id);
      return allocation && allocation.paymentMethod === 'credit_terms';
    });
  };

  // 处理确认付款
  const handleConfirmPayment = async (requestId: string, paymentType: 'deposit' | 'final') => {
    try {
      console.log(`🎯 财务管理: 开始确认付款 - 订单: ${requestId}, 类型: ${paymentType}`);
      
      // 确认付款并联动更新采购进度（仅非账期付款）
      if (paymentType !== 'credit_terms') {
        confirmPayment(requestId, paymentType);
      }

      const paymentTypeName = paymentType === 'deposit' ? '定金' : '尾款';
      setNotificationMessage(`${paymentTypeName}付款确认成功！采购进度中的"${paymentType === 'deposit' ? '定金支付' : '尾款支付'}"节点已完成`);
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (error) {
      console.error('确认付款失败:', error);
      setNotificationMessage('确认付款失败，请重试');
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  // 处理账期付款确认
  const handleConfirmCreditPayment = async (requestId: string) => {
    try {
      console.log(`🎯 财务管理: 开始确认账期付款 - 订单: ${requestId}`);
      
      // 确认账期付款，不联动采购进度
      confirmPayment(requestId, 'credit_terms');

      setNotificationMessage('账期付款确认成功！');
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (error) {
      console.error('确认账期付款失败:', error);
      setNotificationMessage('确认账期付款失败，请重试');
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  // 根据当前标签页获取数据
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'deposit':
        return getDepositPaymentOrders();
      case 'payment':
        return getPaymentDeliveryOrders();
      case 'credit_terms':
        return getCreditTermsOrders();
      default:
        return [];
    }
  };

  const filteredData = getCurrentTabData().filter(request =>
    !searchTerm || 
    request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.items.some(item => 
      item.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    request.items.some(item => 
      item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // 检查用户权限
  const canManageFinance = hasPermission('view_finance_records') || hasPermission('edit_finance_records');

  // 获取统计数据
  const getStats = () => {
    const depositOrders = getDepositPaymentOrders().length;
    const paymentOrders = getPaymentDeliveryOrders().length;
    const creditTermsOrders = getCreditTermsOrders().length;
    const totalAmount = allocatedRequests.reduce((sum, req) => sum + req.totalAmount, 0);

    return { depositOrders, paymentOrders, creditTermsOrders, totalAmount };
  };

  const stats = getStats();

  const renderTabContent = () => {
    if (activeTab === 'reports') {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">财务报表功能开发中...</h3>
          <p className="text-gray-600">
            完整的财务报表功能正在开发中，将包括付款统计、供应商对账、资金流水等功能。
          </p>
        </div>
      );
    }

    return (
      <>
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'deposit' ? '没有需要定金支付的订单' : 
               activeTab === 'payment' ? '没有需要付款发货的订单' : 
               '没有账期付款订单'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'deposit' ? '所有定金都已支付' : 
               activeTab === 'payment' ? '所有付款都已完成' : 
               '没有使用账期付款方式的订单'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredData.map((request) => {
              const allocation = getOrderAllocation(request.id);
              const hasReminder = paymentReminders[request.id];
              
              return (
                <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* 紧凑的订单头部 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.requestNumber}
                      </h3>
                      <StatusBadge
                        status={allocation?.type === 'external' ? '厂家包装' : '自己包装'}
                        color={allocation?.type === 'external' ? 'blue' : 'green'}
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      截止: {allocation?.deliveryDate ? new Date(allocation.deliveryDate).toLocaleDateString('zh-CN') : '-'}
                    </div>
                  </div>

                  {/* 紧凑的基本信息行 */}
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">申请人:</span>
                      <span className="ml-1 font-medium text-gray-900">{request.requester.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">总金额:</span>
                      <span className="ml-1 font-medium text-gray-900">¥{request.totalAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">生产日期:</span>
                      <span className="ml-1 font-medium text-gray-900">
                        {allocation?.productionDate ? new Date(allocation.productionDate).toLocaleDateString('zh-CN') : '-'}
                      </span>
                    </div>
                  </div>

                  {/* 紧凑的采购项目表格 */}
                  <div className="mb-3">
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">图片</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">SKU</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">供应商</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">产品名称</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">数量</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">单价</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-900">总价</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {request.items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="py-2 px-3">
                                {item.sku.imageUrl ? (
                                  <img 
                                    src={item.sku.imageUrl} 
                                    alt={item.sku.name}
                                    className="w-8 h-8 object-cover rounded border"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center">
                                    <Package className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 font-medium text-gray-900">{item.sku.code}</td>
                              <td className="py-2 px-3 text-gray-900">{item.supplier?.name || '-'}</td>
                              <td className="py-2 px-3 text-gray-900">{item.sku.name}</td>
                              <td className="py-2 px-3 text-gray-900">{item.quantity.toLocaleString()}</td>
                              <td className="py-2 px-3 text-gray-900">¥{(item.unitPrice || 0).toFixed(2)}</td>
                              <td className="py-2 px-3 font-medium text-gray-900">¥{(item.totalPrice || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 紧凑的付款操作区域 */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    {/* 左侧：催付时间和付款信息 */}
                    <div className="flex items-center space-x-4 text-sm">
                      {/* 付款方式信息 */}
                      <div>
                        <span className="text-gray-600">付款方式:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {allocation?.paymentMethod === 'payment_on_delivery' ? '付款发货' : 
                           allocation?.paymentMethod === 'cash_on_delivery' ? '货到付款' : 
                           allocation?.paymentMethod === 'credit_terms' ? '账期' : '-'}
                        </span>
                      </div>
                      
                      {/* 账期日期 */}
                      {allocation?.creditDate && (
                        <div>
                          <span className="text-gray-600">账期:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {new Date(allocation.creditDate).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* 右侧：金额和操作按钮 */}
                    <div className="flex items-center space-x-4">
                      {/* 催付时间显示 - 移动到右侧 */}
                      {activeTab === 'deposit' && getPaymentReminderTime(request.id, 'deposit') && (
                        <div className="flex items-center space-x-1 bg-orange-50 border border-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
                          <Bell className="h-3 w-3" />
                          <span>催付: {getPaymentReminderTime(request.id, 'deposit')!.toLocaleDateString('zh-CN')}</span>
                        </div>
                      )}
                      {activeTab === 'payment' && getPaymentReminderTime(request.id, 'final') && !isPaymentConfirmed(request.id, 'final') && (
                        <div className="flex items-center space-x-1 bg-orange-50 border border-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
                          <Bell className="h-3 w-3" />
                          <span>催付: {getPaymentReminderTime(request.id, 'final')!.toLocaleDateString('zh-CN')}</span>
                        </div>
                      )}
                      
                      {/* 金额显示 */}
                      <div className="text-right">
                        {activeTab === 'deposit' && allocation?.prepaymentAmount && (
                          <div>
                            {(() => {
                              const depositPaymentTime = getPaymentReminderTime(request.id, 'deposit');
                              const isPaid = isPaymentConfirmed(request.id, 'deposit');
                              
                              return (
                                <div className="flex items-center space-x-4">
                                  {isPaid && depositPaymentTime && (
                                    <div className="text-sm text-gray-600">
                                      付款时间: {depositPaymentTime.toLocaleDateString('zh-CN')} {depositPaymentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-xs text-gray-600">定金金额</div>
                                    <div className="text-lg font-bold text-blue-600">
                                      ¥{allocation.prepaymentAmount.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        {activeTab === 'payment' && (
                          <div>
                            {(() => {
                              const finalPaymentTime = getPaymentReminderTime(request.id, 'final');
                              const isPaid = isPaymentConfirmed(request.id, 'final');
                              const finalAmount = (request.totalAmount || 0) - (allocation?.prepaymentAmount || 0);
                              
                              return (
                                <div className="flex items-center space-x-4">
                                  {isPaid && finalPaymentTime && (
                                    <div className="text-sm text-gray-600">
                                      付款时间: {finalPaymentTime.toLocaleDateString('zh-CN')} {finalPaymentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-xs text-gray-600">尾款金额</div>
                                    <div className="text-lg font-bold text-green-600">
                                      ¥{finalAmount.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        {activeTab === 'credit_terms' && (
                          <div>
                            <div className="text-xs text-gray-600">账期金额</div>
                            <div className="text-lg font-bold text-purple-600">
                              ¥{request.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      {canManageFinance && (
                        <div>
                          {activeTab === 'credit_terms' ? (
                            (() => {
                              const isPaid = isPaymentConfirmed(request.id, 'credit_terms');
                              const paymentTime = getPaymentReminderTime(request.id, 'credit_terms');
                              
                              if (isPaid) {
                                return (
                                  <div className="flex items-center space-x-4">
                                    {paymentTime && (
                                      <div className="text-sm text-gray-600">
                                        付款时间: {paymentTime.toLocaleDateString('zh-CN')} {paymentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg border border-green-300 text-sm font-medium">
                                      <CheckCircle className="h-4 w-4" />
                                      <span>已付款</span>
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <button
                                    onClick={() => handleConfirmCreditPayment(request.id)}
                                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                  >
                                    确认账期付款
                                  </button>
                                );
                              }
                            })()
                          ) : (
                            (() => {
                              const paymentType = activeTab === 'deposit' ? 'deposit' : 'final';
                              const isPaid = isPaymentConfirmed(request.id, paymentType);
                              const paymentTime = getPaymentReminderTime(request.id, paymentType);
                              
                              if (isPaid) {
                                return (
                                  <div className="flex items-center space-x-4">
                                    {paymentTime && (
                                      <div className="text-sm text-gray-600">
                                        付款时间: {paymentTime.toLocaleDateString('zh-CN')} {paymentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg border border-green-300 text-sm font-medium">
                                      <CheckCircle className="h-4 w-4" />
                                      <span>已付款</span>
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <button
                                    onClick={() => handleConfirmPayment(request.id, paymentType)}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                  >
                                    确认付款
                                  </button>
                                );
                              }
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">财务管理</h1>
          <p className="text-gray-600">管理订单付款和财务记录</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、SKU或供应商..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-600">
              订单: {filteredData.length}
            </span>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">定金总额</h3>
              <p className="text-2xl font-bold text-gray-900">¥{stats.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">待付定金</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.depositOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">账期付款</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.creditTermsOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">本月收款</h3>
              <p className="text-2xl font-bold text-gray-900">¥0</p>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'deposit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DollarSign className="h-5 w-5" />
            <span>定金支付</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'deposit' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {stats.depositOrders}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'payment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Truck className="h-5 w-5" />
            <span>付款发货</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'payment' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {stats.paymentOrders}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('credit_terms')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'credit_terms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span>账期付款</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'credit_terms' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {stats.creditTermsOrders}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span>财务报表</span>
          </button>
        </nav>
      </div>

      {/* 通知消息 */}
      {notificationMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* 标签页内容 */}
      {renderTabContent()}
    </div>
  );
};