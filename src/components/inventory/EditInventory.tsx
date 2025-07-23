import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { InventoryItem } from '../../types';

interface EditInventoryProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditInventory: React.FC<EditInventoryProps> = ({ item, onClose, onSuccess }) => {
  const { updateInventory } = useProcurement();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    inTransitQuantity: item.inTransitQuantity,
    inStockQuantity: item.inStockQuantity,
    replenishmentCycle: item.replenishmentCycle,
    replenishmentPoint: item.replenishmentPoint,
    targetCoveragePeriod: item.targetCoveragePeriod,
    forecastMonthlySales: item.forecastMonthlySales,
    estimatedSalesDays: item.estimatedSalesDays,
    suggestedReplenishment: item.suggestedReplenishment
  });

  const totalQuantity = formData.inTransitQuantity + formData.inStockQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateInventory(item.id, {
        inTransitQuantity: formData.inTransitQuantity,
        inStockQuantity: formData.inStockQuantity,
        replenishmentCycle: formData.replenishmentCycle,
        replenishmentPoint: formData.replenishmentPoint,
        targetCoveragePeriod: formData.targetCoveragePeriod,
        forecastMonthlySales: formData.forecastMonthlySales,
        estimatedSalesDays: formData.estimatedSalesDays,
        suggestedReplenishment: formData.suggestedReplenishment,
        totalQuantity: totalQuantity,
        updatedAt: new Date()
      });
      onSuccess();
    } catch (error) {
      console.error('更新库存失败:', error);
      alert('更新库存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">编辑库存 - {item.sku.code}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* SKU Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">产品信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">SKU:</span>
                <p className="font-medium">{item.sku.code}</p>
              </div>
              <div>
                <span className="text-gray-600">产品名称:</span>
                <p className="font-medium">{item.sku.name}</p>
              </div>
              <div>
                <span className="text-gray-600">类别:</span>
                <p className="font-medium">{item.sku.category}</p>
              </div>
              <div>
                <span className="text-gray-600">识别码:</span>
                <p className="font-medium">{item.sku.identificationCode}</p>
              </div>
            </div>
          </div>

          {/* Inventory Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                在途数量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.inTransitQuantity}
                onChange={(e) => setFormData({...formData, inTransitQuantity: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                在库数量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.inStockQuantity}
                onChange={(e) => setFormData({...formData, inStockQuantity: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                补货周期（天） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.replenishmentCycle}
                onChange={(e) => setFormData({...formData, replenishmentCycle: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                补货点 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.replenishmentPoint}
                onChange={(e) => setFormData({...formData, replenishmentPoint: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标覆盖期（天） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.targetCoveragePeriod}
                onChange={(e) => setFormData({...formData, targetCoveragePeriod: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预测月销量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.forecastMonthlySales}
                onChange={(e) => setFormData({...formData, forecastMonthlySales: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预计可售时间（天） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimatedSalesDays}
                onChange={(e) => setFormData({...formData, estimatedSalesDays: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                建议补货量 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.suggestedReplenishment}
                onChange={(e) => setFormData({...formData, suggestedReplenishment: parseInt(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">总库存:</span>
                <span className="text-lg font-bold text-blue-900">{totalQuantity.toLocaleString()}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">总库存 = 在途数量 + 在库数量</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-800">库存状态:</span>
                <span className={`text-lg font-bold ${
                  totalQuantity > formData.replenishmentPoint ? 'text-green-600' :
                  totalQuantity > 0.8 * formData.replenishmentPoint ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {totalQuantity > formData.replenishmentPoint ? '库存充足' :
                   totalQuantity > 0.8 * formData.replenishmentPoint ? '建议补货' :
                   '库存不足'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? '保存中...' : '保存修改'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};