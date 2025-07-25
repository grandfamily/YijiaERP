import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  Package, 
  Search, 
  Eye, 
  Edit, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Save,
  X,
  Filter,
  Square,
  CheckSquare,
  Download,
  Send,
  Phone,
  Mail,
  Bell,
  ZoomIn
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseRequest, OrderAllocation, ProcurementProgress, PaymentMethod } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

type TabType = 'in_progress' | 'completed';

// 筛选选项类型
type PurchaseTypeFilter = 'all' | 'external' | 'in_house';
type DepositPaymentFilter = 'all' | 'no_deposit' | 'deposit_paid' | 'deposit_unpaid';
type FinalPaymentFilter = 'all' | 'no_final' | 'final_paid' | 'final_unpaid';

export const PurchaseProgress: React.FC = () => {
  const { 
    getPurchaseRequests, 
    getOrderAllocations, 
    getCardProgress,
    getProcurementProgress,
    createProcurementProgressForRequest,
    updateProcurementProgressStage,
    addPaymentReminder,
    requestCardDelivery,
    getCardDeliveryReminderTime,
    getPaymentReminderTime
  } = useProcurement();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFinanceModal, setShowFinanceModal] = useState<{type: 'deposit' | 'final', requestId: string} | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 筛选状态
  const [filters, setFilters] = useState({
    purchaseType: 'all' as PurchaseTypeFilter,
    depositPayment: 'all' as DepositPaymentFilter,
    finalPayment: 'all' as FinalPaymentFilter
  });

  // SKU级别完成状态管理
  const [completedSKUs, setCompletedSKUs] = useState<Set<string>>(new Set());

  // 获取已分配的订单
  const { data: allocatedRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
      if (!existingProgress) {
        createProcurementProgressForRequest(request);
      }
    });
  }, [allocatedRequests, procurementProgressData]);

    return progress.stages.every(stage => stage.status === 'completed' || stage.status === 'skipped');
  // 检查定金支付状态
  const getDepositPaymentStatus = (requestId: string): DepositPaymentFilter => {
    const allocation = getOrderAllocation(requestId);
    if (!allocation) return 'no_deposit';

    // 无需支付定金：账期付款或定金金额为0
    if (allocation.paymentMethod === 'credit_terms' || (allocation.prepaymentAmount || 0) === 0) {
      return 'no_deposit';
    }

    // 检查定金支付流程节点状态
    const progress = procurementProgressData.find(p => p.purchaseRequestId === requestId);
    if (progress) {
      const depositStage = progress.stages.find(s => s.name === '定金支付');
      if (depositStage && depositStage.status === 'completed') {
        return 'deposit_paid';
      }
    }

    return 'deposit_unpaid';
  };

  // 检查尾款支付状态
  const getFinalPaymentStatus = (requestId: string): FinalPaymentFilter => {
    const allocation = getOrderAllocation(requestId);
    if (!allocation) return 'no_final';

    // 无需支付尾款：账期付款
    if (allocation.paymentMethod === 'credit_terms') {
      return 'no_final';
    }

    // 检查尾款支付流程节点状态
    const progress = procurementProgressData.find(p => p.purchaseRequestId === requestId);
    if (progress) {
      const finalStage = progress.stages.find(s => s.name === '尾款支付');
      if (finalStage && finalStage.status === 'completed') {
        return 'final_paid';
      }
    }

    return 'final_unpaid';
  };

  // 应用筛选条件
  const applyFilters = (requests: typeof allocatedRequests) => {
    return requests.filter(request => {
      const allocation = getOrderAllocation(request.id);
      
      // 采购类型筛选
      if (filters.purchaseType !== 'all') {
        if (!allocation || allocation.type !== filters.purchaseType) {
          return false;
        }
      }

      // 定金支付筛选
      if (filters.depositPayment !== 'all') {
        const depositStatus = getDepositPaymentStatus(request.id);
        if (depositStatus !== filters.depositPayment) {
          return false;
        }
      }

      // 尾款支付筛选
      if (filters.finalPayment !== 'all') {
        const finalStatus = getFinalPaymentStatus(request.id);
        if (finalStatus !== filters.finalPayment) {
          return false;
        }
      }

      return true;
    });
  };

  // 根据标签页过滤订单
  const getTabFilteredRequests = () => {
    let tabFiltered = allocatedRequests.filter(request => {
      // 基于搜索条件过滤
      const matchesSearch = 
        !searchTerm || 
        request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.items.some(item => 
          item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // 基于标签页过滤 - 支持SKU级别判断
      if (activeTab === 'completed') {
        // 已完成栏目：检查是否有任何SKU已完成
        const hasCompletedSKUs = request.items.some(item => isSKUCompleted(request.id, item.id));
        return matchesSearch && hasCompletedSKUs;
      } else {
        // 进行中栏目：检查是否有任何SKU未完成
        const hasInProgressSKUs = request.items.some(item => !isSKUCompleted(request.id, item.id));
        return matchesSearch && hasInProgressSKUs;
      }
    });

    // 应用筛选条件
    return applyFilters(tabFiltered);
  };

  const filteredRequests = getTabFilteredRequests();

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      purchaseType: 'all',
      depositPayment: 'all',
      finalPayment: 'all'
    });
  };

  // 检查是否有筛选条件激活
  const hasActiveFilters = () => {
    return filters.purchaseType !== 'all' || 
           filters.depositPayment !== 'all' || 
           filters.finalPayment !== 'all';
  };

  // 原有的过滤逻辑保持不变，但现在通过 getTabFilteredRequests 处理
  const originalFilteredRequests = allocatedRequests.filter(request => {
    // 基于搜索条件过滤
    const matchesSearch = 
      !searchTerm || 
      request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.items.some(item => 
        item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // 基于标签页过滤
    const isCompleted = isProcurementCompleted(request.id);
    return matchesSearch && ((activeTab === 'completed' && isCompleted) || (activeTab === 'in_progress' && !isCompleted));
  });

  // 检查采购是否已完成
  function isProcurementCompleted(requestId: string): boolean {
    const progress = procurementProgressData.find(p => p.purchaseRequestId === requestId);
    return progress ? progress.stages.every(s => s.status === 'completed' || s.status === 'skipped') : false;
  }

  // 检查单个SKU是否已完成（新增）
  function isSKUCompleted(requestId: string, itemId: string): boolean {
    return completedSKUs.has(`${requestId}-${itemId}`);
  }

  // 处理SKU级别完成（新增）
  const handleSKUComplete = async (requestId: string, itemId: string) => {
    try {
      // 将SKU标记为已完成
      const skuKey = `${requestId}-${itemId}`;
      setCompletedSKUs(prev => new Set([...prev, skuKey]));
      
      // 显示成功提示
      setNotificationMessage('SKU收货确认已完成，已移至已完成栏目');
      setTimeout(() => setNotificationMessage(null), 3000);
      
      console.log(`✅ SKU完成：订单 ${requestId} 的 SKU ${itemId} 已完成收货确认`);
    } catch (error) {
      console.error('SKU完成操作失败:', error);
      setNotificationMessage('操作失败，请重试');
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  // 获取订单的采购进度
  function getRequestProgress(requestId: string): ProcurementProgress | undefined {
    return procurementProgressData.find(p => p.purchaseRequestId === requestId);
  }

  // 检查是否需要显示定金支付节点
  function shouldShowDepositPayment(requestId: string): boolean {
    const allocation = getOrderAllocation(requestId);
    if (!allocation) return false;
    
    // 如果是账期付款或定金为0，则不需要显示定金支付节点
    const isCreditTerms = allocation.paymentMethod === 'credit_terms';
    const isZeroDeposit = (allocation.prepaymentAmount || 0) === 0;
    
    return !(isCreditTerms || isZeroDeposit);
  }

  // 检查纸卡是否已完成
  function isCardProgressCompleted(requestId: string): boolean {
    const cardProgress = cardProgressData.filter(cp => cp.purchaseRequestId === requestId);
    return cardProgress.length > 0 && cardProgress.every(cp => 
      cp.stages.every(stage => stage.status === 'completed')
    );
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors = {
      'not_started': 'gray',
      'in_progress': 'yellow',
      'completed': 'green',
      'skipped': 'blue'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap = {
      'not_started': '未开始',
      'in_progress': '进行中',
      'completed': '已完成',
      'skipped': '已跳过'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // 处理图片点击放大
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };
  // 处理阶段完成
  const handleCompleteStage = async (requestId: string, stageName: string) => {
    try {
      const progress = getRequestProgress(requestId);
      if (!progress) return;

      // 检查是否可以完成此阶段（前置阶段必须已完成）
      const stageIndex = progress.stages.findIndex(s => s.name === stageName);
      if (stageIndex > 0) {
        // 检查前面所有节点是否都已完成或跳过
        for (let i = 0; i < stageIndex; i++) {
          const prevStage = progress.stages[i];
          if (prevStage.status !== 'completed' && prevStage.status !== 'skipped') {
            setNotificationMessage(`请先完成前置节点："${prevStage.name}"`);
            setTimeout(() => setNotificationMessage(null), 3000);
            return;
          }
        }
      }
      await updateProcurementProgressStage(progress.id, stageName, {
        status: 'completed',
        completedDate: new Date()
      });

      setNotificationMessage(`已完成"${stageName}"阶段`);
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (error) {
      console.error('完成阶段失败:', error);
      setNotificationMessage('操作失败，请重试');
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  // 处理单个SKU的阶段完成
  const handleCompleteSKUStage = async (requestId: string, itemId: string, stageName: string) => {
    try {
      const progress = getRequestProgress(requestId);
      if (!progress) return;

      // 检查是否可以完成此阶段（前置阶段必须已完成）
      const stageIndex = progress.stages.findIndex(s => s.name === stageName);
      if (stageIndex > 0) {
        // 检查前面所有节点是否都已完成或跳过
        for (let i = 0; i < stageIndex; i++) {
          const prevStage = progress.stages[i];
          if (prevStage.status !== 'completed' && prevStage.status !== 'skipped') {
            setNotificationMessage(`请先完成前置节点："${prevStage.name}"`);
            setTimeout(() => setNotificationMessage(null), 3000);
            return;
          }
        }
      }

      // 更新单个SKU的阶段状态
      await updateProcurementProgressStage(progress.id, stageName, {
        status: 'completed',
        completedDate: new Date(),
        remarks: `SKU ${itemId} 单独完成`
      });

      setNotificationMessage(`SKU项目的"${stageName}"阶段已完成`);
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (error) {
      console.error('完成SKU阶段失败:', error);
      setNotificationMessage('操作失败，请重试');
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  // 检查是否可以操作单个SKU的阶段
  const canOperateSKUStage = (requestId: string, stageName: string, stageIndex: number): boolean => {
    const progress = getRequestProgress(requestId);
    if (!progress) return false;

    // 第一个节点总是可以操作
    if (stageIndex === 0) return true;

    // 检查前面所有节点是否都已完成或跳过
    for (let i = 0; i < stageIndex; i++) {
      const prevStage = progress.stages[i];
      if (prevStage.status !== 'completed' && prevStage.status !== 'skipped') {
        return false;
      }
    }

    return true;
  };
  // 处理催付款
  const handlePaymentReminder = async (type: 'deposit' | 'final', requestId: string) => {
    try {
      // 记录催付时间，传入具体的催付类型
      addPaymentReminder(requestId, type);
      
      const paymentTypeName = type === 'deposit' ? '定金' : '尾款';
      setNotificationMessage(`催付${paymentTypeName}通知已发送，财务管理模块将显示催付时间`);
      
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (error) {
      console.error('催付操作失败:', error);
      setNotificationMessage('催付操作失败，请重试');
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  // 处理催要纸卡
  const handleRequestCardDelivery = async (requestId: string) => {
    try {
      requestCardDelivery(requestId);
      setNotificationMessage('催要纸卡通知已发送，纸卡设计人员将收到提醒');
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (error) {
      console.error('催要纸卡操作失败:', error);
      setNotificationMessage('催要纸卡操作失败，请重试');
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  // 检查用户是否有编辑权限
  const canEdit = hasPermission('manage_procurement_progress');

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectedOrders.length === filteredRequests.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredRequests.map(r => r.id));
    }
  };

  // 处理单个订单选择
  const handleSelectOrder = (requestId: string) => {
    if (selectedOrders.includes(requestId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== requestId));
    } else {
      setSelectedOrders([...selectedOrders, requestId]);
    }
  };

  // 导出选中订单
  const handleExportSelected = () => {
    if (selectedOrders.length === 0) {
      setNotificationMessage('请先选择要导出的订单');
      setTimeout(() => setNotificationMessage(null), 3000);
      return;
    }

    // 模拟导出功能
    setNotificationMessage(`已导出${selectedOrders.length}个订单的采购进度数据`);
    setTimeout(() => setNotificationMessage(null), 3000);
    setSelectedOrders([]);
  };

  // 获取统计数据
  const getTabStats = () => {
    const inProgress = allocatedRequests.filter(r => !isProcurementCompleted(r.id)).length;
    const completed = allocatedRequests.filter(r => isProcurementCompleted(r.id)).length;
    
    return { inProgress, completed };
  };

  const tabStats = getTabStats();

  return (
    <>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购进度</h1>
          <p className="text-gray-600">管理采购订单的执行进度和状态</p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedOrders.length > 0 && (
            <button
              onClick={handleExportSelected}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>导出选中 ({selectedOrders.length})</span>
            </button>
          )}
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
              订单: {filteredRequests.length}
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
            <span>进行中</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {tabStats.inProgress}
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
              {tabStats.completed}
            </span>
          </button>
        </nav>
      </div>

      {/* Batch Operations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
            >
              {selectedOrders.length === filteredRequests.length && filteredRequests.length > 0 ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>全选订单</span>
            </button>
            {selectedOrders.length > 0 && (
              <span className="text-sm text-blue-600">
                已选择 {selectedOrders.length} 个订单
              </span>
            )}
            
            {/* 筛选下拉框 - 仅采购人员可见 */}
            {user?.role === 'purchasing_officer' && (
              <div className="flex items-center space-x-3 ml-6">
                {/* 采购类型筛选 */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">采购类型:</label>
                  <select
                    value={filters.purchaseType}
                    onChange={(e) => setFilters({...filters, purchaseType: e.target.value as PurchaseTypeFilter})}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">全部</option>
                    <option value="external">厂家包装</option>
                    <option value="in_house">自己包装</option>
                  </select>
                </div>

                {/* 定金支付筛选 */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">定金支付:</label>
                  <select
                    value={filters.depositPayment}
                    onChange={(e) => setFilters({...filters, depositPayment: e.target.value as DepositPaymentFilter})}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">全部</option>
                    <option value="no_deposit">无需支付定金</option>
                    <option value="deposit_paid">定金已支付</option>
                    <option value="deposit_unpaid">定金未支付</option>
                  </select>
                </div>

                {/* 尾款支付筛选 */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">尾款支付:</label>
                  <select
                    value={filters.finalPayment}
                    onChange={(e) => setFilters({...filters, finalPayment: e.target.value as FinalPaymentFilter})}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">全部</option>
                    <option value="no_final">无需支付尾款</option>
                    <option value="final_paid">尾款已支付</option>
                    <option value="final_unpaid">尾款未支付</option>
                  </select>
                </div>

                {/* 重置筛选按钮 */}
                {hasActiveFilters() && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    重置筛选
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {activeTab === 'in_progress' ? '进行中订单：采购流程尚未全部完成' : '已完成订单：采购流程已全部完成'}
            {user?.role === 'purchasing_officer' && hasActiveFilters() && (
              <span className="ml-2 text-blue-600">
                (已应用筛选条件，显示 {filteredRequests.length} / {originalFilteredRequests.length} 个订单)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notification Message */}
      {notificationMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      {/* Orders List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'in_progress' ? '没有进行中的采购订单' : '没有已完成的采购订单'}
          </h3>
          <p className="text-gray-600">
            {activeTab === 'in_progress' ? '所有采购订单都已完成' : '还没有完成的采购订单'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((request) => {
            const allocation = getOrderAllocation(request.id);
            const progress = getRequestProgress(request.id);
            const isSelected = selectedOrders.includes(request.id);
            
            // 如果没有进度记录，创建默认进度
            const defaultProgress = {
              stages: [
                { 
                  id: '1', 
                  name: shouldShowDepositPayment(request.id) ? '定金支付' : '无需定金', 
                  status: shouldShowDepositPayment(request.id) ? 'in_progress' : 'completed', 
                  order: 1,
                  completedDate: shouldShowDepositPayment(request.id) ? undefined : new Date(),
                  remarks: shouldShowDepositPayment(request.id) ? undefined : '账期付款或无需定金，自动跳过'
                },
                { 
                  id: '2', 
                  name: '安排生产', 
                  status: shouldShowDepositPayment(request.id) ? 'not_started' : 'in_progress', 
                  order: 2 
                },
                { id: '3', name: '纸卡提供', status: isCardProgressCompleted(request.id) ? 'completed' : 'not_started', order: 3 },
                { id: '4', name: '包装生产', status: 'not_started', order: 4 },
                { id: '5', name: '尾款支付', status: 'not_started', order: 5 },
                { id: '6', name: '安排发货', status: 'not_started', order: 6 },
                { id: '7', name: '收货确认', status: 'not_started', order: 7 }
              ],
              currentStage: shouldShowDepositPayment(request.id) ? 0 : 1, // 如果跳过定金，当前阶段为安排生产
              overallProgress: 0
            };
            
            const currentProgress = progress || defaultProgress;
            const completedStages = currentProgress.stages.filter(s => s.status === 'completed').length;
            const totalStages = currentProgress.stages.filter(s => s.status !== 'skipped').length;
            const progressPercentage = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
            
            return (
              <div 
                key={request.id} 
                className={`bg-white rounded-lg shadow-sm border-2 transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } p-6`}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
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
                    <StatusBadge
                      status={isProcurementCompleted(request.id) ? '已完成' : '进行中'}
                      color={isProcurementCompleted(request.id) ? 'green' : 'yellow'}
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* 纸卡类型、付款方式、定金金额字段 */}
                    <div className="flex items-center space-x-6 text-sm">
                      <div>
                        <span className="text-gray-600">纸卡类型:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {allocation?.cardType === 'finished' ? '纸卡成品' :
                           allocation?.cardType === 'design' ? '设计稿' :
                           allocation?.cardType === 'none' ? '不需要' : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">付款方式:</span>
                        <span className="ml-2 font-medium text-gray-900">
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
                      {/* 定金金额字段 - 仅当定金金额大于0时显示 */}
                      {allocation?.prepaymentAmount && allocation.prepaymentAmount > 0 && (
                        <div>
                          <span className="text-gray-600">定金金额:</span>
                          <span className="ml-2 font-medium text-blue-600">
                            ¥{allocation.prepaymentAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">供应商:</span> {allocation?.supplierName || '未指定'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">总金额:</span> ¥{request.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">采购进度</span>
                    <span className="text-sm text-gray-600">{progressPercentage}%</span>
                  </div>
                  <ProgressBar 
                    progress={progressPercentage}
                    color={progressPercentage === 100 ? 'green' : 'blue'}
                  />
                </div>

                {/* SKU Table - Single Row per SKU */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">采购项目</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">图片</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">产品名称</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">采购数量</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">整体进度</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">定金支付</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">安排生产</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">纸卡提供</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">包装生产</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">尾款支付</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">安排发货</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">收货确认</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {request.items.map((item) => {
                          const cardProgress = cardProgressData.find(cp => 
                      {request.items.map((item) => {
                          const shouldShowInCurrentTab = activeTab === 'completed' ? skuCompleted : !skuCompleted;
                          
                          // 如果SKU不应该在当前栏目显示，则跳过
                          if (!shouldShowInCurrentTab) {
                            return null;
                          }
                          
                          return (
                            <tr key={item.id} className="hover:bg-gray-50">
                              {/* Product Image */}
                              <td className="py-4 px-4">
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
                                const isCompleted = stage.status === 'completed';
                                const isInProgress = stage.status === 'in_progress';
                                const isSkipped = stage.status === 'skipped';
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </td>
                              
                              {/* SKU Info */}
                              <td className="py-4 px-4">
                                <div className="font-medium text-gray-900">{item.sku.code}</div>
                                <div className="text-xs text-gray-500">{item.sku.category}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-900">{item.sku.name}</div>
                                <div className="text-xs text-gray-500">{item.sku.englishName}</div>
                              </td>
                              
                              {/* Purchase Quantity */}
                              <td className="py-4 px-4 text-center">
                                <span className="text-sm font-medium text-gray-900">
                                  {item.quantity.toLocaleString()}
                                </span>
                              </td>
                              
                              {/* Overall Progress */}
                              <td className="py-4 px-4 text-center">
                                <div className="flex flex-col items-center space-y-1">
                                  <span className="text-sm font-bold text-blue-600">{skuProgressPercentage}%</span>
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                      style={{ width: `${skuProgressPercentage}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Stage Status Columns */}
                              {currentProgress.stages.map((stage) => {
                                // 如果SKU已完成，所有阶段显示为已完成
                                const effectiveStageStatus = skuCompleted ? 'completed' : stage.status;
                                const effectiveCompletedDate = skuCompleted ? new Date() : stage.completedDate;
                                
                                return (
                                  <td key={stage.id} className="py-4 px-4 text-center">
                                    <div className="flex flex-col items-center space-y-2">
                                      <div className={`text-xs px-2 py-1 rounded-full ${
                                        status={isCompleted ? '已完成' : 
                                               isInProgress ? '进行中' : 
                                               isSkipped ? '已跳过' : '未开始'}
                                        color={isCompleted ? 'green' : 
                                               isInProgress ? 'yellow' : 
                                               isSkipped ? 'gray' : 'gray'}
                                      </div>
                                      
                                      {/* Completion Date */}
                                      {stage.completedDate && (
                                        <div className="text-xs text-gray-500">
                                          {stage.completedDate.toLocaleDateString('zh-CN')}
                                        </div>
                                      )}
                                      
                                      {/* SKU级别完成按钮 - 仅在收货确认节点且状态为进行中时显示 */}
                                      {stage.name === '收货确认' && 
                                       effectiveStageStatus === 'in_progress' && 
                                       !skuCompleted &&
                                       activeTab === 'in_progress' && (
                                        <button
                                          onClick={() => handleSKUComplete(request.id, item.id)}
                                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                                        >
                                          完成
                                        </button>
                                      )}
                                      
                                      {/* Remarks for auto-completed stages */}
                                      {stage.remarks && (
                                        <div className="text-xs text-blue-600" title={stage.remarks}>
                                          自动跳过
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                        
                        {/* 过滤掉null值，确保表格渲染正常 */}
                        ).filter(Boolean)}
                        
                        {/* Batch Complete Row */}
                        {canEdit && activeTab === 'in_progress' && (
                          <tr className="bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-700" colSpan={5}>
                              批量操作
                            </td>
                            {/* 为每个节点创建对应的批量操作按钮 */}
                            {currentProgress.stages.map((stage, stageIndex) => {

                              // 检查是否可以操作此节点（前置节点必须已完成）
                              const canOperateStage = () => {
                                if (stageIndex === 0) return true; // 第一个节点总是可以操作
                                
                                // 检查前面所有节点是否都已完成或跳过
                                for (let i = 0; i < stageIndex; i++) {
                                  const prevStage = currentProgress.stages[i];
                                  if (prevStage.status !== 'completed' && prevStage.status !== 'skipped') {
                                    return false;
                                  }
                                }
                                return true;
                              };

                              const isOperatable = canOperateStage();
                              const isInProgress = stage.status === 'in_progress';
                              const isCompleted = stage.status === 'completed' || stage.status === 'skipped';
                              const showButton = isOperatable && !isCompleted;

                              return (
                                <td key={stage.id} className="py-3 px-4 text-center">
                                  {isCompleted ? (
                                    <span className="px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded-full border border-green-200 font-medium">
                                      已完成
                                    </span>
                                  ) : showButton ? (
                                    <>
                                      {/* 催付类按钮 */}
                                      {stage.name === '定金支付' && (
                                        <button
                                          onClick={() => handlePaymentReminder('deposit', request.id)}
                                          className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center space-x-1 mx-auto"
                                        >
                                          <Bell className="h-3 w-3" />
                                          <span>催付定金</span>
                                        </button>
                                      )}
                                      {stage.name === '纸卡提供' && (
                                        <button
                                          onClick={() => handleRequestCardDelivery(request.id)}
                                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center space-x-1 mx-auto"
                                        >
                                          <Bell className="h-3 w-3" />
                                          <span>催要纸卡</span>
                                        </button>
                                      )}

                                    
                                      {stage.name === '尾款支付' && (
                                        <button
                                          onClick={() => handlePaymentReminder('final', request.id)}
                                          className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center space-x-1 mx-auto"
                                        >
                                          <Bell className="h-3 w-3" />
                                          <span>催付尾款</span>
                                        </button>
                                      )}
                                      {/* 批量完成按钮 */}
                                      {!['定金支付', '纸卡提供', '尾款支付'].includes(stage.name) && (
                                        <button
                                          onClick={() => handleCompleteStage(request.id, stage.name)}
                                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                          批量完成
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 rounded-full border border-gray-200 font-medium">
                                      {!isOperatable ? '等待前置节点' : '未开始'}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 催付时间显示 - 参照纸卡催要样式，显示在订单右下角 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm flex-1">
                      <div>
                        <span className="text-gray-600">申请人:</span>
                        <span className="ml-2 font-medium text-gray-900">{request?.requester.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">创建时间:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {request?.createdAt ? new Date(request.createdAt).toLocaleDateString('zh-CN') : '-'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">交货日期:</span> 
                        {allocation?.deliveryDate ? new Date(allocation.deliveryDate).toLocaleDateString('zh-CN') : '-'}
                      </div>
                      {(() => {
                        const cardReminderTime = getCardDeliveryReminderTime(request.id);
                        const depositReminderTime = getPaymentReminderTime(request.id, 'deposit');
                        const finalReminderTime = getPaymentReminderTime(request.id, 'final');
                        
                        // 显示纸卡催要时间
                        if (cardReminderTime) {
                          return (
                            <div className="text-sm text-orange-600">
                              <span className="font-medium">纸卡催要时间:</span> 
                              {cardReminderTime.toLocaleDateString('zh-CN')} {cardReminderTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          );
                        }
                        
                        // 显示定金催付时间（仅采购人员可见）
                        if (user?.role === 'purchasing_officer' && depositReminderTime) {
                          return (
                            <div className="text-sm text-orange-600">
                              <span className="font-medium">定金催付时间:</span> 
                              {depositReminderTime.toLocaleDateString('zh-CN')} {depositReminderTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          );
                        }
                        
                        // 显示尾款催付时间（仅采购人员可见）
                        if (user?.role === 'purchasing_officer' && finalReminderTime) {
                          return (
                            <div className="text-sm text-orange-600">
                              <span className="font-medium">尾款催付时间:</span> 
                              {finalReminderTime.toLocaleDateString('zh-CN')} {finalReminderTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          );
                        }
                        
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Reminder Modal */}
      {showFinanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showFinanceModal.type === 'deposit' ? '催付定金' : '催付尾款'}
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  催付方式
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="email">邮件</option>
                  <option value="sms">短信</option>
                  <option value="phone">电话</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  催付备注
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入催付备注..."
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-800">
                    催付记录将自动同步至财务管理系统
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowFinanceModal(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setNotificationMessage(`已发送${showFinanceModal.type === 'deposit' ? '定金' : '尾款'}催付通知`);
                  setShowFinanceModal(null);
                  setTimeout(() => setNotificationMessage(null), 3000);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                发送催付
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
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
      </div>
    </>
  );
};