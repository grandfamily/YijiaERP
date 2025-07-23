import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
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
  Upload,
  Bell,
  ArrowRight,
  Zap,
  DollarSign,
  ZoomIn
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { CardProgress as CardProgressType, CardProgressStage, OrderAllocation } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

interface CardProgressProps {
  embedded?: boolean;
  requestId?: string;
}

type TabType = 'incomplete' | 'completed';

export const CardProgress: React.FC<CardProgressProps> = ({ embedded = false, requestId }) => {
  const { user } = useAuth();
  const { 
    getCardProgressByRequestId,
    getCardProgress,
    getPurchaseRequests,
    getOrderAllocationByRequestId,
    getCardDeliveryReminders,
    updateCardProgress,
    updateCardProgressStage,
    checkAndUpdateCardProgressCompletion
  } = useProcurement();

  const [activeTab, setActiveTab] = useState<TabType>('incomplete');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingStage, setEditingStage] = useState<{progressId: string, stageId: string} | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 获取纸卡催付记录
  const cardDeliveryReminders = getCardDeliveryReminders();

  // 🎯 自动监控逻辑：每5秒检查一次纸卡进度状态
  useEffect(() => {
    // 立即执行一次检查
    checkAndUpdateCardProgressCompletion();
    
    // 设置定时器，每5秒检查一次
    const interval = setInterval(() => {
      checkAndUpdateCardProgressCompletion();
    }, 5000);

    // 清理定时器
    return () => clearInterval(interval);
  }, [checkAndUpdateCardProgressCompletion]);

  // 获取数据
  const allCardProgress = embedded && requestId 
    ? getCardProgressByRequestId(requestId) || []
    : getCardProgress() || [];
  
  const { data: purchaseRequests } = getPurchaseRequests();

  // Move getRequestInfo function here to avoid temporal dead zone
  const getRequestInfo = (requestId: string) => {
    return purchaseRequests.find(req => req.id === requestId);
  };

  // 按订单分组进度数据
  const progressByRequest = React.useMemo(() => {
    const grouped: { [key: string]: CardProgressType[] } = {};
    
    allCardProgress.forEach(progress => {
      if (!grouped[progress.purchaseRequestId]) {
        grouped[progress.purchaseRequestId] = [];
      }
      grouped[progress.purchaseRequestId].push(progress);
    });
    
    return grouped;
  }, [allCardProgress]);

  // 检查订单是否已完成
  const isOrderCompleted = (requestId: string): boolean => {
    const progressList = progressByRequest[requestId] || [];
    if (progressList.length === 0) return false;
    
    return progressList.every(progress => {
      return progress.stages.every(stage => stage.status === 'completed');
    });
  };

  // 根据搜索条件过滤订单
  const filteredProgressByRequest = React.useMemo(() => {
    const filtered: { [key: string]: CardProgressType[] } = {};
    
    Object.entries(progressByRequest).forEach(([requestId, progressList]) => {
      if (requestId && progressList) {
        const isCompleted = isOrderCompleted(requestId);
        
        // 根据标签页过滤
        if ((activeTab === 'completed' && isCompleted) || (activeTab === 'incomplete' && !isCompleted)) {
          // 如果有搜索条件，进一步过滤
          if (!searchTerm) {
            filtered[requestId] = progressList;
          } else {
            const request = getRequestInfo(requestId);
            const matchesSearch = request?.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
              progressList.some(progress => 
                progress.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                progress.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
            
            if (matchesSearch) {
              filtered[requestId] = progressList;
            }
          }
        }
      }
    });
    
    return filtered;
  }, [progressByRequest, activeTab, searchTerm, purchaseRequests]);

  // 获取订单分配信息
  const getOrderAllocation = (requestId: string): OrderAllocation | undefined => {
    return getOrderAllocationByRequestId(requestId);
  };

  // 获取纸卡类型显示文本
  const getCardTypeText = (cardType?: string) => {
    const typeMap = {
      'finished': '纸卡成品',
      'design': '设计稿',
      'none': '不需要'
    };
    return typeMap[cardType as keyof typeof typeMap] || '不需要';
  };

  // 处理阶段完成
  const handleCompleteStage = async (progressId: string, stageId: string) => {
    try {
      await updateCardProgressStage(progressId, stageId, {
        status: 'completed',
        completedDate: new Date()
      });
    } catch (error) {
      console.error('完成阶段失败:', error);
    }
  };

  // 处理批量完成阶段（针对单个订单的所有SKU）
  const handleBatchCompleteStage = async (requestId: string, stageName: string) => {
    try {
      const progressList = progressByRequest[requestId] || [];
      const updates = [];

      for (const progress of progressList) {
        const stage = progress.stages.find(s => s.name === stageName);
        if (stage && stage.status !== 'completed') {
          updates.push(updateCardProgressStage(progress.id, stage.id, {
            status: 'completed',
            completedDate: new Date()
          }));
        }
      }
      
      await Promise.all(updates);
    } catch (error) {
      console.error('批量完成阶段失败:', error);
      alert('批量完成失败，请重试');
    }
  };

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
    const allRequestIds = Object.keys(filteredProgressByRequest);
    setSelectedOrders(prev => 
      prev.length === allRequestIds.length ? [] : allRequestIds
    );
  };

  // 导出功能
  const exportData = () => {
    if (selectedOrders.length === 0) {
      alert('请先选择要导出的订单');
      return;
    }

    const exportData: any[] = [];
    
    selectedOrders.forEach(requestId => {
      const request = getRequestInfo(requestId);
      const progressList = filteredProgressByRequest[requestId] || [];
      
      progressList.forEach(progress => {
        progress.stages.forEach(stage => {
          exportData.push({
            '订单编号': request?.requestNumber || '',
            'SKU': progress.sku.code,
            '产品名称': progress.sku.name,
            '阶段名称': stage.name,
            '状态': stage.status === 'completed' ? '已完成' : 
                   stage.status === 'in_progress' ? '进行中' : '未开始',
            '开始日期': stage.startDate ? stage.startDate.toLocaleDateString('zh-CN') : '',
            '完成日期': stage.completedDate ? stage.completedDate.toLocaleDateString('zh-CN') : '',
            '预计耗时': stage.estimatedDuration + '天',
            '实际耗时': stage.actualDuration ? stage.actualDuration + '天' : '',
            '整体进度': progress.overallProgress + '%'
          });
        });
      });
    });

    // 转换为CSV并下载
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `纸卡进度_${activeTab === 'completed' ? '已完成' : '未完成'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    setSelectedOrders([]);
  };

  // 获取统计数据
  const getTabStats = () => {
    const allRequestIds = Object.keys(progressByRequest);
    const completedCount = allRequestIds.filter(requestId => isOrderCompleted(requestId)).length;
    const incompleteCount = allRequestIds.length - completedCount;
    
    return { incompleteCount, completedCount };
  };

  const tabStats = getTabStats();
  const canCardDesigner = user?.role === 'card_designer';

  // 处理图片点击放大
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };
  return (
    <>
      <div className={embedded ? "space-y-4" : "p-6 space-y-6"}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">纸卡进度</h1>
            <p className="text-gray-600">按订单管理纸卡设计和制作进度</p>
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
              <CreditCard className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">
                订单: {Object.keys(filteredProgressByRequest).length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 系统自动监控提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">系统自动监控</h3>
            <p className="text-sm text-blue-700 mt-1">
              系统将自动监控纸卡进度状态，当所有制作流程完成后，会自动联动采购进度中的"纸卡提供"节点
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {!embedded && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('incomplete')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'incomplete'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>未完成订单</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'incomplete' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.incompleteCount}
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
              <span>已完成订单</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.completedCount}
              </span>
            </button>
          </nav>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              {selectedOrders.length === Object.keys(filteredProgressByRequest).length && Object.keys(filteredProgressByRequest).length > 0 ? (
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
                onClick={exportData}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>导出选中 ({selectedOrders.length})</span>
              </button>
            )}
            <div className="text-sm text-gray-500">
              {activeTab === 'incomplete' ? '未完成订单：纸卡制作流程尚未全部完成' : '已完成订单：纸卡制作流程已全部完成'}
            </div>
          </div>
        </div>
      </div>

      {Object.keys(filteredProgressByRequest).length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'incomplete' ? '暂无未完成订单' : '暂无已完成订单'}
          </h3>
          <p className="text-gray-500">
            {activeTab === 'incomplete' ? '所有订单都已完成纸卡制作' : '还没有完成的纸卡订单'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredProgressByRequest).map(([requestId, progressList]) => {
            const request = getRequestInfo(requestId);
            const isSelected = selectedOrders.includes(requestId);
            const orderCompleted = isOrderCompleted(requestId);
            const allocation = getOrderAllocation(requestId);
            const reminderTime = cardDeliveryReminders[requestId];
            
            return (
              <div key={requestId} className={`bg-white rounded-lg shadow-sm border-2 transition-colors ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              } p-6`}>
                {/* Order Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleOrderSelection(requestId)}
                      className="flex items-center"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request?.requestNumber || requestId}
                    </h3>
                    <StatusBadge
                      status={allocation?.type === 'external' ? '厂家包装' : '自己包装'}
                      color={allocation?.type === 'external' ? 'blue' : 'green'}
                    />
                    <StatusBadge
                      status={getCardTypeText(allocation?.cardType)}
                      color="purple"
                    />
                    {orderCompleted && (
                      <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">纸卡制作已完成</span>
                      </div>
                    )}
                    {reminderTime && (
                      <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                        <Bell className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          催要时间: {reminderTime.toLocaleDateString('zh-CN')} {reminderTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {progressList.length} 个SKU
                    </div>
                  </div>
                </div>

                {/* Progress Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-3 font-medium text-gray-900 w-16">图片</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 w-32">SKU</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900 w-36">产品名称</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">数量</th>
                        {activeTab === 'incomplete' && (
                          <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">整体进度</th>
                        )}
                        {/* 动态生成流程节点列标题 */}
                        {progressList.length > 0 && progressList[0].stages.map((stage) => (
                          <th key={stage.id} className="text-center py-3 px-3 font-medium text-gray-900 w-20">
                            <span>{stage.name}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {progressList.map((progress) => {
                        const stages = progress.stages || [];
                        
                        return (
                          <tr key={progress.id} className="hover:bg-gray-50">
                            {/* Product Image */}
                            <td className="py-3 px-3">
                              {progress.sku?.imageUrl ? (
                                <div className="relative group">
                                  <img 
                                    src={progress.sku.imageUrl} 
                                    alt={progress.sku.name}
                                    className="w-10 h-10 object-cover rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleImageClick(progress.sku.imageUrl!)}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-md cursor-pointer"
                                       onClick={() => handleImageClick(progress.sku.imageUrl!)}>
                                    <ZoomIn className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-md border border-gray-200 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </td>
                            
                            {/* SKU Info */}
                            <td className="py-3 px-4">
                              <div className="font-semibold text-gray-900">{progress.sku?.code || 'N/A'}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-medium text-gray-900">{progress.sku?.name || 'N/A'}</div>
                              <div className="text-xs">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  {progress.sku?.category}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {progress.purchaseQuantity?.toLocaleString() || 0}
                            </td>
                            {/* Overall Progress */}
                            {activeTab === 'incomplete' && (
                              <td className="py-3 px-3 text-center">
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="text-sm font-bold text-blue-600">
                                    {progress.overallProgress}%
                                  </div>
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                      style={{ width: `${progress.overallProgress}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            )}
                            {/* Stage Progress */}
                            {stages.map((stage, stageIndex) => {
                              const isCompleted = stage.status === 'completed';
                              const isInProgress = stage.status === 'in_progress';
                              
                              // 检查是否可以完成当前阶段
                              const canComplete = canCardDesigner && 
                                activeTab === 'incomplete' && 
                                !isCompleted && 
                                (stageIndex === 0 || stages[stageIndex - 1]?.status === 'completed');
                              
                              return (
                                <td key={stage.id} className="py-3 px-3 text-center">
                                  <div className="flex flex-col items-center space-y-2">
                                    <StatusBadge
                                      status={isCompleted ? '已完成' : isInProgress ? '进行中' : '未开始'}
                                      color={isCompleted ? 'green' : isInProgress ? 'yellow' : 'gray'}
                                      size="sm"
                                    />
                                    {stage?.completedDate && (
                                      <div className="text-xs text-gray-500">
                                        {stage.completedDate.toLocaleDateString('zh-CN')}
                                      </div>
                                    )}
                                    {/* 完成按钮 */}
                                    {canComplete && (
                                      <button
                                        onClick={() => handleCompleteStage(progress.id, stage.id)}
                                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
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
                      
                      {/* Batch Complete Row */}
                      {canCardDesigner && activeTab === 'incomplete' && (
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
                          <td className="py-3 px-3 text-sm font-medium text-gray-700" colSpan={activeTab === 'incomplete' ? 5 : 4}>
                            批量操作
                          </td>
                          {/* 按顺序生成批量完成按钮 - 只有当前可操作节点显示按钮 */}
                          {progressList.length > 0 && progressList[0].stages.map((stage, stageIndex) => {
                            // 检查是否为当前可操作的节点 - 修正逻辑：检查所有SKU的状态
                            const isCurrentOperableStage = () => {
                              // 检查当前节点在所有SKU中的完成状态
                              const allSKUsCompletedForCurrentStage = progressList.every(progress => {
                                const currentStage = progress.stages[stageIndex];
                                return currentStage && currentStage.status === 'completed';
                              });
                              
                              // 如果是第一个节点
                              if (stageIndex === 0) {
                                // 第一个节点：只要有任何SKU未完成，就显示批量完成按钮
                                return !allSKUsCompletedForCurrentStage;
                              }
                              
                              // 检查前面所有节点在所有SKU中是否都已完成
                              const allPreviousStagesCompleted = () => {
                                for (let i = 0; i < stageIndex; i++) {
                                  const allSKUsCompletedForPrevStage = progressList.every(progress => {
                                    const prevStage = progress.stages[i];
                                    return prevStage && prevStage.status === 'completed';
                                  });
                                  if (!allSKUsCompletedForPrevStage) {
                                    return false;
                                  }
                                }
                                return true;
                              };
                              
                              // 当前节点可操作条件：
                              // 1. 前面所有节点在所有SKU中都已完成
                              // 2. 当前节点在所有SKU中还未全部完成
                              return allPreviousStagesCompleted() && !allSKUsCompletedForCurrentStage;
                            };
                            
                            // 检查当前节点在所有SKU中是否都已完成
                            const isAllSKUsCompleted = () => {
                              return progressList.every(progress => {
                                const currentStage = progress.stages[stageIndex];
                                return currentStage && currentStage.status === 'completed';
                              });
                            };
                            
                            const canOperate = isCurrentOperableStage();
                            const allCompleted = isAllSKUsCompleted();
                            
                            return (
                              <td key={stage.id} className="py-3 px-3 text-center">
                                {allCompleted ? (
                                  <span className="px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded-full border border-green-200 font-medium">
                                    已完成
                                  </span>
                                ) : canOperate ? (
                                  <button
                                    onClick={() => handleBatchCompleteStage(requestId, stage.name)}
                                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm border border-blue-700 font-medium"
                                    title={`批量完成所有SKU的"${stage.name}"阶段`}
                                  >
                                    批量完成
                                  </button>
                                ) : (
                                  <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 rounded-full border border-gray-200 font-medium">
                                    未开始
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

                {/* Order Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm flex-1">
                      <div>
                        <span className="text-gray-600">申请人:</span>
                        <span className="ml-2 font-medium text-gray-900">{request?.requester.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">总金额:</span>
                        <span className="ml-2 font-medium text-gray-900">¥{request?.totalAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">创建时间:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {request?.createdAt ? new Date(request.createdAt).toLocaleDateString('zh-CN') : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">订单状态:</span>
                        <span className="ml-2">
                          <StatusBadge
                            status={orderCompleted ? '已完成' : '进行中'}
                            color={orderCompleted ? 'green' : 'yellow'}
                            size="sm"
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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