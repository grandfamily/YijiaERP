import React, { useState } from 'react';
import { Package, Upload, Download, Search, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { InventoryItem } from '../../types';
import { BulkInventoryUpload } from './BulkInventoryUpload';
import { EditInventory } from './EditInventory';

export const Inventory: React.FC = () => {
  const { getInventory, updateInventory, deleteInventory } = useProcurement();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const inventory = getInventory();
  
  const filteredInventory = inventory.filter(item =>
    item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManageInventory = hasPermission('manage_inventory') || hasPermission('manage_products');

  const handleDelete = async (itemId: string) => {
    if (window.confirm('确定要删除这个库存记录吗？')) {
      try {
        await deleteInventory(itemId);
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleExport = () => {
    const headers = ['SKU', '品名', '在途数', '在库数', '总库存', '补货周期', '补货点', '目标覆盖期', '预测月销量', '预计可售时间', '建议补货量', '状态'];
    const csvContent = [
      headers.join(','),
      ...filteredInventory.map(item => [
        item.sku.code,
        item.sku.name,
        item.inTransitQuantity,
        item.inStockQuantity,
        item.totalQuantity,
        item.replenishmentCycle,
        item.replenishmentPoint,
        item.targetCoveragePeriod,
        item.forecastMonthlySales,
        item.estimatedSalesDays,
        item.suggestedReplenishment,
        getStockStatus(item).status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `库存销量报表_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStockStatus = (item: InventoryItem) => {
    const { totalQuantity, replenishmentPoint } = item;
    
    if (totalQuantity > replenishmentPoint) {
      return { status: '库存充足', color: 'green' };
    } else if (totalQuantity > 0.8 * replenishmentPoint) {
      return { status: '建议补货', color: 'yellow' };
    } else {
      return { status: '库存不足', color: 'red' };
    }
  };

  const getTotalValue = () => {
    return filteredInventory.reduce((sum, item) => sum + item.totalQuantity, 0);
  };

  const getLowStockCount = () => {
    return filteredInventory.filter(item => item.totalQuantity <= 0.8 * item.replenishmentPoint).length;
  };

  const getOutOfStockCount = () => {
    return filteredInventory.filter(item => item.totalQuantity <= item.replenishmentPoint && item.totalQuantity > 0.8 * item.replenishmentPoint).length;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">库存销量</h1>
          <p className="text-gray-600">管理和监控所有SKU的库存状态和销量预测</p>
        </div>
        <div className="flex items-center space-x-3">
          {canManageInventory && (
            <>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span>批量导入</span>
              </button>
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>导出报表</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">总SKU数量</h3>
              <p className="text-2xl font-bold text-gray-900">{filteredInventory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">总库存数量</h3>
              <p className="text-2xl font-bold text-gray-900">{getTotalValue().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">库存不足SKU</h3>
              <p className="text-2xl font-bold text-gray-900">{getLowStockCount()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">建议补货SKU</h3>
              <p className="text-2xl font-bold text-gray-900">{getOutOfStockCount()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索SKU编码、产品名称、类别..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600">显示: {filteredInventory.length} 个SKU</span>
        </div>
      </div>

      {/* Inventory Table */}
      {filteredInventory.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有库存销量记录</h3>
          <p className="text-gray-600">开始导入库存销量数据</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">SKU</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">品名</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">在途数</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">在库数</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">总库存</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">补货周期（天）</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">补货点</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">目标覆盖期（天）</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">预测月销量</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">预计可售（天）</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">建议补货量</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">状态</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">更新时间</th>
                  {canManageInventory && (
                    <th className="text-center py-3 px-4 font-medium text-gray-900">操作</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-center">
                        <div className="font-medium text-gray-900">{item.sku.code}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-900">{item.sku.name}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-900 font-medium">{item.inTransitQuantity.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-900 font-medium">{item.inStockQuantity.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-900 font-bold">{item.totalQuantity.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-900">{item.replenishmentCycle}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-900 font-medium">{item.replenishmentPoint.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-900">{item.targetCoveragePeriod}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-900 font-medium">{item.forecastMonthlySales.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-900">{item.estimatedSalesDays}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-gray-900 font-medium text-blue-600">{item.suggestedReplenishment.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            stockStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                            stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {stockStatus.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-gray-500 text-sm">
                          {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      {canManageInventory && (
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => setEditingItem(item)}
                              className="p-1 text-gray-400 hover:text-green-600 rounded"
                              title="编辑"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkInventoryUpload 
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => setShowBulkUpload(false)}
        />
      )}

      {/* Edit Inventory Modal */}
      {editingItem && (
        <EditInventory 
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};