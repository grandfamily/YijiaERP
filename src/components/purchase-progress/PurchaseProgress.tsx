import React, { useState } from 'react';
import { 
  FileText, 
  Package, 
  Search, 
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Square,
  CheckSquare,
  Download,
  Bell,
  ZoomIn,
  Truck,
  Factory,
  XCircle
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalStore } from '../../store/globalStore';
import { arrivalInspectionStore } from '../../store/arrivalInspection';
import { PurchaseRequest, OrderAllocation, ProcurementProgress, PaymentMethod, ProcurementProgressStage, RejectedOrder } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

type TabType = 'in_progress' | 'external_completed' | 'internal_completed' | 'failed_orders';

// 筛选选项类型
type PurchaseTypeFilter = 'all' | 'external' | 'in_house';
type DepositPaymentFilter = 'all' | 'no_deposit' | 'deposit_paid' | 'deposit_unpaid';
type FinalPaymentFilter = 'all' | 'no_final' | 'final_paid' | 'final_unpaid';

// 流程节点配置
const STAGE_ORDER = [
  '定金支付', '安排生产', '纸卡提供', '包装生产', 
  '尾款支付', '安排发货', '到货通知', '验收确认'
];

// 系统联动节点（不可手动操作）
const SYSTEM_LINKED_STAGES = ['定金支付', '纸卡提供', '尾款支付', '验收确认'];

