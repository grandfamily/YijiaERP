import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Play, 
  Square, 
  CheckSquare,
  Package,
  Settings,
  Save,
  X
} from 'lucide-react';
import { useProduction } from '../../hooks/useProduction';
import { useAuth } from '../../hooks/useAuth';
import { ProductionSchedule, ProductionStatus } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ScheduleForm } from './ScheduleForm';
import { BulkScheduleForm } from './BulkScheduleForm';

type TabType = 'pending' | 'in_production' | 'completed';

export const ProductionScheduling: React.FC = () => {
  const { 
    pendingSchedules, 
    inProductionSchedules, 
    completedSchedules, 
    productionStats,
    bulkUpdateProductionStatus,
    getAvailableMachines
  } = useProduction();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showBulkScheduleForm, setShowBulkScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ProductionSchedule | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<{type: string, ids: string[]} | null>(null);

  // 检查是否有生产排单权限
  const canManageProduction = user?.role === 'production_staff';

  // 根据当前标签页获取数据
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'pending':
        return pendingSchedules;
      case 'in_production':
        return inProductionSchedules;
      case 'completed':
        return completedSchedules;
      default:
        return [];
    }
  };

  // 过滤数据
  const filteredData = getCurrentTabData().filter(item => 
    item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.machine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 处理全选
  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map(item => item.id));
    }
  };

  // 处理单选
  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // 处理批量开始生产
  const handleBulkStartProduction = () => {
    if (selectedItems.length === 0) return;
    setShowConfirmation({
      type: 'start_production',
      ids: selectedItems
    });
  };

  // 处理批量完成生产
  const handleBulkCompleteProduction = () => {
    if (selectedItems.length === 0) return;
    setShowConfirmation({
      type: 'complete_production',
      ids: selectedItems
    });
  };

  // 确认批量操作
  const confirmBulkAction = async () => {
    if (!showConfirmation) return;
    
    try {
      if (showConfirmation.type === 'start_production') {
        await bulkUpdateProductionStatus(showConfirmation.ids, 'in_production', user?.id);
      } else if (showConfirmation.type === 'complete_production') {
        await bulkUpdateProductionStatus(showConfirmation.ids, 'completed', user?.id);
      }
      
      setSelectedItems([]);
      setShowConfirmation(null);
    } catch (error) {
      console.error('批量操作失败:', error);
      alert('操作失败，请重试');
    }
  };

  // 导出数据
  const handleExport = () => {
    const data = filteredData.map(item => ({
      '排单日期': item.scheduledDate.toLocaleDateString('zh-CN'),
      'SKU': item.sku.code,
      '品名': item.sku.name,
      '计划数量': item.plannedQuantity,
      '包装方式': item.packagingMethod,
      '机器': item.machine,
      '状态': getStatusText(item.status),
      '开始日期': item.startDate ? item.startDate.toLocaleDateString('zh-CN') : '',
      '完成日期': item.endDate ? item.endDate.toLocaleDateString('zh-CN') : '',
      '完成数量': item.completedQuantity || '',
      '操作人': item.operator?.name || '',
      '备注': item.remarks || ''
    }));

    // 转换为CSV
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // 下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `生产排单_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 获取状态文本
  const getStatusText = (status: ProductionStatus) => {
    const statusMap = {
      'pending': '待排单',
      'scheduled': '已排单',
      'in_production': '生产中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 获取状态颜色
  const getStatusColor = (status: ProductionStatus) => {
    const colorMap = {
      'pending': 'yellow',
      'scheduled': 'blue',
      'in_production': 'purple',
      'completed': 'green',
      'cancelled': 'red'
    };
    return colorMap[status] || 'gray';
  };

  // 渲染标签页内容
  const renderTabContent = () => {
    return (
      <>
        {/* 批量操作工具栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
              >
                {selectedItems.length === filteredData.length && filteredData.length > 0 ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span>全选</span>
              </button>
              {selectedItems.length > 0 && (
                <span className="text-sm text-blue-600">
                  已选择 {selectedItems.length} 个项目
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {selectedItems.length > 0 && (
                <>
                  {activeTab === 'pending' && canManageProduction && (
                    <button
                      onClick={handleBulkStartProduction}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Play className="h-4 w-4" />
                      <span>批量开始生产</span>
                    </button>
                  )}
                  {activeTab === 'in_production' && canManageProduction && (
                    <button
                      onClick={handleBulkCompleteProduction}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>批量完成生产</span>
                    </button>
                  )}
                  <button
                    onClick={handleExport}
                    className="flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>导出选中</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pending' ? '没有待排单项目' : 
               activeTab === 'in_production' ? '没有生产中项目' : 
               '没有已完成项目'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pending' ? '所有项目都已排单' : 
               activeTab === 'in_production' ? '没有正在生产的项目' : 
               '还没有完成的生产项目'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-10 py-3 px-4 text-left font-medium text-gray-900">
                      <span className="sr-only">选择</span>
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-gray-900">排单日期</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-900">订单编号</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-900">SKU</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-900">品名</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-900">计划数量</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-900">包装方式</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-900">机器</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-900">状态</th>
                    {activeTab !== 'pending' && (
                      <>
                        <th className="py-3 px-4 text-left font-medium text-gray-900">开始日期</th>
                        {activeTab === 'completed' && (
                          <th className="py-3 px-4 text-left font-medium text-gray-900">完成日期</th>
                        )}
                        <th className="py-3 px-4 text-left font-medium text-gray-900">操作人</th>
                      </>
                    )}
                    <th className="py-3 px-4 text-left font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleSelectItem(item.id)}
                          className="flex items-center"
                        >
                          {selectedItems.includes(item.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {item.scheduledDate.toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="font-medium text-blue-600">
                          {item.purchaseRequestNumber || item.purchaseRequestId}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.purchaseRequestId.startsWith('manual') ? '手动创建' : '自动流转'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          {item.sku.imageUrl && (
                            <img 
                              src={item.sku.imageUrl} 
                              alt={item.sku.name}
                              className="w-10 h-10 object-cover rounded-md border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="font-medium text-gray-900">{item.sku.code}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-900">{item.sku.name}</div>
                        <div className="text-xs text-gray-500">{item.sku.englishName}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-900">
                        {item.plannedQuantity.toLocaleString()}
                        {item.completedQuantity !== undefined && (
                          <span className="text-sm text-gray-500 ml-1">
                            ({item.completedQuantity.toLocaleString()})
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-900">{item.packagingMethod}</td>
                      <td className="py-4 px-4 text-gray-900">{item.machine}</td>
                      <td className="py-4 px-4">
                        <StatusBadge
                          status={getStatusText(item.status)}
                          color={getStatusColor(item.status)}
                        />
                      </td>
                      {activeTab !== 'pending' && (
                        <>
                          <td className="py-4 px-4 text-sm text-gray-900">
                            {item.startDate ? item.startDate.toLocaleDateString('zh-CN') : '-'}
                          </td>
                          {activeTab === 'completed' && (
                            <td className="py-4 px-4 text-sm text-gray-900">
                              {item.endDate ? item.endDate.toLocaleDateString('zh-CN') : '-'}
                            </td>
                          )}
                          <td className="py-4 px-4 text-sm text-gray-900">
                            {item.operator?.name || '-'}
                          </td>
                        </>
                      )}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {canManageProduction && (
                            <>
                              {activeTab === 'pending' && (
                                <>
                                  <button
                                    onClick={() => setEditingSchedule(item)}
                                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                    title="编辑"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedItems([item.id]);
                                      handleBulkStartProduction();
                                    }}
                                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                                    title="开始生产"
                                  >
                                    <Play className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {activeTab === 'in_production' && (
                                <button
                                  onClick={() => {
                                    setSelectedItems([item.id]);
                                    handleBulkCompleteProduction();
                                  }}
                                  className="p-1 text-gray-400 hover:text-green-600 rounded"
                                  title="完成生产"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                          <button
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="查看详情"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">生产排单</h1>
          <p className="text-gray-600">管理生产排期和进度</p>
        </div>
        <div className="flex items-center space-x-4">
          {canManageProduction && activeTab === 'pending' && (
            <>
              <button
                onClick={() => setShowBulkScheduleForm(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-5 w-5" />
                <span>批量排单</span>
              </button>
              <button
                onClick={() => setShowScheduleForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>新增排单</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">待排单</h3>
              <p className="text-2xl font-bold text-gray-900">{productionStats.pending}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            计划数量: {productionStats.pendingQuantity.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <Play className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">生产中</h3>
              <p className="text-2xl font-bold text-gray-900">{productionStats.inProduction}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            计划数量: {productionStats.inProductionQuantity.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">已完成</h3>
              <p className="text-2xl font-bold text-gray-900">{productionStats.completed}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            完成数量: {productionStats.completedQuantity.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">完成率</h3>
              <p className="text-2xl font-bold text-gray-900">
                {productionStats.completionRate.toFixed(1)}%
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            总计划数量: {productionStats.totalQuantity.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索SKU、品名或机器..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="h-5 w-5" />
          <span>导出</span>
        </button>
        <button
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-5 w-5" />
          <span>筛选</span>
        </button>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-5 w-5" />
            <span>待排单</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {productionStats.pending}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('in_production')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'in_production'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Play className="h-5 w-5" />
            <span>生产中</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'in_production' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {productionStats.inProduction}
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
              {productionStats.completed}
            </span>
          </button>
        </nav>
      </div>

      {/* 标签页内容 */}
      {renderTabContent()}

      {/* 新增排单表单 */}
      {showScheduleForm && (
        <ScheduleForm
          onClose={() => setShowScheduleForm(false)}
          onSuccess={() => {
            setShowScheduleForm(false);
            setSelectedItems([]);
          }}
        />
      )}

      {/* 批量排单表单 */}
      {showBulkScheduleForm && (
        <BulkScheduleForm
          onClose={() => setShowBulkScheduleForm(false)}
          onSuccess={() => {
            setShowBulkScheduleForm(false);
            setSelectedItems([]);
          }}
        />
      )}

      {/* 编辑排单表单 */}
      {editingSchedule && (
        <ScheduleForm
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSuccess={() => {
            setEditingSchedule(null);
            setSelectedItems([]);
          }}
        />
      )}

      {/* 确认对话框 */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  {showConfirmation.type === 'start_production' ? (
                    <Play className="h-8 w-8 text-blue-600" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {showConfirmation.type === 'start_production' ? '确认开始生产' : '确认完成生产'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {showConfirmation.type === 'start_production' 
                      ? `确定要开始生产选中的 ${showConfirmation.ids.length} 个项目吗？`
                      : `确定要将选中的 ${showConfirmation.ids.length} 个项目标记为已完成吗？`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowConfirmation(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmBulkAction}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    showConfirmation.type === 'start_production'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};