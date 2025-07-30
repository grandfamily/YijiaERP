import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  Package, 
  Search, 
  Eye, 
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
  ZoomIn,
  Truck,
  Factory
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseRequest, ProcurementProgressStage } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

type TabType = 'in_progress' | 'external_completed' | 'in_house_completed' | 'non_conforming';

export const PurchaseProgress: React.FC = () => {
  const { user } = useAuth();
  const { 
    getPurchaseRequests,
    getProcurementProgress,
    getProcurementProgressByRequestId,
    updateProcurementProgressStage,
    getOrderAllocations,
    getOrderAllocationByRequestId
  } = useProcurement();

  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [completedSKUs, setCompletedSKUs] = useState<{[key: string]: {
    type: 'external' | 'in_house';
    completedAt: Date;
    status: 'completed' | 'non_conforming';
  }}>({});

  // 获取已分配的订单
  const { data: allocatedRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'updatedAt', direction: 'desc' }
  );

  const orderAllocations = getOrderAllocations();
  const procurementProgressData = getProcurementProgress();

  // 获取订单的分配信息
  const getOrderAllocation = (requestId: string) => {
    return getOrderAllocationByRequestId(requestId);
  };

  // 检查是否为采购专员
  const isPurchasingOfficer = user?.role === 'purchasing_officer';

  // 🎯 新的流程节点定义
  const getProgressStages = (allocationType: 'external' | 'in_house'): ProcurementProgressStage[] => {
    const commonStages = [
      { id: 'stage-1', name: '定金支付', status: 'completed', order: 1 },
      { id: 'stage-2', name: '纸卡提供', status: 'completed', order: 2 },
      { id: 'stage-3', name: '辅料提供', status: 'completed', order: 3 },
      { id: 'stage-4', name: '尾款支付', status: 'completed', order: 4 },
      { id: 'stage-5', name: '到货确认', status: 'not_started', order: 5 },
      { id: 'stage-6', name: '验收确认', status: 'not_started', order: 6 }
    ];

    return commonStages.map(stage => ({
      ...stage,
      completedDate: stage.status === 'completed' ? new Date() : undefined,
      estimatedDuration: 1,
      remarks: ''
    }));
  };

  // 处理到货确认批量完成
  const handleArrivalConfirmationBatch = async (requestId: string) => {
    try {
      const allocation = getOrderAllocation(requestId);
      if (!allocation) return;

      // 完成"到货确认"节点
      await updateProcurementProgressStage(requestId, '到货确认', {
        status: 'completed',
        completedDate: new Date(),
        remarks: '采购专员批量确认到货'
      });

      // 如果是厂家包装，SKU自动进入验货入库的待验收
      if (allocation.type === 'external') {
        console.log(`🔄 厂家包装订单 ${requestId} 到货确认完成，SKU自动进入验货入库待验收`);
        // 这里应该调用验货入库模块的接口，将SKU添加到待验收列表
        // 实际实现中需要与验货入库模块进行数据同步
      }

    } catch (error) {
      console.error('到货确认批量完成失败:', error);
      alert('到货确认失败，请重试');
    }
  };

  // 🎯 监听自己包装的验收结果
  useEffect(() => {
    // 这里应该监听自己包装模块的验收结果
    // 当生产人员在"自己包装">"待验收SKU"中操作时，更新对应的状态
    
    // 模拟监听逻辑（实际应该通过事件系统或状态管理实现）
    const handleInHouseInspectionResult = (skuId: string, result: 'passed' | 'failed') => {
      const [requestId] = skuId.split('-');
      
      if (result === 'passed') {
        // 验收通过：完成"验收确认"节点
        updateProcurementProgressStage(requestId, '验收确认', {
          status: 'completed',
          completedDate: new Date(),
          remarks: '生产人员验收通过'
        });

        // 标记SKU为已完成
        setCompletedSKUs(prev => ({
          ...prev,
          [skuId]: {
            type: 'in_house',
            completedAt: new Date(),
            status: 'completed'
          }
        }));
      } else {
        // 验收不合格：标记为不合格
        setCompletedSKUs(prev => ({
          ...prev,
          [skuId]: {
            type: 'in_house',
            completedAt: new Date(),
            status: 'non_conforming'
          }
        }));
      }
    };

    // 实际实现中应该注册事件监听器
    // eventBus.on('inhouse-inspection-result', handleInHouseInspectionResult);
    
    // 清理函数
    // return () => eventBus.off('inhouse-inspection-result', handleInHouseInspectionResult);
  }, [updateProcurementProgressStage]);

  // 🎯 监听验货入库的验收完成
  useEffect(() => {
    // 监听验货入库模块的验收完成事件
    const handleQualityControlComplete = (skuId: string) => {
      const [requestId] = skuId.split('-');
      
      // 完成"验收确认"节点
      updateProcurementProgressStage(requestId, '验收确认', {
        status: 'completed',
        completedDate: new Date(),
        remarks: '仓管人员验收完成'
      });

      // 标记SKU为已完成
      setCompletedSKUs(prev => ({
        ...prev,
        [skuId]: {
          type: 'external',
          completedAt: new Date(),
          status: 'completed'
        }
      }));
    };

    // 实际实现中应该注册事件监听器
    // eventBus.on('quality-control-complete', handleQualityControlComplete);
    
    // 清理函数
    // return () => eventBus.off('quality-control-complete', handleQualityControlComplete);
  }, [updateProcurementProgressStage]);

  // 检查订单是否所有SKU都已完成
  const isOrderAllSKUsCompleted = (request: PurchaseRequest): boolean => {
    return request.items.every(item => {
      const skuId = `${request.id}-${item.id}`;
      const completedSKU = completedSKUs[skuId];
      return completedSKU && completedSKU.status === 'completed';
    });
  };

  // 检查订单是否有不合格SKU
  const hasNonConformingSKUs = (request: PurchaseRequest): boolean => {
    return request.items.some(item => {
      const skuId = `${request.id}-${item.id}`;
      const completedSKU = completedSKUs[skuId];
      return completedSKU && completedSKU.status === 'non_conforming';
    });
  };

  // 根据标签页过滤数据
  const getFilteredData = () => {
    let filtered: any[] = [];

    switch (activeTab) {
      case 'in_progress':
        // 进行中：以订单为维度，排除所有SKU都已完成的订单
        filtered = allocatedRequests.filter(request => 
          !isOrderAllSKUsCompleted(request) && !hasNonConformingSKUs(request)
        );
        break;
        
      case 'external_completed':
        // 厂家包装已完成：以SKU为维度
        filtered = [];
        allocatedRequests.forEach(request => {
          const allocation = getOrderAllocation(request.id);
          if (allocation?.type === 'external') {
            request.items.forEach(item => {
              const skuId = `${request.id}-${item.id}`;
              const completedSKU = completedSKUs[skuId];
              if (completedSKU && completedSKU.status === 'completed') {
                filtered.push({
                  ...item,
                  requestId: request.id,
                  requestNumber: request.requestNumber,
                  request,
                  completedAt: completedSKU.completedAt,
                  type: 'sku'
                });
              }
            });
          }
        });
        break;
        
      case 'in_house_completed':
        // 自己包装已完成：以SKU为维度
        filtered = [];
        allocatedRequests.forEach(request => {
          const allocation = getOrderAllocation(request.id);
          if (allocation?.type === 'in_house') {
            request.items.forEach(item => {
              const skuId = `${request.id}-${item.id}`;
              const completedSKU = completedSKUs[skuId];
              if (completedSKU && completedSKU.status === 'completed') {
                filtered.push({
                  ...item,
                  requestId: request.id,
                  requestNumber: request.requestNumber,
                  request,
                  completedAt: completedSKU.completedAt,
                  type: 'sku'
                });
              }
            });
          }
        });
        break;
        
      case 'non_conforming':
        // 不合格订单：以SKU为维度
        filtered = [];
        allocatedRequests.forEach(request => {
          request.items.forEach(item => {
            const skuId = `${request.id}-${item.id}`;
            const completedSKU = completedSKUs[skuId];
            if (completedSKU && completedSKU.status === 'non_conforming') {
              filtered.push({
                ...item,
                requestId: request.id,
                requestNumber: request.requestNumber,
                request,
                completedAt: completedSKU.completedAt,
                type: 'sku'
              });
            }
          });
        });
        break;
    }

    // 搜索过滤
    return filtered.filter(item => {
      if (activeTab === 'in_progress') {
        return !searchTerm || 
          item.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.items.some((skuItem: any) => 
            skuItem.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            skuItem.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
      } else {
        return !searchTerm || 
          item.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.name.toLowerCase().includes(searchTerm.toLowerCase());
      }
    });
  };

  const filteredData = getFilteredData();

  // 获取进度百分比
  const getProgressPercentage = (requestId: string): number => {
    const progress = getProcurementProgressByRequestId(requestId);
    return progress ? progress.overallProgress : 0;
  };

  // 检查节点是否可以批量完成
  const canBatchComplete = (requestId: string, stageName: string): boolean => {
    if (!isPurchasingOfficer) return false;
    
    const progress = getProcurementProgressByRequestId(requestId);
    if (!progress) return false;
    
    const stage = progress.stages.find(s => s.name === stageName);
    return stage ? stage.status !== 'completed' : false;
  };

  // 处理图片点击
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 获取统计数据
  const getTabStats = () => {
    const inProgress = allocatedRequests.filter(request => 
      !isOrderAllSKUsCompleted(request) && !hasNonConformingSKUs(request)
    ).length;
    
    const externalCompleted = Object.values(completedSKUs).filter(sku => 
      sku.type === 'external' && sku.status === 'completed'
    ).length;
    
    const inHouseCompleted = Object.values(completedSKUs).filter(sku => 
      sku.type === 'in_house' && sku.status === 'completed'
    ).length;
    
    const nonConforming = Object.values(completedSKUs).filter(sku => 
      sku.status === 'non_conforming'
    ).length;
    
    return { inProgress, externalCompleted, inHouseCompleted, nonConforming };
  };

  const tabStats = getTabStats();

  // 渲染进行中订单（以订单为维度）
  const renderInProgressOrders = () => (
    <div className="space-y-6">
      {filteredData.map((request) => {
        const allocation = getOrderAllocation(request.id);
        const progressPercentage = getProgressPercentage(request.id);
        const progress = getProcurementProgressByRequestId(request.id);
        const stages = progress?.stages || getProgressStages(allocation?.type || 'external');
        
        return (
          <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Order Header */}
            <div className="flex items-center justify-between mb-6">
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
                {request.items.length} 个SKU
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">采购进度</span>
                <span className="text-sm text-gray-600">{progressPercentage}%</span>
              </div>
              <ProgressBar 
                progress={progressPercentage}
                color={progressPercentage === 100 ? 'green' : progressPercentage > 50 ? 'blue' : 'yellow'}
              />
            </div>

            {/* Progress Stages Table */}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">流程节点</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">状态</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">完成时间</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stages.map((stage) => {
                    const isCompleted = stage.status === 'completed';
                    const canBatch = canBatchComplete(request.id, stage.name);
                    
                    return (
                      <tr key={stage.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900">{stage.name}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge
                            status={isCompleted ? '已完成' : '未完成'}
                            color={isCompleted ? 'green' : 'gray'}
                            size="sm"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm text-gray-500">
                            {stage.completedDate 
                              ? stage.completedDate.toLocaleDateString('zh-CN')
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {stage.name === '到货确认' && canBatch && (
                            <button
                              onClick={() => handleArrivalConfirmationBatch(request.id)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              批量完成
                            </button>
                          )}
                          {stage.name === '验收确认' && (
                            <span className="text-xs text-gray-500">
                              {allocation?.type === 'external' ? '仓管自动完成' : '生产人员操作'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Order Summary */}
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
                  <span className="text-gray-600">创建时间:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(request.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">交货日期:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {allocation?.deliveryDate 
                      ? new Date(allocation.deliveryDate).toLocaleDateString('zh-CN')
                      : '-'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // 渲染SKU列表（以SKU为维度）
  const renderSKUList = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-900">订单编号</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">图片</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">SKU编码</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">产品名称</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">数量</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">材料</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">包装方式</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">完成时间</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={`${item.requestId}-${item.id}`} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-blue-600">{item.requestNumber}</div>
                </td>
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
                <td className="py-4 px-4">
                  <div className="text-sm font-medium text-gray-900">{item.sku.code}</div>
                  <div className="text-xs text-gray-500">{item.sku.category}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-900">{item.sku.name}</div>
                  <div className="text-xs text-gray-500">{item.sku.englishName}</div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-medium text-gray-900">{item.quantity.toLocaleString()}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-900">{item.material || '-'}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-900">{item.packagingMethod || '-'}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm text-gray-500">
                    {item.completedAt.toLocaleDateString('zh-CN')}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <StatusBadge
                    status={activeTab === 'non_conforming' ? '不合格' : '已完成'}
                    color={activeTab === 'non_conforming' ? 'red' : 'green'}
                    size="sm"
                  />
                </td>
              </tr>
            ))}
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
            <h1 className="text-2xl font-bold text-gray-900">采购进度</h1>
            <p className="text-gray-600">跟踪和管理采购订单的执行进度</p>
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
                {activeTab === 'in_progress' ? '订单' : 'SKU'}: {filteredData.length}
              </span>
            </div>
          </div>
        </div>

        {/* 🎯 业务规则说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-800">流程节点说明</h3>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>到货确认</strong>：采购专员操作，点击"批量完成"后厂家包装SKU自动进入验货入库</p>
            <p>• <strong>验收确认</strong>：厂家包装由仓管人员自动完成，自己包装由生产人员操作完成</p>
            <p>• <strong>数据维度</strong>：进行中以订单为维度，其他子栏目以SKU为维度</p>
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
              onClick={() => setActiveTab('in_house_completed')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'in_house_completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Factory className="h-5 w-5" />
              <span>自己包装已完成</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'in_house_completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.inHouseCompleted}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('non_conforming')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'non_conforming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
              <span>不合格订单</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'non_conforming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.nonConforming}
              </span>
            </button>
          </nav>
        </div>

        {/* Content */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'in_progress' ? '没有进行中的订单' : 
               activeTab === 'external_completed' ? '没有厂家包装已完成的SKU' :
               activeTab === 'in_house_completed' ? '没有自己包装已完成的SKU' :
               '没有不合格的SKU'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'in_progress' ? '所有订单都已完成' : 
               activeTab === 'external_completed' ? '还没有完成的厂家包装SKU' :
               activeTab === 'in_house_completed' ? '还没有完成的自己包装SKU' :
               '没有验收不合格的SKU'}
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'in_progress' ? renderInProgressOrders() : renderSKUList()}
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