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
  ZoomIn,
  Zap,
  Upload,
  Factory,
  Home,
  XCircle
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseRequest, OrderAllocation, ProcurementProgress, PaymentMethod, ProcurementProgressStage } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

type TabType = 'in_progress' | 'external_completed' | 'internal_completed' | 'failed_orders';

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
    getPaymentReminderTime,
    confirmCardDelivery
  } = useProcurement();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showFinanceModal, setShowFinanceModal] = useState<{type: 'deposit' | 'final', requestId: string} | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [arrivalQuantities, setArrivalQuantities] = useState<{[key: string]: number}>({});

  // 筛选状态
  const [filters, setFilters] = useState({
    status: [] as string[],
    dateRange: { start: '', end: '' },
    purchaseType: 'all' as PurchaseTypeFilter,
    depositPayment: 'all' as DepositPaymentFilter,
    finalPayment: 'all' as FinalPaymentFilter
  });

  // SKU级别完成状态管理
  const [completedSKUs, setCompletedSKUs] = useState<Set<string>>(new Set());

  // 获取数据
  const procurementProgress = getProcurementProgress();
  const { data: purchaseRequests } = getPurchaseRequests();
  const orderAllocations = getOrderAllocations();

  // 获取已分配的订单
  const { data: allocatedRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'updatedAt', direction: 'desc' }
  );

  // 获取所有纸卡进度
  const cardProgressData = getCardProgress();

  // 获取所有采购进度
  const procurementProgressData = getProcurementProgress();

  // 为没有采购进度的订单创建进度记录
  React.useEffect(() => {
    allocatedRequests.forEach(request => {
      const existingProgress = procurementProgressData.find(pp => pp.purchaseRequestId === request.id);
      if (!existingProgress) {
        createProcurementProgressForRequest(request);
      }
    });
  }, [allocatedRequests, procurementProgressData]);

  // 获取订单分配信息
  const getOrderAllocation = (requestId: string): OrderAllocation | undefined => {
    return orderAllocations.find(a => a.purchaseRequestId === requestId);
  };

  // 采购专员收货确认权限检查函数
  const canCompleteReceiving = (stage: ProcurementProgressStage): boolean => {
    // 只有采购专员可以完成"收货确认"节点
    return user?.role === 'purchasing_officer' && 
           stage.name === '收货确认' && 
           hasPermission('complete_receiving_confirmation');
  };

  // 权限检查函数 - 其他节点权限（保持原有逻辑）
  const canCompleteOtherStages = (stage: ProcurementProgressStage): boolean => {
    // 非收货确认节点的权限逻辑
    if (stage.name === '收货确认') {
      return false; // 收货确认只能由采购专员操作
    }
    
    // 其他节点的权限逻辑（根据实际需求调整）
    return user?.role === 'purchasing_officer' || 
           user?.role === 'department_manager' || 
           user?.role === 'general_manager';
  };

  // 🎯 业务逻辑规则：SKU分类判断函数
  const classifySKUByBusinessRules = (progressId: string) => {
    const progress = procurementProgress.find(p => p.id === progressId);
    if (!progress) return 'in_progress';

    const request = purchaseRequests.find(req => req.id === progress.purchaseRequestId);
    const allocation = orderAllocations.find(a => a.purchaseRequestId === progress.purchaseRequestId);
    
    if (!request || !allocation) return 'in_progress';

    // 检查是否所有阶段都已完成
    const allStagesCompleted = progress.stages.every(stage => 
      stage.status === 'completed' || stage.status === 'skipped'
    );

    // 🔍 业务规则1：进行中订单
    if (!allStagesCompleted) {
      return 'in_progress';
    }

    // 🔍 业务规则2：厂家包装已完成
    if (allocation.type === 'external' && allStagesCompleted) {
      return 'external_completed';
    }

    // 🔍 业务规则3：自己包装已完成
    if (allocation.type === 'in_house' && allStagesCompleted) {
      // 检查是否有验收不通过的情况
      const hasFailedInspection = request.status === 'rejected' || 
        progress.stages.some(stage => stage.name === '验收' && stage.status === 'skipped');
      
      if (hasFailedInspection) {
        return 'failed_orders';
      }
      
      return 'internal_completed';
    }

    // 🔍 业务规则4：不合格订单
    // 自己包装类型且验收不通过
    if (allocation.type === 'in_house' && 
        (request.status === 'rejected' || 
         progress.stages.some(stage => stage.name === '验收' && stage.status === 'skipped'))) {
      return 'failed_orders';
    }

    return 'in_progress';
  };

  // 🎯 根据业务规则过滤数据
  const getFilteredProgressByTab = () => {
    return procurementProgress.filter(progress => {
      const classification = classifySKUByBusinessRules(progress.id);
      return classification === activeTab;
    });
  };

  // 🎯 获取统计数据
  const getTabStats = () => {
    const inProgress = procurementProgress.filter(p => classifySKUByBusinessRules(p.id) === 'in_progress').length;
    const externalCompleted = procurementProgress.filter(p => classifySKUByBusinessRules(p.id) === 'external_completed').length;
    const internalCompleted = procurementProgress.filter(p => classifySKUByBusinessRules(p.id) === 'internal_completed').length;
    const failedOrders = procurementProgress.filter(p => classifySKUByBusinessRules(p.id) === 'failed_orders').length;
    
    return { inProgress, externalCompleted, internalCompleted, failedOrders };
  };

  const tabStats = getTabStats();
  const filteredProgress = getFilteredProgressByTab();

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

  // 根据搜索条件进一步过滤
  const searchFilteredProgress = filteredProgress.filter(progress => {
    if (!searchTerm) return true;
    
    const request = purchaseRequests.find(req => req.id === progress.purchaseRequestId);
    return request?.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           request?.items.some(item => 
             item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  // 重置筛选条件
  const resetFilters = () => {
    setFilters({
      status: [] as string[],
      dateRange: { start: '', end: '' },
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

  // 处理到货数量变更
  const handleArrivalQuantityChange = (requestId: string, itemId: string, quantity: number) => {
    const key = `${requestId}-${itemId}`;
    setArrivalQuantities(prev => ({
      ...prev,
      [key]: quantity
    }));
  };

  // 获取到货数量
  const getArrivalQuantity = (requestId: string, itemId: string): number => {
    const key = `${requestId}-${itemId}`;
    return arrivalQuantities[key] ?? 0;
  };

  // 检查是否可以保存到货数量（厂家包装专用）
  const canSaveArrivalQuantity = (requestId: string, itemId: string): boolean => {
    const progress = procurementProgressData.find(p => p.purchaseRequestId === requestId);
    if (!progress || !progress.stages) {
      return false;
    }
    
    const allocation = getOrderAllocation(requestId);
    
    // 只有厂家包装订单才显示到货数量功能
    if (!allocation || allocation.type !== 'external') {
      return false;
    }
    
    // 检查收货确认节点是否为进行中
    const receiptStage = progress.stages.find((stage: any) => stage.name === '收货确认');
    
    // 首先检查progress和stages是否存在
    if (!progress || !progress.stages) {
      return false;
    }

    return receiptStage && receiptStage.status === 'in_progress';
  };

  const handleSaveArrivalQuantity = async (requestId: string, itemId: string) => {
    const arrivalQty = getArrivalQuantity(requestId, itemId);
    const request = allocatedRequests.find(r => r.id === requestId);
    const item = request?.items.find(i => i.id === itemId);
    
    if (!item) return;
    
    try {
      if (arrivalQty >= item.quantity) {
        // 到货数量 >= 采购数量，直接完成
        const skuKey = `${requestId}-${itemId}`;
        setCompletedSKUs(prev => new Set([...prev, skuKey]));
        
        // 更新采购进度状态
        await updateProcurementProgressStage(requestId, '收货确认', {
          status: 'completed',
          completedDate: new Date()
        });
        
        alert('收货确认完成！SKU已移至已完成栏目。');
      } else {
        // 到货数量 < 采购数量，弹出确认对话框
        const shouldContinue = window.confirm(
          `实际到货数量(${arrivalQty})少于采购数量(${item.quantity})，剩余订单是否继续生产？\n\n点击"确定"继续生产剩余数量\n点击"取消"仅按实际数量完成`
        );
        
        if (shouldContinue) {
          // 选择继续生产：拆分SKU记录
          alert(`SKU已拆分：\n- 已完成数量：${arrivalQty}\n- 剩余生产数量：${item.quantity - arrivalQty}`);
          // TODO: 实现SKU拆分逻辑
        } else {
          // 选择不继续：按实际数量完成
          const skuKey = `${requestId}-${itemId}`;
          setCompletedSKUs(prev => new Set([...prev, skuKey]));
          alert(`收货确认完成！按实际到货数量(${arrivalQty})完成。`);
        }
      }
    } catch (error) {
      console.error('保存到货数量失败:', error);
      alert('保存失败，请重试');
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
    return cardProgress.every(cp => cp.stages.every(stage => stage.status === 'completed'));
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

  // 获取订单信息
  const getRequestInfo = (requestId: string) => {
    return purchaseRequests.find(req => req.id === requestId);
  };

  // 处理阶段完成
  const handleCompleteStage = async (progressId: string, stageName: string) => {
    try {
      const progress = procurementProgress.find(p => p.id === progressId);
      const stage = progress?.stages.find(s => s.name === stageName);
      
      // 🔒 权限验证：收货确认节点只有采购专员可以操作
      if (stageName === '收货确认' && !canCompleteReceiving(stage)) {
        alert('权限不足：只有采购专员可以完成收货确认操作');
        return;
      }

      await updateProcurementProgressStage(progressId, stageName, {
        status: 'completed',
        completedDate: new Date()
      });

      // 特殊处理：定金支付完成后自动添加催付记录
      if (stageName === '定金支付') {
        const requestId = progress?.purchaseRequestId;
        if (requestId) {
          addPaymentReminder(requestId, 'deposit');
        }
      }

      // 特殊处理：尾款支付完成后自动添加催付记录
      if (stageName === '尾款支付') {
        const requestId = progress?.purchaseRequestId;
        if (requestId) {
          addPaymentReminder(requestId, 'final');
        }
      }

      // 特殊处理：纸卡提供完成后自动确认纸卡交付
      if (stageName === '纸卡提供') {
        const requestId = progress?.purchaseRequestId;
        if (requestId) {
          confirmCardDelivery(requestId);
        }
      }

    } catch (error) {
      console.error('完成阶段失败:', error);
      alert('操作失败，请重试');
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

  // 处理催要纸卡
  const handleRequestCard = async (requestId: string) => {
    try {
      requestCardDelivery(requestId);
      alert('纸卡催要记录已添加');
    } catch (error) {
      console.error('催要纸卡失败:', error);
      alert('操作失败，请重试');
    }
  };

  // 检查用户是否有编辑权限
  const canEdit = hasPermission('manage_procurement_progress');
  const canUpdateProgress = hasPermission('update_procurement_progress');

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectedOrders.length === searchFilteredProgress.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(searchFilteredProgress.map(p => p.id));
    }
  };

  // 处理单个订单选择
  const handleSelectOrder = (progressId: string) => {
    if (selectedOrders.includes(progressId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== progressId));
    } else {
      setSelectedOrders([...selectedOrders, progressId]);
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

  return (
    <>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购进度</h1>
          <p className="text-gray-600">跟踪和管理采购订单的执行进度</p>
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
              当前: {searchFilteredProgress.length}
            </span>
          </div>
        </div>
      </div>

      {/* 🎯 业务规则说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-800">SKU自动分类规则</h3>
        </div>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>进行中</strong>：采购流程未全部完成的SKU</p>
          <p>• <strong>厂家包装已完成</strong>：厂家包装类型且所有流程已完成的SKU</p>
          <p>• <strong>自己包装已完成</strong>：自己包装类型且验收通过的SKU</p>
          <p>• <strong>不合格订单</strong>：自己包装类型但验收不通过的SKU</p>
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
            onClick={() => setActiveTab('external_completed')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'external_completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Factory className="h-5 w-5" />
            <span>厂家包装已完成</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'external_completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {tabStats.externalCompleted}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('internal_completed')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'internal_completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Home className="h-5 w-5" />
            <span>自己包装已完成</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'internal_completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {tabStats.internalCompleted}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('failed_orders')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'failed_orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <XCircle className="h-5 w-5" />
            <span>不合格订单</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'failed_orders' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {tabStats.failedOrders}
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
              {selectedOrders.length === searchFilteredProgress.length && searchFilteredProgress.length > 0 ? (
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
          </div>
          <div className="text-sm text-gray-500">
            {activeTab === 'in_progress' ? '进行中订单：采购流程尚未全部完成' : 
             activeTab === 'external_completed' ? '厂家包装已完成的订单' :
             activeTab === 'internal_completed' ? '自己包装已完成的订单' :
             '不合格订单：验收不通过的订单'}
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

      {/* 权限说明提示 */}
      {user?.role === 'purchasing_officer' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">采购专员权限</h3>
              <p className="text-sm text-blue-700 mt-1">
                您拥有"收货确认"节点的专属操作权限，其他角色无法看到或操作此节点的完成按钮
              </p>
            </div>
          </div>
        </div>
      )}

      {searchFilteredProgress.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'in_progress' ? '没有进行中的采购订单' : 
             activeTab === 'external_completed' ? '没有厂家包装已完成的订单' :
             activeTab === 'internal_completed' ? '没有自己包装已完成的订单' :
             '没有不合格的订单'}
          </h3>
          <p className="text-gray-500">
            {activeTab === 'in_progress' ? '所有采购订单都已完成' : 
             activeTab === 'external_completed' ? '还没有厂家包装完成的订单' :
             activeTab === 'internal_completed' ? '还没有自己包装完成的订单' :
             '所有订单都符合质量要求'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {searchFilteredProgress.map((progress) => {
            const request = getRequestInfo(progress.purchaseRequestId);
            const allocation = getOrderAllocation(progress.purchaseRequestId);
            const isSelected = selectedOrders.includes(progress.id);
            
            if (!request) return null;
            
            return (
              <div key={progress.id} className={`bg-white rounded-lg shadow-sm border-2 transition-colors ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              } p-6`}>
                {/* Order Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleSelectOrder(progress.id)}
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
                    {/* 🎯 显示当前分类状态 */}
                    <StatusBadge
                      status={
                        activeTab === 'in_progress' ? '进行中' :
                        activeTab === 'external_completed' ? '厂家包装已完成' :
                        activeTab === 'internal_completed' ? '自己包装已完成' :
                        '不合格订单'
                      }
                      color={
                        activeTab === 'in_progress' ? 'yellow' :
                        activeTab === 'external_completed' ? 'blue' :
                        activeTab === 'internal_completed' ? 'green' :
                        'red'
                      }
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    申请人: {request.requester.name}
                  </div>
                </div>

                {/* Progress Overview */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">整体进度</span>
                    <span className="text-sm text-gray-600">{progress.overallProgress}%</span>
                  </div>
                  <ProgressBar 
                    progress={progress.overallProgress}
                    color={
                      activeTab === 'failed_orders' ? 'red' :
                      progress.overallProgress === 100 ? 'green' : 'blue'
                    }
                  />
                </div>

                {/* Stages */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {progress.stages.map((stage, index) => {
                    const isCompleted = stage.status === 'completed';
                    const isInProgress = stage.status === 'in_progress';
                    const isSkipped = stage.status === 'skipped';
                    const canComplete = canUpdateProgress && 
                      !isCompleted && 
                      !isSkipped &&
                      (index === 0 || progress.stages[index - 1]?.status === 'completed');

                    return (
                      <div key={stage.id} className="text-center">
                        <div className={`p-4 rounded-lg border-2 transition-colors ${
                          isCompleted ? 'border-green-500 bg-green-50' :
                          isInProgress ? 'border-blue-500 bg-blue-50' :
                          isSkipped ? 'border-red-500 bg-red-50' :
                          'border-gray-300 bg-gray-50'
                        }`}>
                          <h4 className="font-medium text-gray-900 mb-2">{stage.name}</h4>
                          
                          <StatusBadge
                            status={
                              isCompleted ? '已完成' :
                              isInProgress ? '进行中' :
                              isSkipped ? '已跳过' :
                              '未开始'
                            }
                            color={
                              isCompleted ? 'green' :
                              isInProgress ? 'blue' :
                              isSkipped ? 'red' :
                              'gray'
                            }
                            size="sm"
                          />
                          
                          {stage.completedDate && (
                            <div className="text-xs text-gray-500 mt-2">
                              {stage.completedDate.toLocaleDateString('zh-CN')}
                            </div>
                          )}
                          
                          {/* 🔒 权限控制：收货确认节点只有采购专员可以操作 */}
                          {stage.name === '收货确认' && canCompleteReceiving(stage) && activeTab === 'in_progress' ? (
                            <button
                              onClick={() => handleCompleteStage(progress.id, stage.name)}
                              className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              title="采购专员专属：完成收货确认"
                            >
                              完成收货
                            </button>
                          ) : canComplete && stage.name !== '收货确认' && activeTab === 'in_progress' && (
                            <button
                              onClick={() => handleCompleteStage(progress.id, stage.name)}
                              className="mt-2 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              完成
                            </button>
                          )}
                          
                          {stage.name === '纸卡提供' && !isCompleted && canUpdateProgress && activeTab === 'in_progress' && (
                            <button
                              onClick={() => handleRequestCard(progress.purchaseRequestId)}
                              className="mt-2 px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                            >
                              催要纸卡
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">总金额:</span>
                      <span className="ml-2 font-medium text-gray-900">¥{request.totalAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">SKU数量:</span>
                      <span className="ml-2 font-medium text-gray-900">{request.items.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">创建时间:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {new Date(request.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">预计完成:</span>
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