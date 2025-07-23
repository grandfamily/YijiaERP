import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { AccessoryProgress } from '../../types';

interface AccessoryCostEditModalProps {
  progressId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AccessoryCostEditModal: React.FC<AccessoryCostEditModalProps> = ({
  progressId,
  onClose,
  onSuccess
}) => {
  const { getAccessoryProgress, updateAccessoryProgress } = useProcurement();
  const [loading, setLoading] = useState(false);
  
  const progress = getAccessoryProgress().find(p => p.id === progressId);
  
  const [formData, setFormData] = useState({
    blisterCost: progress?.accessories.find(a => a.type === 'blister')?.cost || 0,
    trayCost: progress?.accessories.find(a => a.type === 'tray')?.cost || 0,
    cartonCost: progress?.accessories.find(a => a.type === 'carton')?.cost || 0,
    barcodeCost: progress?.accessories.find(a => a.type === 'barcode')?.cost || 0,
    labelCost: progress?.accessories.find(a => a.type === 'label')?.cost || 0,
    moldCost: progress?.moldCost || 0,
    dieCost: progress?.dieCost || 0
  });

  if (!progress) {
    return null;
  }

  const getTotalCost = () => {
    return Object.values(formData).reduce((sum, cost) => sum + (cost || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 更新辅料项目成本
      const updatedAccessories = progress.accessories.map(accessory => {
        let cost = 0;
        switch (accessory.type) {
          case 'blister': cost = formData.blisterCost; break;
          case 'tray': cost = formData.trayCost; break;
          case 'carton': cost = formData.cartonCost; break;
          case 'barcode': cost = formData.barcodeCost; break;
          case 'label': cost = formData.labelCost; break;
        }
        return { ...accessory, cost };
      });

      await updateAccessoryProgress(progressId, {
        accessories: updatedAccessories,
        moldCost: formData.moldCost,
        dieCost: formData.dieCost,
        totalCost: getTotalCost(),
        updatedAt: new Date()
      });

      onSuccess();
    } catch (error) {
      console.error('更新辅料成本失败:', error);
      alert('更新辅料成本失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            编辑辅料成本 - {progress.sku.code}
          </h2>
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
            <h3 className="text-sm font-medium text-gray-700 mb-2">SKU信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">编码:</span>
                <p className="font-medium">{progress.sku.code}</p>
              </div>
              <div>
                <span className="text-gray-600">名称:</span>
                <p className="font-medium">{progress.sku.name}</p>
              </div>
              <div>
                <span className="text-gray-600">采购数量:</span>
                <p className="font-medium">{progress.purchaseQuantity?.toLocaleString() || 0}</p>
              </div>
              <div>
                <span className="text-gray-600">类别:</span>
                <p className="font-medium">{progress.sku.category}</p>
              </div>
            </div>
          </div>

          {/* Cost Input Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">辅料成本明细</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  泡壳成本 (元) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.blisterCost}
                  onChange={(e) => setFormData({...formData, blisterCost: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  中托成本 (元) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.trayCost}
                  onChange={(e) => setFormData({...formData, trayCost: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  纸箱成本 (元) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cartonCost}
                  onChange={(e) => setFormData({...formData, cartonCost: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  条码成本 (元) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.barcodeCost}
                  onChange={(e) => setFormData({...formData, barcodeCost: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  唛头成本 (元) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.labelCost}
                  onChange={(e) => setFormData({...formData, labelCost: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模具成本 (元) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.moldCost}
                  onChange={(e) => setFormData({...formData, moldCost: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  刀版成本 (元) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.dieCost}
                  onChange={(e) => setFormData({...formData, dieCost: parseFloat(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Total Cost Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-blue-800">辅料总成本:</span>
              <span className="text-2xl font-bold text-blue-900">¥{getTotalCost().toFixed(2)}</span>
            </div>
            <div className="text-sm text-blue-600 mt-2 grid grid-cols-2 gap-2">
              <div>泡壳: ¥{formData.blisterCost.toFixed(2)}</div>
              <div>中托: ¥{formData.trayCost.toFixed(2)}</div>
              <div>纸箱: ¥{formData.cartonCost.toFixed(2)}</div>
              <div>条码: ¥{formData.barcodeCost.toFixed(2)}</div>
              <div>唛头: ¥{formData.labelCost.toFixed(2)}</div>
              <div>模具: ¥{formData.moldCost.toFixed(2)}</div>
              <div>刀版: ¥{formData.dieCost.toFixed(2)}</div>
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
              <span>{loading ? '保存中...' : '保存成本'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};