// 采购专员可操作节点
const MANUAL_STAGES = ['安排生产', '包装生产', '安排发货', '到货通知'];

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

  // 节点完成状态管理
  const [stageCompletionStatus, setStageCompletionStatus] = useState<{[key: string]: {[key: string]: boolean}}>({});

  // 获取已分配的订单
  const { data: allocatedRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'updatedAt', direction: 'desc' }
  );

  // 获取所有订单分配信息
  const orderAllocations = getOrderAllocations();

  // 获取所有纸卡进度
  const cardProgressData = getCardProgress();

  // 获取所有采购进度
  const procurementProgressData = getProcurementProgress();

  // 🎯 从全局存储获取不合格订单
  const rejectedOrders = useGlobalStore(state => state.rejectedOrders);
  console.log('🎯 从全局存储获取的不合格订单数量:', rejectedOrders.length, '详情:', rejectedOrders);

  // 🎯 监听到货检验页面发送的不合格订单事件（保留向后兼容性）
  React.useEffect(() => {
    console.log('🎯 采购进度页面已挂载，开始监听不合格订单事件');
    
    const handleAddRejectedOrder = (event: CustomEvent) => {
      console.log('🎯 采购进度页面收到不合格订单事件:', event.detail);
      const rejectedOrderData = event.detail;
      
      // 创建RejectedOrder对象并直接保存到全局存储
      const newRejectedOrder: RejectedOrder = {
        id: `rejected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purchaseRequestId: rejectedOrderData.purchaseRequestId,
        skuId: rejectedOrderData.skuId,
        sku: rejectedOrderData.sku,
        purchaseRequestNumber: rejectedOrderData.purchaseRequestNumber,
        rejectionReason: rejectedOrderData.rejectionReason,
        rejectionDate: new Date(rejectedOrderData.rejectionDate),
        rejectedBy: rejectedOrderData.rejectedBy,
        inspectionNotes: rejectedOrderData.inspectionNotes,
        productType: rejectedOrderData.productType,
        processStatus: 'pending',
        createdAt: new Date(rejectedOrderData.createdAt)
      };
      
      // 保存到全局存储
      useGlobalStore.getState().addRejectedOrder(newRejectedOrder);
      console.log('🎯 已保存不合格订单到全局存储:', newRejectedOrder);
    };

    // 添加事件监听器
    window.addEventListener('addRejectedOrder', handleAddRejectedOrder as EventListener);
    console.log('🎯 事件监听器已添加');

    // 清理事件监听器
    return () => {
      window.removeEventListener('addRejectedOrder', handleAddRejectedOrder as EventListener);
      console.log('🎯 事件监听器已清理');
    };
  }, []);

  // 为没有采购进度的订单创建进度记录
  React.useEffect(() => {
    allocatedRequests.forEach(request => {
      const existingProgress = procurementProgressData.find(pp => pp.purchaseRequestId === request.id);
      if (!existingProgress) {
        createProcurementProgressForRequest(request);
      }
    });
  }, [allocatedRequests, procurementProgressData]);

  // 🎯 监听到货检验验收通过后的验收确认状态更新
  React.useEffect(() => {
    const handleAcceptanceStatusUpdate = (event: CustomEvent) => {
      const { purchaseRequestId, skuId, productType, status } = event.detail;
      
      console.log(`🎯 收到验收确认状态更新事件：订单 ${purchaseRequestId}, SKU ${skuId}, 状态 ${status}`);
      
      try {
        // 更新采购进度的验收确认状态为已完成
        updateProcurementProgressStage(purchaseRequestId, '验收确认', {
          status: 'completed',
          completedDate: new Date(),
          completedBy: user?.id || ''
        });
        
        // 根据产品类型触发SKU流转到对应的已完成页面
        if (productType === 'semi_finished') {
          console.log(`✅ 半成品验收通过：SKU ${skuId} 将流转到"自己包装已完成"页面`);
        } else if (productType === 'finished') {
          console.log(`✅ 成品验收通过：SKU ${skuId} 将流转到"厂家包装已完成"页面`);
        }
        
        // 显示成功提示
        setNotificationMessage(`验收确认自动完成！SKU已流转到${productType === 'semi_finished' ? '自己包装已完成' : '厂家包装已完成'}页面`);
        setTimeout(() => setNotificationMessage(null), 3000);
        
      } catch (error) {
        console.error('处理验收确认状态更新失败:', error);
      }
    };

    // 添加事件监听器
    window.addEventListener('update-acceptance-status', handleAcceptanceStatusUpdate as EventListener);
    
    // 清理函数
    return () => {
      window.removeEventListener('update-acceptance-status', handleAcceptanceStatusUpdate as EventListener);
    };
  }, [user?.id, updateProcurementProgressStage]);

  // 类型定义
  type StageStatus = 'not_started' | 'in_progress' | 'completed' | 'no_deposit_required';

  // 获取订单分配信息
  const getOrderAllocation = (requestId: string): OrderAllocation | undefined => {
    return orderAllocations.find(a => a.purchaseRequestId === requestId);
  };

  // 检查是否需要定金
  const needsDeposit = (requestId: string): boolean => {
    const allocation = getOrderAllocation(requestId);
    if (!allocation) return false;
    
    // 账期付款或定金金额为0时不需要定金
    return allocation.paymentMethod !== 'credit_terms' && (allocation.prepaymentAmount || 0) > 0;
  };

  // 检查付款是否已确认
  const isPaymentConfirmed = (requestId: string, type: 'deposit' | 'final'): boolean => {
    // 这里需要与财务模块联动，检查付款确认状态
    return false;
  };

  // 获取纸卡进度
  const getCardProgressByRequestId = (requestId: string) => {
    return cardProgressData.filter(cp => cp.purchaseRequestId === requestId);
  };

  // 检查SKU是否已完成所有流程
  const isSKUCompleted = (progress: ProcurementProgress): boolean => {
    return progress.stages.every(stage => stage.status === 'completed' || stage.status === 'skipped');
  };

  // 检查订单是否为厂家包装
  const isExternalPackaging = (requestId: string): boolean => {
    const allocation = getOrderAllocation(requestId);
    return allocation?.type === 'external';
  };

  // 检查订单是否为自己包装
  const isInternalPackaging = (requestId: string): boolean => {
    const allocation = getOrderAllocation(requestId);
    return allocation?.type === 'in_house';
  };

  // 检查是否为不合格订单（自己包装 + 验收不通过）
  const isFailedOrder = (requestId: string): boolean => {
    const request = getRequestInfo(requestId);
    const allocation = getOrderAllocation(requestId);
    
    // 自己包装 + 处于待验收环节 + 验收结果不通过
    return allocation?.type === 'in_house' && 
           request?.status === 'quality_check' && 
           false; // 这里需要根据实际的验收结果字段来判断
  };

  // 获取请求信息
  const getRequestInfo = (requestId: string) => {
    return allocatedRequests.find(r => r.id === requestId);
  };

  // 采购专员到货通知权限检查函数
  const canCompleteReceiving = (stage: ProcurementProgressStage): boolean => {
    // 只有采购专员可以完成"到货通知"节点
    return user?.role === 'purchasing_officer' && 
           stage.name === '到货通知' && 
           hasPermission('complete_receiving_confirmation');
  };

  // 权限检查函数 - 其他节点权限（保持原有逻辑）
  const canCompleteOtherStages = (stage: ProcurementProgressStage): boolean => {
    // 非到货通知节点的权限逻辑
    if (stage.name === '到货通知') {
      return false; // 到货通知只能由采购专员操作
    }
    
    // 其他节点的权限逻辑（根据实际需求调整）
    return user?.role === 'purchasing_officer' || 
           user?.role === 'department_manager' || 
           user?.role === 'general_manager';
  };

  // 获取节点状态
  const getStageStatus = (requestId: string, stageName: string): StageStatus => {
    // 特殊处理定金支付节点
    if (stageName === '定金支付') {
      if (!needsDeposit(requestId)) {
        return 'no_deposit_required';
      }
      // 检查是否已确认付款
      const isDepositPaid = isPaymentConfirmed(requestId, 'deposit');
      return isDepositPaid ? 'completed' : 'in_progress';
    }
    
    // 🎯 新增：验收确认节点特殊处理
    if (stageName === '验收确认') {
      // 检查本地完成状态
      if (stageCompletionStatus[requestId]?.[stageName]) {
        return 'completed';
      }
      
      // 检查前置节点"到货通知"是否完成
      const goodsReceiptCompleted = stageCompletionStatus[requestId]?.['到货通知'];
      if (goodsReceiptCompleted) {
        return 'in_progress';
      }
      
      return 'not_started';
    }
    
    // 检查本地状态
    if (stageCompletionStatus[requestId]?.[stageName]) {
      return 'completed';
    }
    
    // 检查系统联动状态
    if (stageName === '纸卡提供') {
      // 检查纸卡进度是否完成
      const cardProgress = getCardProgressByRequestId(requestId);
      if (cardProgress && cardProgress.length > 0) {
        const allCompleted = cardProgress.every(cp => cp.overallProgress === 100);
        if (allCompleted) return 'completed';
      }
    }
    
    if (stageName === '尾款支付') {
      // 检查尾款是否已确认
      const isFinalPaid = isPaymentConfirmed(requestId, 'final');
      return isFinalPaid ? 'completed' : 'not_started';
    }
    
    if (stageName === '验收确认') {
      // 检查验收是否完成
      const allocation = getOrderAllocation(requestId);
      if (allocation?.type === 'external') {
        // 厂家包装：检查验货入库状态
        // 这里需要与验货入库模块联动
        return 'not_started';
      } else {
        // 自己包装：检查自己包装验收状态
        // 这里需要与自己包装模块联动
        return 'not_started';
      }
    }
    
    // 检查前置节点状态决定当前节点状态
    const currentIndex = STAGE_ORDER.indexOf(stageName);
    if (currentIndex === 0) {
      // 第一个节点（定金支付）已在上面处理
      return 'not_started';
    }
    
    // 检查前一个节点是否完成
    const previousStage = STAGE_ORDER[currentIndex - 1];
    const previousStatus = getStageStatus(requestId, previousStage);
    
    if (previousStatus === 'completed' || previousStatus === 'no_deposit_required') {
      // 特殊处理：验收确认需要等待到货通知完成
      if (stageName === '验收确认') {
        const goodsReceiptStatus = stageCompletionStatus[requestId]?.['到货通知'];
        return goodsReceiptStatus ? 'in_progress' : 'not_started';
      }
      return 'in_progress';
    }
    
    return 'not_started';
  };

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

  // 获取采购进度信息
  const getProcurementProgressByRequest = (requestId: string) => {
    return procurementProgressData.find(p => p.purchaseRequestId === requestId);
  };

  // 检查是否可以操作节点
  const canOperateStage = (requestId: string, stageName: string): boolean => {
    const stageStatus = getStageStatus(requestId, stageName);
    return stageStatus === 'in_progress';
  };

  // 检查是否可以批量操作
  const canBatchOperate = (stageName: string): boolean => {
    return selectedOrders.every(requestId => canOperateStage(requestId, stageName));
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
    let requests: any[] = [];
    
    switch (activeTab) {
      case 'in_progress':
        // 获取所有进度记录
        const allProgress = procurementProgressData;
        const filtered = allProgress.filter(progress => !isSKUCompleted(progress));
        const requestIds = filtered.map(p => p.purchaseRequestId);
        requests = allocatedRequests.filter(request => requestIds.includes(request.id));
        break;
      case 'external_completed':
        const externalProgress = procurementProgressData.filter(progress => 
          isSKUCompleted(progress) && isExternalPackaging(progress.purchaseRequestId)
        );
        const externalRequestIds = externalProgress.map(p => p.purchaseRequestId);
        requests = allocatedRequests.filter(request => externalRequestIds.includes(request.id));
        break;
      case 'internal_completed':
        const internalProgress = procurementProgressData.filter(progress => 
          isSKUCompleted(progress) && isInternalPackaging(progress.purchaseRequestId)
        );
        const internalRequestIds = internalProgress.map(p => p.purchaseRequestId);
        requests = allocatedRequests.filter(request => internalRequestIds.includes(request.id));
        break;
      case 'failed_orders':
        // 直接使用rejectedOrders状态
        requests = rejectedOrders;
        break;
      default:
        const defaultProgress = procurementProgressData;
        const defaultRequestIds = defaultProgress.map(p => p.purchaseRequestId);
        requests = allocatedRequests.filter(request => defaultRequestIds.includes(request.id));
    }

    // 应用搜索过滤
    const searchFiltered = requests.filter(request => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        request.requestNumber?.toLowerCase().includes(searchLower) ||
        request.orderNumber?.toLowerCase().includes(searchLower) ||
        request.items?.some((item: any) => 
          item.sku?.code?.toLowerCase().includes(searchLower) ||
          item.sku?.name?.toLowerCase().includes(searchLower)
        ) ||
        request.supplierName?.toLowerCase().includes(searchLower) ||
        (request as any).rejectedReason?.toLowerCase().includes(searchLower)
      );
    });

    // 应用筛选条件
    return applyFilters(searchFiltered);
  };

  const filteredRequests = getTabFilteredRequests();

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
    return matchesSearch && ((activeTab === 'external_completed' && isCompleted) || (activeTab === 'in_progress' && !isCompleted));
  });

  // 检查采购是否已完成
  function isProcurementCompleted(requestId: string): boolean {
    const progress = procurementProgressData.find(p => p.purchaseRequestId === requestId);
    return progress ? progress.stages.every(s => s.status === 'completed' || s.status === 'skipped') : false;
  }

  // 处理SKU级别完成（新增）
  const handleSKUComplete = async (requestId: string, itemId: string) => {
    try {
      // 将SKU标记为已完成
      const skuKey = `${requestId}-${itemId}`;
      setCompletedSKUs(prev => new Set([...prev, skuKey]));
      
      // 显示成功提示
      setNotificationMessage('SKU到货通知已完成，已移至已完成栏目');
      setTimeout(() => setNotificationMessage(null), 3000);
      
      console.log(`✅ SKU完成：订单 ${requestId} 的 SKU ${itemId} 已完成到货通知`);
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
    
    // 检查到货通知节点是否为进行中
    const receiptStage = progress.stages.find((stage: any) => stage.name === '到货通知');
    
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
        await updateProcurementProgressStage(requestId, '到货通知', {
          status: 'completed',
          completedDate: new Date()
        });
        
        alert('到货通知完成！SKU已移至已完成栏目。');
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
          alert(`到货通知完成！按实际到货数量(${arrivalQty})完成。`);
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

  // 处理节点完成
  const handleStageComplete = async (requestId: string, stageName: string) => {
    if (!canOperateStage(requestId, stageName)) {
      setNotificationMessage('该节点当前不可操作');
      setTimeout(() => setNotificationMessage(null), 3000);
      return;
    }
    
    try {
      const progress = getProcurementProgressByRequest(requestId);
      if (!progress) return;

      await updateProcurementProgressStage(progress.id, stageName, {
        status: 'completed',
        completedDate: new Date()
      });

      // 更新本地状态
      setStageCompletionStatus(prev => ({
        ...prev,
        [requestId]: {
          ...prev[requestId],
          [stageName]: true
        }
      }));
      
      // 🎯 新增：到货通知完成后，自动将验收确认设为进行中
      if (stageName === '到货通知') {
        // 自动设置验收确认为进行中状态
        setTimeout(() => {
          setNotificationMessage('到货通知完成！验收确认节点已自动进入"进行中"状态');
          setTimeout(() => setNotificationMessage(null), 3000);
        }, 500);
      }
      
      // 🎯 新增：验收确认完成提示
      if (stageName === '验收确认') {
        setNotificationMessage('验收确认完成！该SKU的采购流程已全部完成');
        setTimeout(() => setNotificationMessage(null), 3000);
      }
      
      setNotificationMessage(`${stageName}节点完成成功！`);
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (error) {
      console.error('完成节点失败:', error);
      setNotificationMessage('操作失败，请重试');
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  // 处理阶段完成
  const handleCompleteStage = async (requestId: string, stageName: string) => {
    try {
      // 到货通知节点的特殊权限检查
      if (stageName === '到货通知' && user?.role !== 'purchasing_officer') {
        alert('权限不足：只有采购专员可以完成到货通知操作');
        return;
      }
      
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
      
      // 权限验证
      const stage = progress.stages.find(s => s.name === stageName);
      if (!stage) return;
      
      // 检查到货通知权限
      if (stageName === '到货通知' && !canCompleteReceiving(stage)) {
        alert('权限不足：只有采购专员可以完成到货通知操作');
        return;
      }
      
      // 检查其他节点权限
      if (stageName !== '到货通知' && !canCompleteOtherStages(stage)) {
        alert('权限不足：您没有权限完成此操作');
        return;
      }

      await updateProcurementProgressStage(progress.id, stageName, {
        status: 'completed',
        completedDate: new Date()
      });

      setNotificationMessage(`已完成"${stageName}"阶段`);
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (error) {
      console.error('完成阶段失败:', error);
      alert('操作失败，请重试');
      setNotificationMessage('操作失败，请重试');
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  // 处理批量完成节点
  const handleBatchCompleteStage = async (stageName: string) => {
    if (selectedOrders.length === 0) {
      setNotificationMessage('请先选择要操作的订单');
      setTimeout(() => setNotificationMessage(null), 3000);
      return;
    }
    
    if (!canBatchOperate(stageName)) {
      setNotificationMessage('选中的订单中有些不满足操作条件');
      setTimeout(() => setNotificationMessage(null), 3000);
      return;
    }

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

      // 更新本地状态
      const newStageStatus = { ...stageCompletionStatus };
      selectedOrders.forEach(requestId => {
        if (!newStageStatus[requestId]) {
          newStageStatus[requestId] = {};
        }
        newStageStatus[requestId][stageName] = true;
      });
      setStageCompletionStatus(newStageStatus);

      // 🎯 新增：到货通知批量完成后的自动流转逻辑
      if (stageName === '到货通知') {
        // 1. 批量设置验收确认为进行中状态（已有逻辑保持不变）
        
        // 2. 🎯 新增：联动到货检验的"是否有货"状态
        try {
          // 按包装类型分组处理
          const externalRequests: string[] = [];
          const internalRequests: string[] = [];
          
          selectedOrders.forEach(requestId => {
            const allocation = getOrderAllocation(requestId);
            if (allocation?.type === 'external') {
              externalRequests.push(requestId);
            } else {
              internalRequests.push(requestId);
            }
          });
          
          // 批量更新厂家包装订单的到货状态
          if (externalRequests.length > 0) {
            arrivalInspectionStore.handleArrivalNotificationBatchComplete(
              externalRequests, 
              'finished'
            );
          }
          
          // 批量更新自己包装订单的到货状态  
          if (internalRequests.length > 0) {
            arrivalInspectionStore.handleArrivalNotificationBatchComplete(
              internalRequests, 
              'semi_finished'
            );
          }
          
          console.log(`✅ 到货通知批量完成：已联动到货检验，厂家包装${externalRequests.length}个，自己包装${internalRequests.length}个`);
        } catch (error) {
          console.error('联动到货检验失败:', error);
        }
        
        setTimeout(() => {
          const completedCount = selectedOrders.length;
          setNotificationMessage(`到货通知批量完成成功！已有 ${completedCount} 个订单的验收确认节点进入"进行中"状态，到货检验状态已同步更新`);
          setTimeout(() => setNotificationMessage(null), 3000);
        }, 500);
      }
      
      // 🎯 新增：验收确认批量完成提示
      if (stageName === '验收确认') {
        const completedCount = selectedOrders.length;
        setNotificationMessage(`验收确认批量完成成功！已有 ${completedCount} 个订单的采购流程全部完成`);
        setTimeout(() => setNotificationMessage(null), 3000);
        
        // 清空选择，因为订单已完成
        setSelectedOrders([]);
        return;
      }

      setSelectedOrders([]);
      
      // 显示成功通知
      const completedCount = selectedOrders.length;
      setNotificationMessage(`${stageName}节点批量完成成功！已完成 ${completedCount} 个订单的${stageName}节点`);
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (error) {
      console.error('批量完成失败:', error);
      setNotificationMessage('批量完成失败，请重试');
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
    const allProgress = procurementProgressData;
    const inProgress = allProgress.filter(progress => !isSKUCompleted(progress)).length;
    const externalCompleted = allProgress.filter(progress => 
      isSKUCompleted(progress) && isExternalPackaging(progress.purchaseRequestId)
    ).length;
    const internalCompleted = allProgress.filter(progress => 
      isSKUCompleted(progress) && isInternalPackaging(progress.purchaseRequestId)
    ).length;
    // 🎯 使用不合格订单数组的长度
    const failedOrders = rejectedOrders.length;
    
    return { inProgress, externalCompleted, internalCompleted, failedOrders };
  };

  const tabStats = getTabStats();

  // 处理到货数量更新
  const handleArrivalQuantityUpdate = async (progressId: string, itemId: string, arrivalQuantity: number) => {
    try {
      // 这里可以添加更新到货数量的逻辑
      console.log(`更新SKU ${itemId} 的到货数量为: ${arrivalQuantity}`);
      // 在实际应用中，这里会调用API更新数据
    } catch (error) {
      console.error('更新到货数量失败:', error);
      alert('更新到货数量失败，请重试');
    }
  };

  // 渲染标签页内容
  // const renderTabContent = () => {
  //   switch (activeTab) {
  //     case 'in_progress':
  //       return renderInProgressTab();
  //     case 'external_completed':
  //       return renderExternalCompletedTab();
  //     case 'in_house_completed':
  //       return renderCompletedTab('in_house');
  //     case 'failed_orders':
  //       return renderFailedOrdersTab();
  //     default:
  //       return renderInProgressTab();
  //   }
  // };

  // 渲染不合格订单标签页
  const renderFailedOrdersTab = () => {
    console.log('🎯 渲染不合格订单标签页，当前订单数量:', rejectedOrders.length);
    console.log('🎯 不合格订单详情:', rejectedOrders);
    
    return (
      <div className="space-y-6">
        {rejectedOrders.length === 0 ? (
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">没有验收不通过的订单</p>
            <p className="text-sm text-gray-500 mt-2">
              当前不合格订单数量: {rejectedOrders.length}
            </p>
          </div>
        ) : (
          rejectedOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{order.purchaseRequestNumber}</h3>
                  <p className="text-sm text-gray-600 mt-1">SKU: {order.sku.code}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    验收不通过
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">产品名称</span>
                  <p className="font-medium">{order.sku.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">不合格原因</span>
                  <p className="font-medium">{order.rejectionReason}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">拒收时间</span>
                  <p className="font-medium">{order.rejectionDate ? new Date(order.rejectionDate).toLocaleDateString() : '未知'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">处理状态</span>
                  <p className="font-medium">
                    {order.processStatus === 'pending' ? '待处理' :
                     order.processStatus === 'processing' ? '处理中' :
                     order.processStatus === 'completed' ? '已完成' : '未知'}
                  </p>
                </div>
              </div>
              
              {order.inspectionNotes && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-500">检验备注</span>
                  <p className="text-sm text-gray-700 mt-1">{order.inspectionNotes}</p>
                </div>
              )}
              
              <div className="mt-4 flex items-center space-x-4">
                <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <FileText className="h-4 w-4" />
                  <span>查看详情</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                  <span>处理完成</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // 渲染厂家包装已完成标签页（SKU维度）
  const renderExternalCompletedTab = () => {
    // 获取厂家包装已完成的SKU数据
    const externalCompletedSKUs = getExternalCompletedSKUs();

    if (externalCompletedSKUs.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无厂家包装已完成的SKU</h3>
          <p className="text-gray-600">还没有完成的厂家包装SKU</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900 w-32">订单编号</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 w-20">商品图片</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 w-24">SKU编码</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 w-40">品名</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">采购数量</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 w-32">完成时间</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 w-32">到货数量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {externalCompletedSKUs.map((skuData) => {
                const { progress, item, request } = skuData;
                const completedStage = progress.stages.find(s => s.status === 'completed' && s.completedDate);
                const completedDate = completedStage?.completedDate || progress.updatedAt;
                
                return (
                  <tr key={`${progress.id}-${item.id}`} className="hover:bg-gray-50">
                    {/* 订单编号 */}
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-blue-600">{request.requestNumber}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    
                    {/* 商品图片 */}
                    <td className="py-4 px-4 text-center">
                      {item.sku.imageUrl ? (
                        <div className="relative group inline-block">
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
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    
                    {/* SKU编码 */}
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-gray-900">{item.sku.code}</div>
                      <div className="text-xs text-gray-500">{item.sku.category}</div>
                    </td>
                    
                    {/* 品名 */}
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900 font-medium">{item.sku.name}</div>
                      <div className="text-xs text-gray-500 truncate">{item.sku.englishName}</div>
                    </td>
                    
                    {/* 采购数量 */}
                    <td className="py-4 px-4 text-center">
                      <div className="text-sm font-bold text-gray-900">{item.quantity.toLocaleString()}</div>
                    </td>
                    
                    {/* 完成时间 */}
                    <td className="py-4 px-4 text-center">
                      <div className="text-sm text-gray-900">
                        {completedDate.toLocaleDateString('zh-CN')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {completedDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    
                    {/* 到货数量（可编辑） */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          defaultValue={item.quantity}
                          className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="数量"
                          onBlur={(e) => {
                            const arrivalQuantity = parseInt(e.target.value) || 0;
                            if (arrivalQuantity !== item.quantity) {
                              handleArrivalQuantityUpdate(progress.id, item.id, arrivalQuantity);
                            }
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const arrivalQuantity = parseInt((e.target as HTMLInputElement).value) || 0;
                              handleArrivalQuantityUpdate(progress.id, item.id, arrivalQuantity);
                            }
                          }}
                        />
                        <div className="text-xs text-gray-500">
                          最大: {item.quantity.toLocaleString()}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* 统计信息 */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>共 {externalCompletedSKUs.length} 个已完成的厂家包装SKU</span>
            <span>
              总采购数量: {externalCompletedSKUs.reduce((sum, skuData) => sum + skuData.item.quantity, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // 获取厂家包装已完成的SKU数据
  const getExternalCompletedSKUs = () => {
    const skuData: Array<{
      progress: any;
      item: any;
      request: any;
    }> = [];

    // 遍历所有采购进度
    procurementProgressData.forEach(progress => {
      const request = allocatedRequests.find(req => req.id === progress.purchaseRequestId);
      if (!request) return;

      // 检查是否为厂家包装且已完成
      const allocation = getOrderAllocation(progress.purchaseRequestId);
      const isExternalPackaging = allocation?.type === 'external';
      const isCompleted = progress.stages.every(stage => stage.status === 'completed');

      if (isExternalPackaging && isCompleted) {
        // 为每个SKU创建一条记录
        request.items.forEach(item => {
          skuData.push({
            progress,
            item,
            request
          });
        });
      }
    });

    return skuData;
  };

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
            onClick={() => setActiveTab('external_completed')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'external_completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Truck className="h-5 w-5" />
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
            <Factory className="h-5 w-5" />
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
            {activeTab === 'in_progress' ? '进行中订单：采购流程尚未全部完成' : 
             activeTab === 'external_completed' ? '厂家包装已完成订单' :
             activeTab === 'internal_completed' ? '自己包装已完成订单' :
             '不合格订单：验收不通过的订单'}
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
            {activeTab === 'in_progress' ? '没有进行中的采购订单' : 
             activeTab === 'external_completed' ? '没有厂家包装已完成的采购订单' :
             activeTab === 'internal_completed' ? '没有自己包装已完成的采购订单' :
             '没有不合格订单'}
          </h3>
          <p className="text-gray-600">
            {activeTab === 'in_progress' ? '所有采购都已完成' : 
             activeTab === 'external_completed' ? '还没有厂家包装完成的订单' :
             activeTab === 'internal_completed' ? '还没有自己包装完成的订单' :
             '没有验收不通过的订单'}
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
                { id: '7', name: '到货通知', status: 'not_started', order: 7 }
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
                    {activeTab === 'failed_orders' && (
                      <StatusBadge
                        status="验收不通过"
                        color="red"
                      />
                    )}
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
                      <span className="font-medium">总金额:</span> ¥{(request.totalAmount || 0).toLocaleString()}
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
                          <th className="text-center py-3 px-4 font-medium text-gray-900">到货通知</th>
                          <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">验收确认</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(request.items || []).map((item) => {
                          const cardProgress = cardProgressData.find(cp => 
                            cp.purchaseRequestId === request.id && cp.skuId === item.skuId
                          );
                          
                          // 计算单个SKU进度 - 如果SKU已完成则显示100%
                          const skuCompleted = completedSKUs.has(`${request.id}-${item.id}`);
                          const skuProgressPercentage = skuCompleted ? 100 : progressPercentage;
                          
                          // 检查SKU是否应该显示在当前栏目
                          const shouldShowInCurrentTab = activeTab === 'external_completed' ? skuCompleted : !skuCompleted;
                          
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
                                        effectiveStageStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                        effectiveStageStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                        effectiveStageStatus === 'skipped' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {getStatusText(effectiveStageStatus)}
                                      </div>
                                      
                                      {/* Completion Date */}
                                      {effectiveCompletedDate && (
                                        <div className="text-xs text-gray-500">
                                          {effectiveCompletedDate.toLocaleDateString('zh-CN')}
                                        </div>
                                      )}
                                      
                                      {/* SKU级别完成按钮 - 仅在到货通知节点且状态为进行中时显示 */}
                                      {stage.name === '到货通知' && 
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
                        }).filter(Boolean)}
                        
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

                              // 到货通知节点的权限控制
                              const renderStageButton = (stage: any, progress: any) => {
                                if (stage.name === '到货通知') {
                                  // 只有采购专员可以看到和操作到货通知按钮
                                  if (!canCompleteReceiving(stage)) {
                                    return null; // 其他角色不显示按钮
                                  }
                                  
                                  return (
                                    <button
                                      onClick={() => handleCompleteStage(progress.id, stage.name)}
                                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                      title="采购专员专属：完成到货通知"
                                    >
                                      完成
                                    </button>
                                  );
                                }
                                
                                // 其他节点的按钮显示
                                if (canCompleteOtherStages(stage)) {
                                  return (
                                    <button
                                      onClick={() => handleCompleteStage(progress.id, stage.name)}
                                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                    >
                                      完成
                                    </button>
                                  );
                                }
                                
                                return null;
                              };

                              return (
                                <td key={stage.id} className="py-3 px-4 text-center">
                                  {isCompleted ? (
                                    <span className="px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded-full border border-green-200 font-medium">
                                      已完成
                                    </span>
                                  ) : stage.name === '验收确认' ? (
                                    // 验收确认节点显示实际状态
                                    (() => {
                                      const acceptanceStatus = getStageStatus(request.id, '验收确认');
                                      let statusText = '未开始';
                                      let statusColorClass = 'bg-gray-100 text-gray-500';
                                      
                                      if (acceptanceStatus === 'completed') {
                                        statusText = '已完成';
                                        statusColorClass = 'bg-green-100 text-green-800';
                                      } else if (acceptanceStatus === 'in_progress') {
                                        statusText = '进行中';
                                        statusColorClass = 'bg-blue-100 text-blue-800';
                                      } else {
                                        statusText = '未开始';
                                        statusColorClass = 'bg-gray-100 text-gray-500';
                                      }
                                      
                                      return (
                                        <span className={`px-3 py-1.5 text-xs rounded-full border font-medium ${statusColorClass}`}>
                                          {statusText}
                                        </span>
                                      );
                                    })()
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
                                      {!['定金支付', '纸卡提供', '尾款支付', '验收确认'].includes(stage.name) && (
                                        <button
                                          onClick={() => handleCompleteStage(request.id, stage.name)}
                                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                          批量完成
                                        </button>
                                      )}
                                      {/* 验收确认节点系统联动提示 */}
                                      {stage.name === '验收确认' && (
                                        <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 rounded-full border border-gray-200 font-medium">
                                          系统联动
                                        </span>
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