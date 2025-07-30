import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Search, 
  Eye, 
  ZoomIn, 
  X, 
  Filter,
  Square,
  CheckSquare,
  Download,
  Truck,
  Factory,
  XCircle
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

type TabType = 'in_progress' | 'external_completed' | 'in_house_completed' | 'non_compliant';

export const PurchaseProgress: React.FC = () => {
  const { user } = useAuth();
  const { 
    getPurchaseRequests, 
    getProcurementProgress, 
    updateProcurementProgressStage,
    getOrderAllocations,
    updatePurchaseRequest
  } = useProcurement();
  
  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 获取已分配的订单
  const { data: allocatedRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'updatedAt', direction: 'desc' }
  );

  const orderAllocations = getOrderAllocations();
  const procurementProgressData = getProcurementProgress();

  // 权限检查
  const isPurchasingOfficer = user?.role === 'purchasing_officer';

  // 获取订单的分配信息
  const getOrderAllocation = (requestId: string) => {
    return orderAllocations.find(a => a.purchaseRequestId === requestId);
  };

  // 获取订单的采购进度
  const getOrderProgress = (requestId: string) => {
    return procurementProgressData.find(p => p.purchaseRequestId === requestId);
  };

  // 检查订单是否已完成（所有SKU都已流转）
  const isOrderCompleted = (requestId: string) => {
    const allocation = getOrderAllocation(requestId);
    if (!allocation) return false;

    const request = allocatedRequests.find(r => r.id === requestId);
    if (!request) return false;

    // 检查所有SKU是否都已完成流转
    return request.items.every(item => {
      const skuId = `${requestId}-${item.id}`;
      // 这里需要检查SKU是否在对应的已完成子栏目中
      // 暂时返回false，实际需要根据具体的SKU状态判断
      return false;
    });
  };

  // 根据标签页过滤数据
  const getFilteredData = () => {
    switch (activeTab) {
      case 'in_progress':
        // 进行中：以订单为维度，显示未完成的订单
        return allocatedRequests.filter(request => {
          const allocation = getOrderAllocation(request.id);
          const matchesSearch = !searchTerm || 
            request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.items.some(item => 
              item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
          
          return allocation && !isOrderCompleted(request.id) && matchesSearch;
        });
      
      case 'external_completed':
        // 厂家包装已完成：以SKU为维度
        return getCompletedSKUs('external');
      
      case 'in_house_completed':
        // 自己包装已完成：以SKU为维度
        return getCompletedSKUs('in_house');
      
      case 'non_compliant':
        // 不合格订单：以SKU为维度
        return getNonCompliantSKUs();
      
      default:
        return [];
    }
  };

  // 获取已完成的SKU（模拟数据，实际需要从相应模块获取）
  const getCompletedSKUs = (type: 'external' | 'in_house') => {
    // 这里应该从验货入库或自己包装模块获取已完成的SKU数据
    // 暂时返回空数组，实际实现需要跨模块数据同步
    return [];
  };

  // 获取不合格的SKU（模拟数据）
  const getNonCompliantSKUs = () => {
    // 这里应该从自己包装模块获取验收不合格的SKU数据
    return [];
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
    if (activeTab === 'in_progress') {
      const allRequestIds = filteredData.map((item: any) => item.id);
      setSelectedOrders(prev => 
        prev.length === allRequestIds.length ? [] : allRequestIds
      );
    }
  };

  // 处理单个流程节点完成
  const handleStageComplete = async (requestId: string, stageName: string) => {
    try {
      const progress = getOrderProgress(requestId);
      if (!progress) return;

      await updateProcurementProgressStage(progress.id, stageName, {
        status: 'completed',
        completedDate: new Date()
      });
    } catch (error) {
      console.error('完成流程节点失败:', error);
    }
  };

  // 处理批量完成"到货确认"
  const handleBatchArrivalConfirmation = async () => {
    if (selectedOrders.length === 0) return;

    try {
      for (const requestId of selectedOrders) {
        const allocation = getOrderAllocation(requestId);
        const progress = getOrderProgress(requestId);
        
        if (!allocation || !progress) continue;

        // 完成"到货确认"节点
        await updateProcurementProgressStage(progress.id, '到货确认', {
          status: 'completed',
          completedDate: new Date()
        });

        // 如果是厂家包装，自动流转到验货入库
        if (allocation.type === 'external') {
          const request = allocatedRequests.find(r => r.id === requestId);
          if (request) {
            // 这里需要调用验货入库模块的接口，将SKU添加到待验收列表
            console.log(`厂家包装订单 ${request.requestNumber} 的SKU已流转到验货入库待验收`);
          }
        }
      }

      setSelectedOrders([]);
    } catch (error) {
      console.error('批量完成到货确认失败:', error);
    }
  };

  // 处理图片点击
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 获取统计数据
  const getTabStats = () => {
    const inProgress = allocatedRequests.filter(request => {
      const allocation = getOrderAllocation(request.id);
      return allocation && !isOrderCompleted(request.id);
    }).length;

    return {
      inProgress,
      externalCompleted: 0, // 实际需要从验货入库模块获取
      inHouseCompleted: 0,  // 实际需要从自己包装模块获取
      nonCompliant: 0       // 实际需要从自己包装模块获取
    };
  };

  const tabStats = getTabStats();

  // 渲染进行中订单表格
  const renderInProgressOrders = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 py-3 px-3 text-left font-medium text-gray-900">
                <button onClick={handleSelectAll} className="flex items-center">
                  {selectedOrders.length === filteredData.length && filteredData.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">订单编号</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">采购类型</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">纸卡类型</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">付款方式</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">供应商</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">总金额</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">采购进度</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((request: any) => {
              const allocation = getOrderAllocation(request.id);
              const progress = getOrderProgress(request.id);
              const isSelected = selectedOrders.includes(request.id);
              
              return (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <button onClick={() => handleOrderSelection(request.id)} className="flex items-center">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-sm font-medium text-blue-600">{request.requestNumber}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge
                      status={allocation?.type === 'external' ? '厂家包装' : '自己包装'}
                      color={allocation?.type === 'external' ? 'blue' : 'green'}
                      size="sm"
                    />
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
                    <span className="text-sm text-gray-900">未指定</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      ¥{request.totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-sm font-medium text-blue-600">
                        {progress?.overallProgress || 0}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress?.overallProgress || 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 展开的采购项目详情 */}
      {filteredData.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">采购项目</h4>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-3 font-medium text-gray-900">图片</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-900">SKU</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-900">产品名称</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-900">采购数量</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-900">整体进度</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-900">定金支付</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-900">安排生产</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-900">纸卡提供</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-900">包装生产</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-900">尾款支付</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-900">安排发货</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-900">到货确认</th>
                  <th className="text-center py-3 px-3 font-medium text-gray-900">验收确认</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.flatMap((request: any) => 
                  request.items.map((item: any) => {
                    const progress = getOrderProgress(request.id);
                    const stages = progress?.stages || [];
                    
                    return (
                      <tr key={`${request.id}-${item.id}`} className="hover:bg-gray-50">
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
                          <div className="text-sm font-medium text-gray-900">{item.sku.code}</div>
                          <div className="text-xs text-gray-500">{item.sku.category}</div>
                        </td>
                        
                        {/* 产品名称 */}
                        <td className="py-3 px-3">
                          <div className="text-sm text-gray-900">{item.sku.name}</div>
                          <div className="text-xs text-gray-500">{item.sku.englishName}</div>
                        </td>
                        
                        {/* 采购数量 */}
                        <td className="py-3 px-3 text-center">
                          <span className="text-sm font-medium text-gray-900">
                            {item.quantity.toLocaleString()}
                          </span>
                        </td>
                        
                        {/* 整体进度 */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-sm font-medium text-blue-600">
                              {progress?.overallProgress || 0}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${progress?.overallProgress || 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        
                        {/* 流程节点状态 */}
                        {['定金支付', '安排生产', '纸卡提供', '包装生产', '尾款支付', '安排发货', '到货确认', '验收确认'].map((stageName) => {
                          const stage = stages.find(s => s.name === stageName);
                          const isCompleted = stage?.status === 'completed';
                          const isInProgress = stage?.status === 'in_progress';
                          
                          return (
                            <td key={stageName} className="py-3 px-3 text-center">
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
                                {/* 采购专员可以完成单个节点 */}
                                {isPurchasingOfficer && !isCompleted && stageName !== '到货确认' && (
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
                  })
                )}
              </tbody>
              
              {/* 批量操作行 */}
              {isPurchasingOfficer && (
                <tbody>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td className="py-3 px-3 text-sm font-medium text-gray-700" colSpan={11}>
                      批量操作
                    </td>
                    {/* 到货确认批量完成按钮 */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={handleBatchArrivalConfirmation}
                        disabled={selectedOrders.length === 0}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        批量完成
                      </button>
                    </td>
                    {/* 验收确认无批量完成按钮 */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs text-gray-500">无批量操作</span>
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染SKU级别的表格（用于其他子栏目）
  const renderSKULevelTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-3 font-medium text-gray-900">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">SKU</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">产品名称</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">采购数量</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">材料</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">包装方式</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">完成时间</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'external_completed' ? '暂无厂家包装已完成的SKU' :
                     activeTab === 'in_house_completed' ? '暂无自己包装已完成的SKU' :
                     '暂无不合格的SKU'}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === 'external_completed' ? '完成验货入库后的SKU将显示在这里' :
                     activeTab === 'in_house_completed' ? '完成自己包装验收的SKU将显示在这里' :
                     '验收不合格的SKU将显示在这里'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredData.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-3 px-3 text-sm font-medium text-blue-600">
                    {item.requestNumber}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {item.sku?.imageUrl ? (
                      <img 
                        src={item.sku.imageUrl} 
                        alt={item.sku.name}
                        className="w-10 h-10 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-sm font-medium text-gray-900">
                    {item.sku?.code}
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    {item.sku?.name}
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-gray-900">
                    {item.quantity?.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    {item.material || '-'}
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-900">
                    {item.packagingMethod || '-'}
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-gray-500">
                    {item.completedDate ? new Date(item.completedDate).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <StatusBadge
                      status={activeTab === 'external_completed' ? '厂家包装已完成' :
                               activeTab === 'in_house_completed' ? '自己包装已完成' :
                               '验收不合格'}
                      color={activeTab === 'non_compliant' ? 'red' : 'green'}
                      size="sm"
                    />
                  </td>
                </tr>
              ))
            )}
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
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">
                {activeTab === 'in_progress' ? `订单: ${filteredData.length}` : `SKU: ${filteredData.length}`}
              </span>
            </div>
          </div>
        </div>

        {/* 业务规则说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-800">流程节点说明</h3>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>到货确认</strong>：采购专员操作，支持批量完成，厂家包装订单完成后自动流转到验货入库</p>
            <p>• <strong>验收确认</strong>：无批量操作，根据验货入库或自己包装的验收结果自动更新</p>
            <p>• <strong>数据维度</strong>：进行中以订单为维度，其他子栏目以SKU为维度显示</p>
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
              onClick={() => setActiveTab('non_compliant')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'non_compliant'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <XCircle className="h-5 w-5" />
              <span>不合格订单</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'non_compliant' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.nonCompliant}
              </span>
            </button>
          </nav>
        </div>

        {/* 选中统计栏 */}
        {activeTab === 'in_progress' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  已选择 <span className="font-medium text-blue-600">{selectedOrders.length}</span> 个订单
                </div>
              </div>
              {isPurchasingOfficer && selectedOrders.length > 0 && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleBatchArrivalConfirmation}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Truck className="h-4 w-4" />
                    <span>批量到货确认</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 内容区域 */}
        {activeTab === 'in_progress' ? renderInProgressOrders() : renderSKULevelTable()}
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