import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  Package,
  Upload,
  Eye,
  Download,
  User,
  Camera,
  ZoomIn,
  X,
  TrendingUp,
  BarChart3,
  Save,
  Edit
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

type TabType = 'in_progress' | 'completed';

export const PurchaseProgress: React.FC = () => {
  const { 
    getPurchaseRequests, 
    getProcurementProgress, 
    getOrderAllocations,
    updateProcurementProgressStage,
    getOrderAllocationByRequestId
  } = useProcurement();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingArrivalQuantities, setEditingArrivalQuantities] = useState<{[key: string]: number}>({});
  const [showShortageDialog, setShowShortageDialog] = useState<{
    progressId: string;
    skuId: string;
    arrivalQuantity: number;
    purchaseQuantity: number;
  } | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 获取已分配的订单
  const { data: allocatedRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'updatedAt', direction: 'desc' }
  );

  // 获取进度数据
  const procurementProgressData = getProcurementProgress() || [];
  const orderAllocations = getOrderAllocations() || [];

  // 按订单分组进度数据
  const progressByRequest = React.useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    
    procurementProgressData.forEach(progress => {
      if (progress?.purchaseRequestId) {
        if (!grouped[progress.purchaseRequestId]) {
          grouped[progress.purchaseRequestId] = [];
        }
        grouped[progress.purchaseRequestId].push(progress);
      }
    });
    
    return grouped;
  }, [procurementProgressData]);

  // 检查订单是否已完成
  const isOrderCompleted = (requestId: string): boolean => {
    const progressList = progressByRequest[requestId] || [];
    if (progressList.length === 0) return false;
    
    return progressList.every(progress => {
      if (!progress?.stages) return false;
      return progress.stages.every((stage: any) => stage?.status === 'completed' || stage?.status === 'skipped');
    });
  };

  // 根据搜索条件过滤订单
  const filteredProgressByRequest = React.useMemo(() => {
    const filtered: { [key: string]: any[] } = {};
    
    Object.entries(progressByRequest).forEach(([requestId, progressList]) => {
      if (requestId && progressList) {
        const isCompleted = isOrderCompleted(requestId);
        
        // 根据标签页过滤
        if ((activeTab === 'completed' && isCompleted) || (activeTab === 'in_progress' && !isCompleted)) {
          // 如果有搜索条件，进一步过滤
          if (!searchTerm) {
            filtered[requestId] = progressList;
          } else {
            const request = getRequestInfo(requestId);
            const matchesSearch = request?.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              progressList.some(progress => 
                progress?.sku?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                progress?.sku?.name?.toLowerCase().includes(searchTerm.toLowerCase())
              );
            
            if (matchesSearch) {
              filtered[requestId] = progressList;
            }
          }
        }
      }
    });
    
    return filtered;
  }, [progressByRequest, activeTab, searchTerm, allocatedRequests]);

  const getRequestInfo = (requestId: string) => {
    return allocatedRequests?.find(req => req?.id === requestId);
  };

  const getOrderAllocation = (requestId: string) => {
    return getOrderAllocationByRequestId(requestId);
  };

  // 获取到货数量的初始值
  const getInitialArrivalQuantity = (progressId: string, skuId: string): number => {
    // 如果用户已经编辑过，返回编辑值
    if (editingArrivalQuantities[`${progressId}-${skuId}`] !== undefined) {
      return editingArrivalQuantities[`${progressId}-${skuId}`];
    }
    
    // 否则返回采购数量作为初始值
    const progress = procurementProgressData.find(p => p?.id === progressId);
    if (!progress) return 0;
    
    const request = getRequestInfo(progress.purchaseRequestId);
    if (!request) return 0;
    
    const item = request.items?.find(item => item?.skuId === skuId);
    return item?.quantity || 0;
  };

  // 处理到货数量编辑
  const handleArrivalQuantityChange = (progressId: string, skuId: string, quantity: number) => {
    setEditingArrivalQuantities(prev => ({
      ...prev,
      [`${progressId}-${skuId}`]: quantity
    }));
  };

  // 保存到货数量
  const handleSaveArrivalQuantity = async (progressId: string, skuId: string, arrivalQuantity?: number) => {
    try {
      const progress = procurementProgressData.find(p => p?.id === progressId);
      if (!progress) return;

      const request = getRequestInfo(progress.purchaseRequestId);
      if (!request) return;

      const allocation = getOrderAllocation(progress.purchaseRequestId);
      
      // 获取实际到货数量
      const actualArrivalQuantity = arrivalQuantity !== undefined 
        ? arrivalQuantity 
        : getInitialArrivalQuantity(progressId, skuId);
      
      const item = request.items?.find(item => item?.skuId === skuId);
      const purchaseQuantity = item?.quantity || 0;

      console.log(`🎯 保存到货数量 - SKU: ${skuId}, 到货: ${actualArrivalQuantity}, 采购: ${purchaseQuantity}`);

      // 仅对厂家包装应用新的流转逻辑
      if (allocation?.type === 'external') {
        if (actualArrivalQuantity >= purchaseQuantity) {
          // 情况1：到货数量 >= 采购数量，直接完成
          await updateProcurementProgressStage(progressId, '收货确认', {
            status: 'completed',
            completedDate: new Date(),
            remarks: `到货数量: ${actualArrivalQuantity}`
          });
          console.log(`✅ 厂家包装 - 到货充足，SKU直接完成`);
        } else {
          // 情况2：到货数量 < 采购数量，显示拆分对话框
          setShowShortageDialog({
            progressId,
            skuId,
            arrivalQuantity: actualArrivalQuantity,
            purchaseQuantity
          });
          return; // 等待用户选择
        }
      } else {
        // 自己包装保持原有逻辑
        await updateProcurementProgressStage(progressId, '收货确认', {
          status: 'completed',
          completedDate: new Date(),
          remarks: `到货数量: ${actualArrivalQuantity}`
        });
        console.log(`✅ 自己包装 - 使用原有逻辑完成`);
      }

      // 清除编辑状态
      setEditingArrivalQuantities(prev => {
        const newState = { ...prev };
        delete newState[`${progressId}-${skuId}`];
        return newState;
      });

    } catch (error) {
      console.error('保存到货数量失败:', error);
      alert('保存到货数量失败，请重试');
    }
  };

  // 处理缺货确认
  const handleShortageConfirm = async (continueProduction: boolean) => {
    if (!showShortageDialog) return;

    const { progressId, skuId, arrivalQuantity, purchaseQuantity } = showShortageDialog;

    try {
      if (continueProduction) {
        // 用户选择"是"：拆分SKU
        console.log(`🔄 拆分SKU - 到货: ${arrivalQuantity}, 剩余: ${purchaseQuantity - arrivalQuantity}`);
        
        // TODO: 实现SKU拆分逻辑
        // 1. 创建新的SKU记录（到货部分）并移入已完成
        // 2. 更新原SKU数量为剩余部分，保持在进行中
        
        alert(`SKU拆分功能开发中...\n到货部分: ${arrivalQuantity}\n剩余部分: ${purchaseQuantity - arrivalQuantity}`);
      } else {
        // 用户选择"否"：以到货数量为准完成
        await updateProcurementProgressStage(progressId, '收货确认', {
          status: 'completed',
          completedDate: new Date(),
          remarks: `实际到货: ${arrivalQuantity}, 放弃剩余: ${purchaseQuantity - arrivalQuantity}`
        });
        console.log(`🚚 以到货数量为准完成，放弃剩余数量`);
      }

      // 清除编辑状态和对话框
      setEditingArrivalQuantities(prev => {
        const newState = { ...prev };
        delete newState[`${progressId}-${skuId}`];
        return newState;
      });
      setShowShortageDialog(null);

    } catch (error) {
      console.error('处理缺货确认失败:', error);
      alert('操作失败，请重试');
    }
  };

  // 处理图片点击放大
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 获取统计数据
  const getTabStats = () => {
    const allRequestIds = Object.keys(progressByRequest);
    const completedCount = allRequestIds.filter(requestId => isOrderCompleted(requestId)).length;
    const inProgressCount = allRequestIds.length - completedCount;
    
    return { inProgressCount, completedCount };
  };

  const tabStats = getTabStats();
  const canPurchasingOfficer = user?.role === 'purchasing_officer';

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">采购进度</h1>
            <p className="text-gray-600">按订单管理采购流程和进度</p>
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
                订单: {Object.keys(filteredProgressByRequest).length}
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
                {tabStats.inProgressCount}
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
                {tabStats.completedCount}
              </span>
            </button>
          </nav>
        </div>

        {Object.keys(filteredProgressByRequest).length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'in_progress' ? '暂无进行中订单' : '暂无已完成订单'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'in_progress' ? '所有订单都已完成采购' : '还没有完成的采购订单'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredProgressByRequest).map(([requestId, progressList]) => {
              const request = getRequestInfo(requestId);
              const allocation = getOrderAllocation(requestId);
              const orderCompleted = isOrderCompleted(requestId);
              
              if (!request || !progressList) return null;
              
              return (
                <div key={requestId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.requestNumber || requestId}
                      </h3>
                      <StatusBadge
                        status={allocation?.type === 'external' ? '厂家包装' : '自己包装'}
                        color={allocation?.type === 'external' ? 'blue' : 'green'}
                      />
                      {orderCompleted && (
                        <StatusBadge
                          status="已完成"
                          color="green"
                        />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {progressList.length} 个SKU
                    </div>
                  </div>

                  {/* Progress Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-16">图片</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-32">SKU</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-40">产品名称</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">采购数量</th>
                          {activeTab === 'in_progress' && (
                            <th className="text-center py-3 px-4 font-medium text-gray-900 w-20">整体进度</th>
                          )}
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">供应商确认</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">定金支付</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">纸卡提供</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">生产制作</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">尾款支付</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">收货确认</th>
                          {activeTab === 'in_progress' && allocation?.type === 'external' && (
                            <th className="text-center py-3 px-4 font-medium text-gray-900 w-32">到货数量</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {progressList.map((progress) => {
                          if (!progress || !progress.id) return null;
                          
                          const sku = progress.sku;
                          if (!sku || !sku.id) return null;
                          
                          const stages = progress.stages || [];
                          
                          return (
                            <tr key={progress.id} className="hover:bg-gray-50">
                              {/* Product Image */}
                              <td className="py-4 px-4">
                                {sku.imageUrl ? (
                                  <div className="relative group">
                                    <img 
                                      src={sku.imageUrl} 
                                      alt={sku.name || 'N/A'}
                                      className="w-10 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => handleImageClick(sku.imageUrl!)}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                                         onClick={() => handleImageClick(sku.imageUrl!)}>
                                      <ZoomIn className="h-3 w-3 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded border flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </td>
                              
                              {/* SKU Info */}
                              <td className="py-4 px-4">
                                <div className="font-medium text-gray-900">{sku.code || 'N/A'}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-900">{sku.name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{sku.category || 'N/A'}</div>
                              </td>
                              
                              {/* Purchase Quantity */}
                              <td className="py-4 px-4 text-center">
                                <span className="text-sm font-medium text-gray-900">
                                  {(() => {
                                    const item = request.items?.find(item => item?.skuId === sku.id);
                                    return item?.quantity?.toLocaleString() || 0;
                                  })()}
                                </span>
                              </td>
                              
                              {/* Overall Progress for In Progress */}
                              {activeTab === 'in_progress' && (
                                <td className="py-4 px-4 text-center">
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="text-sm font-bold text-blue-600">{progress.overallProgress || 0}%</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${progress.overallProgress || 0}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              )}

                              {/* Stage Progress */}
                              {['供应商确认', '定金支付', '纸卡提供', '生产制作', '尾款支付', '收货确认'].map((stageName) => {
                                const stage = stages.find((s: any) => s?.name === stageName);
                                const isCompleted = stage?.status === 'completed';
                                const isSkipped = stage?.status === 'skipped';
                                
                                return (
                                  <td key={stageName} className="py-4 px-4 text-center">
                                    <div className="flex flex-col items-center space-y-2">
                                      <StatusBadge
                                        status={isCompleted ? '已完成' : isSkipped ? '已跳过' : '未完成'}
                                        color={isCompleted ? 'green' : isSkipped ? 'gray' : 'yellow'}
                                        size="sm"
                                      />
                                      {stage?.completedDate && (
                                        <div className="text-xs text-gray-500">
                                          {stage.completedDate.toLocaleDateString('zh-CN')}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                );
                              })}

                              {/* Arrival Quantity Input for External Packaging */}
                              {activeTab === 'in_progress' && allocation?.type === 'external' && (
                                <td className="py-4 px-4 text-center">
                                  <div className="flex flex-col items-center space-y-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={getInitialArrivalQuantity(progress.id, sku.id)}
                                      onChange={(e) => handleArrivalQuantityChange(progress.id, sku.id, parseInt(e.target.value) || 0)}
                                      className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="数量"
                                    />
                                    {canPurchasingOfficer && (
                                      <button
                                        onClick={() => handleSaveArrivalQuantity(progress.id, sku.id)}
                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                      >
                                        保存
                                      </button>
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

                  {/* Order Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm flex-1">
                        <div>
                          <span className="text-gray-600">申请人:</span>
                          <span className="ml-2 font-medium text-gray-900">{request.requester?.name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">总金额:</span>
                          <span className="ml-2 font-medium text-gray-900">¥{request.totalAmount?.toLocaleString() || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">创建时间:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString('zh-CN') : '-'}
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

      {/* Shortage Confirmation Dialog */}
      {showShortageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">到货数量少于采购计划</h3>
                  <p className="text-sm text-gray-600 mt-1">剩余订单是否继续生产？</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {showShortageDialog.purchaseQuantity}
                    </div>
                    <div className="text-gray-600">采购计划</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {showShortageDialog.arrivalQuantity}
                    </div>
                    <div className="text-gray-600">实际到货</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {showShortageDialog.purchaseQuantity - showShortageDialog.arrivalQuantity}
                    </div>
                    <div className="text-gray-600">缺货数量</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => handleShortageConfirm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="font-medium">否</div>
                    <div className="text-xs text-gray-500">以到货数量为准完成</div>
                  </div>
                </button>
                <button
                  onClick={() => handleShortageConfirm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <div className="text-center">
                    <div className="font-medium">是</div>
                    <div className="text-xs">拆分订单继续生产</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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