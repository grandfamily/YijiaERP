import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Upload, 
  Download,
  User,
  Factory,
  Play,
  Pause,
  RotateCcw,
  CheckSquare,
  Square
} from 'lucide-react';
import { useProduction } from '../../hooks/useProduction';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { ProductionSchedule, ProductionStatus } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ScheduleForm } from './ScheduleForm';
import { BulkScheduleForm } from './BulkScheduleForm';

type TabType = 'pending' | 'pre_schedule' | 'in_production' | 'completed';

interface BatchConfig {
  scheduledDate: string;
  productionBinding: Array<{
    machine: string;
    operator: string;
  }>;
  packaging: {
    operator: string;
  };
  blisterPackaging: {
    operator: string;
  };
  outerBoxPacking: {
    operator: string;
  };
}

export const ProductionScheduling: React.FC = () => {
  const { 
    getProductionSchedules, 
    updateProductionSchedule, 
    bulkUpdateProductionStatus,
    deleteProductionSchedule,
    getAvailableMachines,
    getProductionStats
  } = useProduction();
  
  const { getPurchaseRequests } = useProcurement();
  const { user, hasPermission } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<ProductionSchedule | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  
  // Batch configuration for pre-schedule
  const [batchConfig, setBatchConfig] = useState<BatchConfig>({
    scheduledDate: new Date().toISOString().split('T')[0],
    productionBinding: [{ machine: '', operator: '' }],
    packaging: { operator: '' },
    blisterPackaging: { operator: '' },
    outerBoxPacking: { operator: '' }
  });

  const allSchedules = getProductionSchedules();
  const machines = getAvailableMachines();
  const stats = getProductionStats();
  const { data: purchaseRequests } = getPurchaseRequests();

  // Get schedules based on active tab
  const getFilteredSchedules = () => {
    let filtered = allSchedules;
    
    switch (activeTab) {
      case 'pending':
        filtered = allSchedules.filter(s => s.status === 'pending');
        break;
      case 'pre_schedule':
        filtered = allSchedules.filter(s => s.status === 'scheduled');
        break;
      case 'in_production':
        filtered = allSchedules.filter(s => s.status === 'in_production');
        break;
      case 'completed':
        filtered = allSchedules.filter(s => s.status === 'completed');
        break;
    }

    if (searchTerm) {
      filtered = filtered.filter(schedule =>
        schedule.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.purchaseRequestNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredSchedules = getFilteredSchedules();

  // Get pre-schedule data (scheduled status)
  const preScheduleData = allSchedules.filter(s => s.status === 'scheduled');

  const canManageProduction = hasPermission('manage_production_scheduling') || hasPermission('edit_production_scheduling');

  // Handle selection
  const handleSelectAll = () => {
    if (selectedSchedules.length === filteredSchedules.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(filteredSchedules.map(s => s.id));
    }
  };

  const handleSelectSchedule = (scheduleId: string) => {
    if (selectedSchedules.includes(scheduleId)) {
      setSelectedSchedules(selectedSchedules.filter(id => id !== scheduleId));
    } else {
      setSelectedSchedules([...selectedSchedules, scheduleId]);
    }
  };

  // Handle status updates
  const handleStatusUpdate = async (scheduleIds: string[], newStatus: ProductionStatus) => {
    try {
      await bulkUpdateProductionStatus(scheduleIds, newStatus, user?.id);
      setSelectedSchedules([]);
    } catch (error) {
      console.error('更新状态失败:', error);
      alert('更新状态失败，请重试');
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (window.confirm('确定要删除这个生产排单吗？')) {
      try {
        await deleteProductionSchedule(scheduleId);
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  // Batch configuration handlers
  const addProductionBinding = () => {
    setBatchConfig({
      ...batchConfig,
      productionBinding: [...batchConfig.productionBinding, { machine: '', operator: '' }]
    });
  };

  const removeProductionBinding = (index: number) => {
    if (batchConfig.productionBinding.length > 1) {
      setBatchConfig({
        ...batchConfig,
        productionBinding: batchConfig.productionBinding.filter((_, i) => i !== index)
      });
    }
  };

  const updateProductionBinding = (index: number, field: 'machine' | 'operator', value: string) => {
    const newBindings = [...batchConfig.productionBinding];
    newBindings[index] = { ...newBindings[index], [field]: value };
    setBatchConfig({
      ...batchConfig,
      productionBinding: newBindings
    });
  };

  // Handle batch production confirmation
  const handleBatchProduction = async () => {
    if (selectedSchedules.length === 0) {
      alert('请先选择要排产的SKU');
      return;
    }

    // Validate batch configuration
    if (!batchConfig.scheduledDate) {
      alert('请选择排单日期');
      return;
    }

    const hasEmptyBinding = batchConfig.productionBinding.some(binding => 
      !binding.machine || !binding.operator
    );
    if (hasEmptyBinding) {
      alert('请完善生产绑卡配置');
      return;
    }

    if (!batchConfig.packaging.operator || !batchConfig.blisterPackaging.operator || !batchConfig.outerBoxPacking.operator) {
      alert('请完善所有操作员配置');
      return;
    }

    try {
      // Update selected schedules with batch configuration
      for (const scheduleId of selectedSchedules) {
        await updateProductionSchedule(scheduleId, {
          scheduledDate: new Date(batchConfig.scheduledDate),
          status: 'in_production',
          startDate: new Date(),
          operatorId: user?.id,
          operator: user,
          // Store batch configuration in remarks for now
          remarks: JSON.stringify(batchConfig)
        });
      }

      setSelectedSchedules([]);
      alert('批次生产配置成功！');
    } catch (error) {
      console.error('批次生产配置失败:', error);
      alert('批次生产配置失败，请重试');
    }
  };

  // Export schedule table
  const handleExportSchedule = () => {
    if (activeTab !== 'pre_schedule') {
      alert('请在预排单标签页中导出');
      return;
    }

    if (preScheduleData.length === 0) {
      alert('没有预排单数据可导出');
      return;
    }

    try {
      const headers = [
        '排单日期', '订单编号', 'SKU编码', '品名', '采购数量', '生产数量', 
        '材质', '包装方式', '生产绑卡机器', '生产绑卡操作员', 
        '包中托操作员', '吸塑包装操作员', '打包外箱操作员'
      ];

      const exportData: string[][] = [];

      preScheduleData.forEach(schedule => {
        // Parse batch configuration from remarks
        let config = batchConfig;
        try {
          if (schedule.remarks) {
            config = JSON.parse(schedule.remarks);
          }
        } catch (e) {
          // Use default config if parsing fails
        }

        // Get request info
        const request = purchaseRequests.find(r => r.id === schedule.purchaseRequestId);
        const requestNumber = request?.requestNumber || schedule.purchaseRequestNumber || '';

        // Determine number of rows based on production binding configurations
        const maxRows = Math.max(1, config.productionBinding.length);

        for (let i = 0; i < maxRows; i++) {
          const binding = config.productionBinding[i];
          const isFirstRow = i === 0;

          const row = [
            config.scheduledDate || schedule.scheduledDate.toLocaleDateString('zh-CN'),
            requestNumber,
            schedule.sku.code,
            schedule.sku.name,
            schedule.plannedQuantity.toString(),
            schedule.plannedQuantity.toString(), // 生产数量默认等于计划数量
            schedule.sku.category || '', // 材质使用类别
            schedule.packagingMethod || '',
            binding?.machine || '',
            binding?.operator || '',
            // 其他操作员只在第一行显示
            isFirstRow ? (config.packaging?.operator || '') : '',
            isFirstRow ? (config.blisterPackaging?.operator || '') : '',
            isFirstRow ? (config.outerBoxPacking?.operator || '') : ''
          ];

          exportData.push(row);
        }
      });

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `生产排单表_${batchConfig.scheduledDate}.csv`;
      link.click();

    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // Get tab statistics
  const getTabStats = () => {
    const pending = allSchedules.filter(s => s.status === 'pending').length;
    const preSchedule = allSchedules.filter(s => s.status === 'scheduled').length;
    const inProduction = allSchedules.filter(s => s.status === 'in_production').length;
    const completed = allSchedules.filter(s => s.status === 'completed').length;
    
    return { pending, preSchedule, inProduction, completed };
  };

  const tabStats = getTabStats();

  const getStatusColor = (status: ProductionStatus) => {
    const colors = {
      pending: 'yellow',
      scheduled: 'blue',
      in_production: 'purple',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'gray';
  };

  const getStatusText = (status: ProductionStatus) => {
    const statusMap = {
      pending: '待排单',
      scheduled: '已排单',
      in_production: '生产中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">生产排单</h1>
            <p className="text-gray-600">管理生产排期和进度跟踪</p>
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
            {activeTab === 'pre_schedule' && (
              <button
                onClick={handleExportSchedule}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>导出排单表</span>
              </button>
            )}
            {canManageProduction && (
              <>
                <button
                  onClick={() => setShowBulkForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span>批量导入</span>
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
            <div className="flex items-center space-x-2">
              <Factory className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">
                SKU: {filteredSchedules.length}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">待排单</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">预排单</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.inProduction}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Factory className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">生产中</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.inProduction}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">已完成</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
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
                {tabStats.pending}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pre_schedule')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pre_schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>预排单</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'pre_schedule' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.preSchedule}
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
              <Factory className="h-5 w-5" />
              <span>生产中</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'in_production' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.inProduction}
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

        {/* Action Bar for Pre-Schedule */}
        {activeTab === 'pre_schedule' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {selectedSchedules.length === filteredSchedules.length && filteredSchedules.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-medium">全选SKU</span>
                </button>
                {selectedSchedules.length > 0 && (
                  <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    已选择 {selectedSchedules.length} 个SKU
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {canManageProduction && selectedSchedules.length > 0 && (
                  <button
                    onClick={handleBatchProduction}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Play className="w-4 h-4" />
                    <span>确认生产</span>
                  </button>
                )}
                <div className="text-sm text-gray-500">
                  预排单：已安排生产计划但未开始生产的SKU
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {filteredSchedules.length === 0 ? (
          <div className="text-center py-12">
            <Factory className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pending' ? '没有待排单的SKU' : 
               activeTab === 'pre_schedule' ? '没有预排单的SKU' : 
               activeTab === 'in_production' ? '没有生产中的SKU' : 
               '没有已完成的SKU'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pending' ? '所有SKU都已安排生产' : 
               activeTab === 'pre_schedule' ? '没有已安排的生产计划' : 
               activeTab === 'in_production' ? '没有正在生产的SKU' : 
               '还没有完成生产的SKU'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {activeTab === 'pre_schedule' && (
                      <th className="text-left py-3 px-4 font-medium text-gray-900">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center space-x-2"
                        >
                          {selectedSchedules.length === filteredSchedules.length && filteredSchedules.length > 0 ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-900">订单编号</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">图片</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">品名</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">采购数量</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">生产数量</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">材质</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">包装方式</th>
                    {activeTab !== 'pre_schedule' && (
                      <>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">排单日期</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">机器</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">状态</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">操作员</th>
                      </>
                    )}
                    <th className="text-center py-3 px-4 font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      {activeTab === 'pre_schedule' && (
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleSelectSchedule(schedule.id)}
                            className="flex items-center"
                          >
                            {selectedSchedules.includes(schedule.id) ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-blue-600">
                          {schedule.purchaseRequestNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {schedule.sku.imageUrl ? (
                          <img 
                            src={schedule.sku.imageUrl} 
                            alt={schedule.sku.name}
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">{schedule.sku.code}</div>
                        <div className="text-sm text-gray-500">{schedule.sku.category}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">{schedule.sku.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900">{schedule.plannedQuantity.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-4">
                        {activeTab === 'pre_schedule' ? (
                          <input
                            type="number"
                            min="1"
                            defaultValue={schedule.plannedQuantity}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent text-center"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{schedule.completedQuantity || schedule.plannedQuantity}</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900">{schedule.sku.category}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-900">{schedule.packagingMethod}</span>
                      </td>
                      {activeTab !== 'pre_schedule' && (
                        <>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-500">
                              {schedule.scheduledDate.toLocaleDateString('zh-CN')}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-900">{schedule.machine}</span>
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge
                              status={getStatusText(schedule.status)}
                              color={getStatusColor(schedule.status)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-900">{schedule.operator?.name || '-'}</span>
                          </td>
                        </>
                      )}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {activeTab === 'pre_schedule' ? (
                            <button
                              onClick={() => handleStatusUpdate([schedule.id], 'pending')}
                              className="px-3 py-1 text-sm text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                            >
                              退回
                            </button>
                          ) : (
                            <>
                              {canManageProduction && (
                                <button 
                                  onClick={() => setEditingSchedule(schedule)}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                  title="编辑"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canManageProduction && schedule.status === 'pending' && (
                                <button 
                                  onClick={() => handleDelete(schedule.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                                  title="删除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                              {schedule.status === 'scheduled' && (
                                <button
                                  onClick={() => handleStatusUpdate([schedule.id], 'in_production')}
                                  className="px-3 py-1 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                >
                                  开始生产
                                </button>
                              )}
                              {schedule.status === 'in_production' && (
                                <button
                                  onClick={() => handleStatusUpdate([schedule.id], 'completed')}
                                  className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                  完成
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Batch Configuration */}
        {activeTab === 'pre_schedule' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-800 mb-4">批次生产配置</h3>
            
            {/* Scheduled Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                排单日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={batchConfig.scheduledDate}
                onChange={(e) => setBatchConfig({...batchConfig, scheduledDate: e.target.value})}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Production Binding Configuration */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生产绑卡 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {batchConfig.productionBinding.map((binding, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded border">
                    <select
                      value={binding.machine}
                      onChange={(e) => updateProductionBinding(index, 'machine', e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">选择机器</option>
                      <option value="大机器">大机器</option>
                      <option value="小机器1">小机器1</option>
                      <option value="小机器2">小机器2</option>
                      <option value="绑卡机">绑卡机</option>
                    </select>
                    <input
                      type="text"
                      value={binding.operator}
                      onChange={(e) => updateProductionBinding(index, 'operator', e.target.value)}
                      placeholder="操作员"
                      className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                    {batchConfig.productionBinding.length > 1 && (
                      <button
                        onClick={() => removeProductionBinding(index)}
                        className="p-2 text-red-600 hover:text-red-800 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addProductionBinding}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>添加机器配置</span>
                </button>
              </div>
            </div>

            {/* Other Operations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  包中托 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchConfig.packaging.operator}
                  onChange={(e) => setBatchConfig({
                    ...batchConfig,
                    packaging: { operator: e.target.value }
                  })}
                  placeholder="操作员"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  吸塑包装 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchConfig.blisterPackaging.operator}
                  onChange={(e) => setBatchConfig({
                    ...batchConfig,
                    blisterPackaging: { operator: e.target.value }
                  })}
                  placeholder="操作员"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  打包外箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchConfig.outerBoxPacking.operator}
                  onChange={(e) => setBatchConfig({
                    ...batchConfig,
                    outerBoxPacking: { operator: e.target.value }
                  })}
                  placeholder="操作员"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Configuration Instructions */}
            <div className="mt-6 bg-blue-100 border border-blue-300 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-800">批次配置说明</h4>
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• 排单日期：应用于所有选中的SKU</p>
                <p>• 生产绑卡：可配置多组机器和操作员，支持并行生产</p>
                <p>• 其他环节：包中托、吸塑包装、打包外箱各配置一名操作员</p>
                <p>• 配置完成后点击"确认生产"将批次配置应用于所有选中SKU</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <ScheduleForm 
          onClose={() => setShowScheduleForm(false)}
          onSuccess={() => setShowScheduleForm(false)}
        />
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <ScheduleForm 
          schedule={editingSchedule}
          onClose={() => setEditingSchedule(null)}
          onSuccess={() => setEditingSchedule(null)}
        />
      )}

      {/* Bulk Schedule Form Modal */}
      {showBulkForm && (
        <BulkScheduleForm 
          onClose={() => setShowBulkForm(false)}
          onSuccess={() => setShowBulkForm(false)}
        />
      )}
    </>
  );
};