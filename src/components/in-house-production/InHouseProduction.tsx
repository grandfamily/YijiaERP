import React, { useState } from 'react';
import { 
  Factory, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  CreditCard, 
  Package,
  Upload,
  Eye,
  Download,
  FileText,
  User,
  Camera,
  ZoomIn,
  X,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useProduction } from '../../hooks/useProduction';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { InspectionModal } from './InspectionModal';

type TabType = 'in_progress' | 'pending_inspection' | 'completed_inspection';

export const InHouseProduction: React.FC = () => {
  const { getPurchaseRequests, getProcurementProgress, getCardProgress, getAccessoryProgress, getOrderAllocations } = useProcurement();
  const { createSchedulesFromInHouseProduction } = useProduction();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('in_progress');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  // 获取已分配的自己包装订单
  const { data: inHouseRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'deadline', direction: 'asc' }
  );

  // 过滤出自己包装订单
  const filteredInHouseRequests = inHouseRequests.filter(request => {
    const allocation = getOrderAllocations().find(a => a.purchaseRequestId === request.id);
    return allocation?.type === 'in_house';
  });

  // 获取进度数据
  const procurementProgressData = getProcurementProgress();
  const cardProgressData = getCardProgress();
  const accessoryProgressData = getAccessoryProgress();

  // 🎯 自动流转监听：当订单状态变为completed时，自动创建生产排单
  React.useEffect(() => {
    filteredInHouseRequests.forEach(request => {
      if (request.status === 'completed') {
        // 检查是否已经创建了生产排单，避免重复创建
        const schedules = createSchedulesFromInHouseProduction(request.id);
        if (schedules.length > 0) {
          console.log(`🔄 自动流转：订单 ${request.requestNumber} 验收完成，已自动创建 ${schedules.length} 个SKU的生产排单`);
        }
      }
    });
  }, [filteredInHouseRequests, createSchedulesFromInHouseProduction]);

  // 检查采购进度是否完成
  const isProcurementCompleted = (requestId: string): boolean => {
    const progress = procurementProgressData.find(p => p.purchaseRequestId === requestId);
    return progress ? progress.stages.every(s => s.status === 'completed' || s.status === 'skipped') : false;
  };

  // 检查辅料进度是否>80%
  const isAccessoryProgressAbove80 = (requestId: string): boolean => {
    const accessoryProgress = accessoryProgressData.filter(ap => ap.purchaseRequestId === requestId);
    if (accessoryProgress.length === 0) return false;
    
    const totalProgress = accessoryProgress.reduce((sum, ap) => sum + ap.overallProgress, 0);
    const averageProgress = totalProgress / accessoryProgress.length;
    return averageProgress > 80;
  };

  // 新的待验收条件：采购进度100% + 辅料进度>80%
  const isReadyForInspection = (requestId: string): boolean => {
    return isProcurementCompleted(requestId) && isAccessoryProgressAbove80(requestId);
  };

  // 获取纸卡进度百分比
  const getCardProgressPercentage = (requestId: string): number => {
    const cardProgress = cardProgressData.filter(cp => cp.purchaseRequestId === requestId);
    if (cardProgress.length === 0) return 0;
    
    const totalProgress = cardProgress.reduce((sum, cp) => sum + cp.overallProgress, 0);
    return Math.round(totalProgress / cardProgress.length);
  };

  // 获取辅料进度百分比
  const getAccessoryProgressPercentage = (requestId: string): number => {
    const accessoryProgress = accessoryProgressData.filter(ap => ap.purchaseRequestId === requestId);
    if (accessoryProgress.length === 0) return 0;
    
    const totalProgress = accessoryProgress.reduce((sum, ap) => sum + ap.overallProgress, 0);
    return Math.round(totalProgress / accessoryProgress.length);
  };

  // 获取采购进度百分比
  const getProcurementProgressPercentage = (requestId: string): number => {
    const progress = procurementProgressData.find(p => p.purchaseRequestId === requestId);
    return progress ? progress.overallProgress : 0;
  };

  // 🎯 新增：将订单数据转换为SKU级别的数据
  const convertToSKULevelData = () => {
    const skuData: any[] = [];
    
    filteredInHouseRequests.forEach(request => {
      request.items.forEach(item => {
        const procurementProgress = getProcurementProgressPercentage(request.id);
        const cardProgress = getCardProgressPercentage(request.id);
        const accessoryProgress = getAccessoryProgressPercentage(request.id);
        const readyForInspection = isReadyForInspection(request.id);
        
        skuData.push({
          id: `${request.id}-${item.id}`,
          requestId: request.id,
          requestNumber: request.requestNumber,
          item,
          sku: item.sku,
          quantity: item.quantity,
          material: item.material || '-',
          packagingMethod: item.packagingMethod || '-',
          procurementProgress,
          cardProgress,
          accessoryProgress,
          readyForInspection,
          request
        });
      });
    });
    
    return skuData;
  };

  // 根据标签页过滤SKU数据
  const getFilteredSKUData = () => {
    const allSKUData = convertToSKULevelData();
    
    let filtered = allSKUData;

    // 根据标签页过滤
    switch (activeTab) {
      case 'in_progress':
        filtered = allSKUData.filter(skuData => !skuData.readyForInspection);
        break;
      case 'pending_inspection':
        filtered = allSKUData.filter(skuData => 
          skuData.readyForInspection && skuData.request.status !== 'completed'
        );
        break;
      case 'completed_inspection':
        filtered = allSKUData.filter(skuData => skuData.request.status === 'completed');
        break;
    }

    // 根据搜索条件过滤
    return filtered.filter(skuData => 
      skuData.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skuData.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skuData.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredSKUData = getFilteredSKUData();

  const canManageProduction = hasPermission('manage_in_house_production') || hasPermission('edit_in_house_production');

  const getStatusColor = (status: string) => {
    const colors = {
      allocated: 'blue',
      in_production: 'yellow',
      quality_check: 'purple',
      ready_to_ship: 'indigo',
      shipped: 'green',
      completed: 'green'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      allocated: '已分配',
      in_production: '生产中',
      quality_check: '质检中',
      ready_to_ship: '待发货',
      shipped: '已发货',
      completed: '已完成'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // 处理图片点击放大
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 获取统计数据
  const getTabStats = () => {
    const allSKUData = convertToSKULevelData();
    const inProgress = allSKUData.filter(s => !s.readyForInspection).length;
    const pendingInspection = allSKUData.filter(s => 
      s.readyForInspection && s.request.status !== 'completed'
    ).length;
    const completedInspection = allSKUData.filter(s => s.request.status === 'completed').length;
    
    return { inProgress, pendingInspection, completedInspection };
  };

  const tabStats = getTabStats();

  // 处理验收决策
  const handleInspectionDecision = async (requestId: string, skuId: string, decision: 'pass' | 'fail') => {
    try {
      if (decision === 'pass') {
        // 验收通过：流转到已验收SKU和生产排单
        console.log(`✅ SKU ${skuId} 验收通过，流转到已验收SKU和生产排单`);
        
        // 更新订单状态为已完成
        await updatePurchaseRequest(requestId, {
          status: 'completed',
          updatedAt: new Date()
        });
        
        // 自动创建生产排单
        const schedules = createSchedulesFromInHouseProduction(requestId);
        console.log(`🔄 自动流转：创建了 ${schedules.length} 个SKU的生产排单`);
        
      } else {
        // 验收不合格：退回到采购进度的不合格订单
        console.log(`❌ SKU ${skuId} 验收不合格，退回到采购进度不合格订单`);
        
        // 更新订单状态为质检不合格
        await updatePurchaseRequest(requestId, {
          status: 'quality_check',
          updatedAt: new Date()
        });
      }
      
      // 刷新数据
      window.location.reload();
      
    } catch (error) {
      console.error('处理验收决策失败:', error);
      alert('操作失败，请重试');
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'pending_inspection') {
      return renderPendingInspectionSKUs();
    } else if (activeTab === 'completed_inspection') {
      return renderCompletedInspectionSKUs();
    } else {
      return renderInProgressSKUs();
    }
  };

  const renderInProgressSKUs = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-16">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">SKU编码</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-40">品名</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">计划数量</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">材料</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">包装方式</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">纸卡进度</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">采购进度</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">辅料进度</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">状态</th>
              {canManageProduction && (
                <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSKUData.map((skuData) => (
              <tr key={skuData.id} className="hover:bg-gray-50 h-20">
                {/* 订单编号 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-blue-600">{skuData.requestNumber}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(skuData.request.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </td>
                
                {/* 产品图片 */}
                <td className="py-3 px-3 text-center">
                  {skuData.sku.imageUrl ? (
                    <div className="relative group inline-block">
                      <img 
                        src={skuData.sku.imageUrl} 
                        alt={skuData.sku.name}
                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(skuData.sku.imageUrl!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                           onClick={() => handleImageClick(skuData.sku.imageUrl!)}>
                        <ZoomIn className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <Camera className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                
                {/* SKU编码 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-gray-900">{skuData.sku.code}</div>
                  <div className="text-xs text-gray-500">{skuData.sku.category}</div>
                </td>
                
                {/* 品名 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900 font-medium">{skuData.sku.name}</div>
                  <div className="text-xs text-gray-500 truncate">{skuData.sku.englishName}</div>
                </td>
                
                {/* 计划数量 */}
                <td className="py-3 px-3 text-center">
                  <div className="text-sm font-bold text-gray-900">{skuData.quantity.toLocaleString()}</div>
                </td>
                
                {/* 材料 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900">{skuData.material}</div>
                </td>
                
                {/* 包装方式 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900">{skuData.packagingMethod}</div>
                </td>
                
                {/* 纸卡进度 */}
                <td className="py-3 px-3">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xs font-medium text-purple-600">{skuData.cardProgress}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${skuData.cardProgress}%` }}
                      />
                    </div>
                  </div>
                </td>
                
                {/* 采购进度 */}
                <td className="py-3 px-3">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xs font-medium text-blue-600">{skuData.procurementProgress}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${skuData.procurementProgress}%` }}
                      />
                    </div>
                  </div>
                </td>
                
                {/* 辅料进度 */}
                <td className="py-3 px-3">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xs font-medium text-green-600">{skuData.accessoryProgress}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${skuData.accessoryProgress}%` }}
                      />
                    </div>
                  </div>
                </td>
                
                {/* 状态 */}
                <td className="py-3 px-3 text-center">
                  {skuData.procurementProgress === 100 && skuData.accessoryProgress > 80 ? (
                    <StatusBadge status="待验收" color="yellow" size="sm" />
                  ) : (
                    <StatusBadge status="生产中" color="blue" size="sm" />
                  )}
                </td>
                
                {/* 操作 */}
                {canManageProduction && (
                  <td className="py-3 px-3 text-center">
                    <button className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                      详情
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPendingInspectionSKUs = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-16">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">SKU编码</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-40">品名</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">材料</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">包装方式</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">采购数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">到货数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">验收照片</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">验收意见</th>
              {canManageProduction && (
                <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSKUData.map((skuData) => (
              <tr key={skuData.id} className="hover:bg-gray-50 h-20">
                {/* 订单编号 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-blue-600">{skuData.requestNumber}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(skuData.request.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </td>
                
                {/* 产品图片 */}
                <td className="py-3 px-3 text-center">
                  {skuData.sku.imageUrl ? (
                    <div className="relative group inline-block">
                      <img 
                        src={skuData.sku.imageUrl} 
                        alt={skuData.sku.name}
                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(skuData.sku.imageUrl!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                           onClick={() => handleImageClick(skuData.sku.imageUrl!)}>
                        <ZoomIn className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <Camera className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                
                {/* SKU编码 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-gray-900">{skuData.sku.code}</div>
                  <div className="text-xs text-gray-500">{skuData.sku.category}</div>
                </td>
                
                {/* 品名 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900 font-medium">{skuData.sku.name}</div>
                  <div className="text-xs text-gray-500 truncate">{skuData.sku.englishName}</div>
                </td>
                
                {/* 材料 */}
                <td className="py-3 px-3 text-center">
                  <div className="text-sm text-gray-900">{skuData.material}</div>
                </td>
                
                {/* 包装方式 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900">{skuData.packagingMethod}</div>
                </td>
                
                {/* 采购数量 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-bold text-gray-900">{skuData.quantity.toLocaleString()}</div>
                </td>
                
                {/* 到货数量 */}
                <td className="py-3 px-3">
                  {canManageProduction ? (
                    <input
                      type="number"
                      min="0"
                      defaultValue={skuData.quantity}
                      className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onChange={(e) => {
                        // 处理到货数量变更
                        const newQuantity = parseInt(e.target.value) || 0;
                        // 这里可以添加状态更新逻辑
                      }}
                    />
                  ) : (
                    <div className="text-sm font-bold text-gray-900">{skuData.quantity.toLocaleString()}</div>
                  )}
                </td>
                
                {/* 验收照片 */}
                <td className="py-3 px-3 text-center">
                  {canManageProduction ? (
                    <div className="flex flex-col items-center space-y-1">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        id={`photo-upload-${skuData.id}`}
                        onChange={(e) => {
                          // 处理照片上传
                          const files = Array.from(e.target.files || []);
                          console.log('上传照片:', files);
                        }}
                      />
                      <label
                        htmlFor={`photo-upload-${skuData.id}`}
                        className="cursor-pointer px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        上传照片
                      </label>
                      <span className="text-xs text-gray-500">支持JPG/PNG</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">-</span>
                  )}
                </td>
                
                {/* 验收意见 */}
                <td className="py-3 px-3 text-center">
                  {canManageProduction ? (
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => handleInspectionDecision(skuData.requestId, skuData.id, 'pass')}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        验收通过
                      </button>
                      <button
                        onClick={() => handleInspectionDecision(skuData.requestId, skuData.id, 'fail')}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        验收不合格
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">待验收</span>
                  )}
                </td>
                
                {/* 操作 */}
                {canManageProduction && (
                  <td className="py-3 px-3 text-center">
                    <button className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                      详情
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCompletedInspectionSKUs = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-16">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">SKU编码</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-40">品名</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">验收数量</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">材料</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">包装方式</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">验收时间</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">验收状态</th>
              {canManageProduction && (
                <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSKUData.map((skuData) => (
              <tr key={skuData.id} className="hover:bg-gray-50 h-20">
                {/* 订单编号 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-blue-600">{skuData.requestNumber}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(skuData.request.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </td>
                
                {/* 产品图片 */}
                <td className="py-3 px-3 text-center">
                  {skuData.sku.imageUrl ? (
                    <div className="relative group inline-block">
                      <img 
                        src={skuData.sku.imageUrl} 
                        alt={skuData.sku.name}
                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(skuData.sku.imageUrl!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                           onClick={() => handleImageClick(skuData.sku.imageUrl!)}>
                        <ZoomIn className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <Camera className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                
                {/* SKU编码 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-gray-900">{skuData.sku.code}</div>
                  <div className="text-xs text-gray-500">{skuData.sku.category}</div>
                </td>
                
                {/* 品名 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900 font-medium">{skuData.sku.name}</div>
                  <div className="text-xs text-gray-500 truncate">{skuData.sku.englishName}</div>
                </td>
                
                {/* 验收数量 */}
                <td className="py-3 px-3 text-center">
                  <div className="text-sm font-bold text-gray-900">{skuData.quantity.toLocaleString()}</div>
                </td>
                
                {/* 材料 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900">{skuData.material}</div>
                </td>
                
                {/* 包装方式 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900">{skuData.packagingMethod}</div>
                </td>
                
                {/* 验收时间 */}
                <td className="py-3 px-3 text-center">
                  <div className="text-xs text-gray-600">
                    {new Date(skuData.request.updatedAt).toLocaleDateString('zh-CN')}
                  </div>
                </td>
                
                {/* 验收状态 */}
                <td className="py-3 px-3 text-center">
                  <StatusBadge status="验收完成" color="green" size="sm" />
                </td>
                
                {/* 操作 */}
                {canManageProduction && (
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col space-y-1">
                      <button className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                        验收记录
                      </button>
                      <button className="px-2 py-1 text-xs text-green-600 border border-green-600 rounded hover:bg-green-50 transition-colors">
                        下载报告
                      </button>
                    </div>
                  </td>
                )}
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
            <h1 className="text-2xl font-bold text-gray-900">自己包装</h1>
            <p className="text-gray-600">以SKU为单位管理自己包装订单的生产和验收流程</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索SKU或订单号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Factory className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">SKU: {filteredSKUData.length}</span>
            </div>
          </div>
        </div>

        {/* 更新的业务规则说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-800">SKU流转规则</h3>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>待完成SKU</strong>：采购进度 {'<'} 100% 或 辅料进度 ≤ 80%</p>
            <p>• <strong>待验收SKU</strong>：采购进度 = 100% 且 辅料进度 {'>'} 80%（自动流转）</p>
            <p>• <strong>已验收SKU</strong>：完成产品验收和质量检查</p>
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
              <span>待完成SKU</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.inProgress}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pending_inspection')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pending_inspection'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="h-5 w-5" />
              <span>待验收SKU</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'pending_inspection' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.pendingInspection}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed_inspection')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'completed_inspection'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>已验收SKU</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'completed_inspection' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.completedInspection}
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {filteredSKUData.length === 0 ? (
          <div className="text-center py-12">
            <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'in_progress' ? '没有待完成的SKU' : 
               activeTab === 'pending_inspection' ? '没有待验收的SKU' : 
               '没有已验收的SKU'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'in_progress' ? '所有SKU都已完成生产准备' : 
               activeTab === 'pending_inspection' ? '没有满足验收条件的SKU' : 
               '还没有完成验收的SKU'}
            </p>
          </div>
        ) : (
          renderTabContent()
        )}

        {/* Inspection Modal */}
        {showInspectionModal && (
          <InspectionModal
            requestId={showInspectionModal}
            onClose={() => setShowInspectionModal(null)}
            onSuccess={() => {
              setShowInspectionModal(null);
              // Refresh data or update state
            }}
          />
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