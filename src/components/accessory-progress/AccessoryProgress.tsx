import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useProcurement } from '../../hooks/useProcurement';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { BulkCostUploadModal } from './BulkCostUploadModal';
import { 
  CheckSquare, 
  Square,
  Check,
  AlertCircle,
  Package,
  Truck,
  Box,
  Tag,
  FileText,
  Download,
  Upload,
  Save,
  X,
  Edit,
  Search,
  ZoomIn
} from 'lucide-react';

interface AccessoryProgressProps {
  embedded?: boolean;
  requestId?: string;
}

type TabType = 'incomplete' | 'completed';

export const AccessoryProgress: React.FC<AccessoryProgressProps> = ({ embedded = false, requestId }) => {
  const { user } = useAuth();
  const { 
    getAccessoryProgressByRequestId,
    getAccessoryProgress,
    getPurchaseRequests,
    getOrderAllocationByRequestId,
    updateAccessoryProgress,
    calculateAccessoryProgressGlobal
  } = useProcurement();

  const [activeTab, setActiveTab] = useState<TabType>('incomplete');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [editingCosts, setEditingCosts] = useState<{[key: string]: any}>({});
  const [showBulkCostUpload, setShowBulkCostUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 处理图片点击放大
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  const getRequestInfo = (requestId: string) => {
    return purchaseRequests.find(req => req.id === requestId);
  };

  // 检查订单是否已完成
  const isOrderCompleted = (requestId: string): boolean => {
    const progressList = progressByRequest[requestId] || [];
    if (progressList.length === 0) return false;
    
    return progressList.every(progress => {
      const accessories = progress.accessories || [];
      return accessories.every((acc: any) => acc.status === 'completed');
    });
  };

  // 获取数据
  const allAccessoryProgress = embedded && requestId 
    ? getAccessoryProgressByRequestId(requestId) || []
    : getAccessoryProgress() || [];
  
  const { data: purchaseRequests } = getPurchaseRequests();

  // 按订单分组进度数据
  const progressByRequest = React.useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    
    allAccessoryProgress.forEach(progress => {
      if (!grouped[progress.purchaseRequestId]) {
        grouped[progress.purchaseRequestId] = [];
      }
      grouped[progress.purchaseRequestId].push(progress);
    });
    
    return grouped;
  }, [allAccessoryProgress]);

  // 根据搜索条件过滤订单
  const filteredProgressByRequest = React.useMemo(() => {
    const filtered: { [key: string]: any[] } = {};
    
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


  // 计算进度百分比
  const calculateProgress = (accessories: any[]) => {
    return calculateAccessoryProgressGlobal(accessories);
  };

  // 处理单个辅料完成
  const handleAccessoryComplete = async (progressId: string, accessoryType: string) => {
    try {
      const progress = allAccessoryProgress.find(p => p.id === progressId);
      if (!progress) return;

      const updatedAccessories = progress.accessories.map((acc: any) => {
        if (acc.type === accessoryType) {
          return {
            ...acc,
            status: 'completed',
            completedDate: new Date(),
            actualDuration: acc.estimatedDuration
          };
        }
        return acc;
      });

      const newProgress = calculateProgress(updatedAccessories);

      await updateAccessoryProgress(progressId, {
        accessories: updatedAccessories,
        overallProgress: newProgress,
        updatedAt: new Date()
      });

    } catch (error) {
      console.error('完成辅料失败:', error);
    }
  };

  // 批量完成辅料（针对单个订单）
  const handleOrderBatchComplete = async (requestId: string, accessoryTypes: string[]) => {
    try {
      const progressList = progressByRequest[requestId] || [];
      const updates = [];

      for (const progress of progressList) {
        const updatedAccessories = progress.accessories.map((acc: any) => {
          if (accessoryTypes.includes(acc.type) && acc.status !== 'completed') {
            return {
              ...acc,
              status: 'completed',
              completedDate: new Date(),
              actualDuration: acc.estimatedDuration
            };
          }
          return acc;
        });

        const newProgress = calculateProgress(updatedAccessories);

        updates.push(updateAccessoryProgress(progress.id, {
          accessories: updatedAccessories,
          overallProgress: newProgress,
          updatedAt: new Date()
        }));
      }
      
      await Promise.all(updates);
    } catch (error) {
      console.error('批量完成失败:', error);
      alert('批量完成失败，请重试');
    }
  };

  // 全局批量完成辅料
  const handleGlobalBatchComplete = async (accessoryTypes: string[]) => {
    try {
      const updates = [];
      for (const requestId of Object.keys(filteredProgressByRequest)) {
        const progressList = progressByRequest[requestId] || [];
        for (const progress of progressList) {
          const updatedAccessories = progress.accessories.map((acc: any) => {
            if (accessoryTypes.includes(acc.type) && acc.status !== 'completed') {
              return {
                ...acc,
                status: 'completed',
                completedDate: new Date(),
                actualDuration: acc.estimatedDuration
              };
            }
            return acc;
          });

          const newProgress = calculateProgress(updatedAccessories);

          updates.push(updateAccessoryProgress(progress.id, {
            accessories: updatedAccessories,
            overallProgress: newProgress,
            updatedAt: new Date()
          }));
        }
      }
      
      await Promise.all(updates);
      
      const typeNames = accessoryTypes.map(type => getAccessoryTypeName(type)).join('、');
      alert(`成功批量完成所有订单的${typeNames}`);
    } catch (error) {
      console.error('批量完成失败:', error);
      alert('批量完成失败，请重试');
    }
  };

  // 处理成本编辑
  const handleCostEdit = (progressId: string, field: string, value: number) => {
    setEditingCosts(prev => ({
      ...prev,
      [progressId]: {
        ...prev[progressId],
        [field]: value
      }
    }));
  };

  // 保存成本
  const handleSaveCosts = async (progressId: string) => {
    try {
      const costs = editingCosts[progressId] || {};
      const totalCost = Object.values(costs).reduce((sum: number, cost: any) => sum + (parseFloat(cost) || 0), 0);

      await updateAccessoryProgress(progressId, {
        ...costs,
        totalCost,
        updatedAt: new Date()
      });

      setEditingCosts(prev => {
        const newState = { ...prev };
        delete newState[progressId];
        return newState;
      });

    } catch (error) {
      console.error('保存成本失败:', error);
      alert('保存成本失败，请重试');
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
    if (activeTab === 'incomplete') {
      // 未完成订单导出
      if (selectedOrders.length === 0) {
        // 导出所有未完成订单
        const exportData: any[] = [];
        
        Object.entries(filteredProgressByRequest).forEach(([requestId, progressList]) => {
          const request = getRequestInfo(requestId);
          
          progressList.forEach(progress => {
            progress.accessories.forEach((accessory: any) => {
              exportData.push({
                '订单编号': request?.requestNumber || '',
                'SKU编码': progress.sku?.code || '',
                '产品名称': progress.sku?.name || '',
                '辅料类型': getAccessoryTypeName(accessory.type),
                '周期类型': accessory.cycle === 'long' ? '长周期' : '短周期',
                '状态': accessory.status === 'completed' ? '已完成' : '未完成',
                '完成日期': accessory.completedDate ? new Date(accessory.completedDate).toLocaleDateString('zh-CN') : '',
                '整体进度': `${progress.overallProgress || 0}%`
              });
            });
          });
        });

        downloadCSV(exportData, `辅料进度_未完成订单_${new Date().toISOString().split('T')[0]}.csv`);
      } else {
        // 导出选中的未完成订单
        const exportData: any[] = [];
        
        selectedOrders.forEach(requestId => {
          const request = getRequestInfo(requestId);
          const progressList = filteredProgressByRequest[requestId] || [];
          
          progressList.forEach(progress => {
            progress.accessories.forEach((accessory: any) => {
              exportData.push({
                '订单编号': request?.requestNumber || '',
                'SKU编码': progress.sku?.code || '',
                '产品名称': progress.sku?.name || '',
                '辅料类型': getAccessoryTypeName(accessory.type),
                '周期类型': accessory.cycle === 'long' ? '长周期' : '短周期',
                '状态': accessory.status === 'completed' ? '已完成' : '未完成',
                '完成日期': accessory.completedDate ? new Date(accessory.completedDate).toLocaleDateString('zh-CN') : '',
                '整体进度': `${progress.overallProgress || 0}%`
              });
            });
          });
        });

        downloadCSV(exportData, `辅料进度_选中订单_${new Date().toISOString().split('T')[0]}.csv`);
        setSelectedOrders([]);
      }
    } else {
      // 已完成订单导出
      if (selectedOrders.length === 0) {
        alert('请先选择要导出的订单');
        return;
      }

      const exportData: any[] = [];
      
      selectedOrders.forEach(requestId => {
        const request = getRequestInfo(requestId);
        const progressList = filteredProgressByRequest[requestId] || [];
        
        progressList.forEach(progress => {
          exportData.push({
            '订单编号': request?.requestNumber || '',
            'SKU': progress.sku?.code || '',
            '产品名称': progress.sku?.name || '',
            '采购数量': progress.purchaseQuantity || 0,
            '泡壳': progress.blisterCost || 0,
            '中托': progress.trayCost || 0,
            '纸箱': progress.cartonCost || 0,
            '条码': progress.barcodeCost || 0,
            '唛头': progress.labelCost || 0,
            '刀版': progress.dieCost || 0,
            '模具': progress.moldCost || 0,
            '辅料总成本': progress.totalCost || 0
          });
        });
      });

      downloadCSV(exportData, `辅料成本明细_已完成订单_${new Date().toISOString().split('T')[0]}.csv`);
      setSelectedOrders([]);
    }
  };

  // 下载CSV文件
  const downloadCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // 获取辅料类型名称
  const getAccessoryTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'blister': '泡壳',
      'tray': '中托',
      'carton': '纸箱',
      'barcode': '条码',
      'label': '唛头'
    };
    return typeMap[type] || type;
  };

  // 获取辅料图标
  const getAccessoryIcon = (type: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'blister': <Package className="h-5 w-5" />,
      'tray': <Truck className="h-5 w-5" />,
      'carton': <Box className="h-5 w-5" />,
      'barcode': <Tag className="h-5 w-5" />,
      'label': <FileText className="h-5 w-5" />
    };
    return iconMap[type] || <Package className="h-5 w-5" />;
  };

  // 获取统计数据
  const getTabStats = () => {
    const allRequestIds = Object.keys(progressByRequest);
    const completedCount = allRequestIds.filter(requestId => isOrderCompleted(requestId)).length;
    const incompleteCount = allRequestIds.length - completedCount;
    
    return { incompleteCount, completedCount };
  };

  const tabStats = getTabStats();
  const canAccessoryPersonnel = user?.role === 'accessory_staff';

  return (
    <>
      <div className={embedded ? "space-y-4" : "p-6 space-y-6"}>
        {!embedded && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">辅料进度</h1>
              <p className="text-gray-600">按订单管理辅料制作和进度</p>
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
              {activeTab === 'completed' && canAccessoryPersonnel && (
                <button
                  onClick={() => setShowBulkCostUpload(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span>批量导入成本</span>
                </button>
              )}
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-600">
                  订单: {Object.keys(filteredProgressByRequest).length}
                </span>
              </div>
            </div>
          </div>
        )}

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
                <AlertCircle className="h-5 w-5" />
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
                <Check className="h-5 w-5" />
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
                {activeTab === 'incomplete' ? '未完成订单：所有SKU流程未全部完成或纸卡金额未填写完整' : '已完成订单：所有SKU流程已完成且纸卡金额已填写'}
              </div>
            </div>
          </div>
        </div>

        {Object.keys(filteredProgressByRequest).length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'incomplete' ? '暂无未完成订单' : '暂无已完成订单'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'incomplete' ? '所有订单都已完成辅料制作' : '还没有完成的辅料订单'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredProgressByRequest).map(([requestId, progressList]) => {
              const request = getRequestInfo(requestId);
              const allocation = getOrderAllocationByRequestId(requestId);
              const isSelected = selectedOrders.includes(requestId);
              const orderCompleted = isOrderCompleted(requestId);
              
              return (
                <div key={requestId} className={`bg-white rounded-lg shadow-sm border-2 transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } p-6`}>
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      {activeTab === 'incomplete' && (
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
                      )}
                      {activeTab === 'completed' && (
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
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request?.requestNumber || requestId}
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

                  {/* SKU Progress Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-16">图片</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-32">SKU</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 w-40">产品名称</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">采购数量</th>
                          {activeTab === 'incomplete' && (
                            <th className="text-center py-3 px-4 font-medium text-gray-900 w-20">整体进度</th>
                          )}
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">泡壳</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">中托</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">纸箱</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">条码</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">唛头</th>
                          {activeTab === 'completed' && (
                            <>
                              <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">刀版</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">模具</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-900 w-32">辅料总成本</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-900 w-24">操作</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {progressList.map((progress) => {
                          const accessories = progress.accessories || [];
                          const isEditing = editingCosts[progress.id];
                          
                          return (
                            <tr key={progress.id} className="hover:bg-gray-50">
                              {/* Product Image */}
                              <td className="py-4 px-4">
                                {progress.sku?.imageUrl ? (
                                  <div className="relative group">
                                    <img 
                                      src={progress.sku.imageUrl} 
                                      alt={progress.sku.name}
                                      className="w-10 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => handleImageClick(progress.sku.imageUrl!)}
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                                         onClick={() => handleImageClick(progress.sku.imageUrl!)}>
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
                                <div className="font-medium text-gray-900">{progress.sku?.code || 'N/A'}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-900">{progress.sku?.name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{progress.sku?.category}</div>
                              </td>
                              
                              {/* Purchase Quantity */}
                              <td className="py-4 px-4 text-center">
                                <span className="text-sm font-medium text-gray-900">
                                  {progress.purchaseQuantity?.toLocaleString() || 0}
                                </span>
                              </td>
                              
                              {/* Progress for Incomplete Orders */}
                              {activeTab === 'incomplete' && (
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

                              {/* Accessory Columns */}
                              {['blister', 'tray', 'carton', 'barcode', 'label'].map((type) => {
                                const accessory = accessories.find((acc: any) => acc.type === type);
                                const isCompleted = accessory?.status === 'completed';
                                
                                return (
                                  <td key={type} className="py-4 px-4 text-center">
                                    {activeTab === 'incomplete' ? (
                                      <div className="flex flex-col items-center space-y-2">
                                        <div className={`p-2 rounded-full ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                                          {React.cloneElement(getAccessoryIcon(type) as React.ReactElement, {
                                            className: `w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`
                                          })}
                                        </div>
                                        <StatusBadge
                                          status={isCompleted ? '已完成' : '未完成'}
                                          color={isCompleted ? 'green' : 'gray'}
                                          size="sm"
                                        />
                                        {canAccessoryPersonnel && !isCompleted && (
                                          <button
                                            onClick={() => handleAccessoryComplete(progress.id, type)}
                                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                          >
                                            完成
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center space-y-1">
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editingCosts[progress.id]?.[`${type}Cost`] || progress[`${type}Cost`] || 0}
                                            onChange={(e) => handleCostEdit(progress.id, `${type}Cost`, parseFloat(e.target.value) || 0)}
                                            className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                          />
                                        ) : (
                                          <span className="text-sm font-medium text-gray-900">
                                            ¥{progress[`${type}Cost`] || 0}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Additional Cost Columns for Completed Orders */}
                              {activeTab === 'completed' && (
                                <>
                                  {/* Die-cutting Cost */}
                                  <td className="py-4 px-4 text-center">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editingCosts[progress.id]?.dieCost || progress.dieCost || 0}
                                        onChange={(e) => handleCostEdit(progress.id, 'dieCost', parseFloat(e.target.value) || 0)}
                                        className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-gray-900">
                                        ¥{progress.dieCost || 0}
                                      </span>
                                    )}
                                  </td>
                                  
                                  {/* Mold Cost */}
                                  <td className="py-4 px-4 text-center">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editingCosts[progress.id]?.moldCost || progress.moldCost || 0}
                                        onChange={(e) => handleCostEdit(progress.id, 'moldCost', parseFloat(e.target.value) || 0)}
                                        className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-gray-900">
                                        ¥{progress.moldCost || 0}
                                      </span>
                                    )}
                                  </td>
                                  
                                  {/* Total Cost */}
                                  <td className="py-4 px-4 text-center">
                                    <span className="text-sm font-bold text-blue-600">
                                      ¥{(() => {
                                        const blisterCost = (isEditing ? editingCosts[progress.id]?.blisterCost : progress.blisterCost) || 0;
                                        const trayCost = (isEditing ? editingCosts[progress.id]?.trayCost : progress.trayCost) || 0;
                                        const cartonCost = (isEditing ? editingCosts[progress.id]?.cartonCost : progress.cartonCost) || 0;
                                        const barcodeCost = (isEditing ? editingCosts[progress.id]?.barcodeCost : progress.barcodeCost) || 0;
                                        const labelCost = (isEditing ? editingCosts[progress.id]?.labelCost : progress.labelCost) || 0;
                                        const dieCost = (isEditing ? editingCosts[progress.id]?.dieCost : progress.dieCost) || 0;
                                        const moldCost = (isEditing ? editingCosts[progress.id]?.moldCost : progress.moldCost) || 0;
                                        
                                        const totalCost = blisterCost + trayCost + cartonCost + barcodeCost + labelCost + dieCost + moldCost;
                                        return totalCost.toFixed(2);
                                      })()}
                                    </span>
                                  </td>
                                  
                                  {/* Actions */}
                                  <td className="py-4 px-4 text-center">
                                    {canAccessoryPersonnel && (
                                      <div className="flex items-center justify-center space-x-2">
                                        {isEditing ? (
                                          <>
                                            <button
                                              onClick={() => handleSaveCosts(progress.id)}
                                              className="p-1 text-green-600 hover:text-green-800 rounded"
                                              title="保存"
                                            >
                                              <Save className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => setEditingCosts(prev => {
                                                const newState = { ...prev };
                                                delete newState[progress.id];
                                                return newState;
                                              })}
                                              className="p-1 text-gray-600 hover:text-gray-800 rounded"
                                              title="取消"
                                            >
                                              <X className="h-4 w-4" />
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            onClick={() => setEditingCosts(prev => ({
                                              ...prev,
                                              [progress.id]: {
                                                blisterCost: progress.blisterCost || 0,
                                                trayCost: progress.trayCost || 0,
                                                cartonCost: progress.cartonCost || 0,
                                                barcodeCost: progress.barcodeCost || 0,
                                                labelCost: progress.labelCost || 0,
                                                dieCost: progress.dieCost || 0,
                                                moldCost: progress.moldCost || 0
                                              }
                                            }))}
                                            className="p-1 text-blue-600 hover:text-blue-800 rounded"
                                            title="编辑成本"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                        
                        {/* Batch Complete Buttons Row for Incomplete Orders */}
                        {activeTab === 'incomplete' && canAccessoryPersonnel && (
                          <tr className="bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-700" colSpan={5}>
                              批量完成
                            </td>
                            {/* Blister Batch Complete */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleOrderBatchComplete(requestId, ['blister'])}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                批量完成
                              </button>
                            </td>
                            {/* Tray Batch Complete */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleOrderBatchComplete(requestId, ['tray'])}
                                className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                              >
                                批量完成
                              </button>
                            </td>
                            {/* Short Cycle Batch Complete */}
                            <td className="py-3 px-4 text-center" colSpan={3}>
                              <button
                                onClick={() => handleOrderBatchComplete(requestId, ['carton', 'barcode', 'label'])}
                                className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                              >
                                批量完成
                              </button>
                            </td>
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

      {/* 添加搜索状态 */}
      <div className="text-sm text-gray-500">
        {searchTerm ? (
          <span>搜索结果: {Object.keys(filteredProgressByRequest).length} 个订单</span>
        ) : (
          <span>显示: {Object.keys(filteredProgressByRequest).length} 个订单</span>
        )}
      </div>

      {/* Bulk Cost Upload Modal */}
      {showBulkCostUpload && (
        <BulkCostUploadModal
          onClose={() => setShowBulkCostUpload(false)}
          onSuccess={() => setShowBulkCostUpload(false)}
        />
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