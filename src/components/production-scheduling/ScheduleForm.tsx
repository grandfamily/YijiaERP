import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Package } from 'lucide-react';
import { useProduction } from '../../hooks/useProduction';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { ProductionSchedule } from '../../types';

interface ScheduleFormProps {
  schedule?: ProductionSchedule;
  onClose: () => void;
  onSuccess: () => void;
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  schedule, 
  onClose, 
  onSuccess 
}) => {
  const { createProductionSchedule, updateProductionSchedule, getAvailableMachines } = useProduction();
  const { getSKUs } = useProcurement();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    skuId: schedule?.skuId || '',
    scheduledDate: schedule?.scheduledDate.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    plannedQuantity: schedule?.plannedQuantity || 0,
    packagingMethod: schedule?.packagingMethod || '',
    machine: schedule?.machine || '',
    remarks: schedule?.remarks || ''
  });

  const [selectedSKU, setSelectedSKU] = useState(schedule?.sku || null);
  const [skuSearchTerm, setSkuSearchTerm] = useState('');
  const [showSKUDropdown, setShowSKUDropdown] = useState(false);

  const skus = getSKUs();
  const machines = getAvailableMachines();
  
  // 过滤SKU
  const filteredSKUs = skuSearchTerm
    ? skus.filter(sku => 
        sku.code.toLowerCase().includes(skuSearchTerm.toLowerCase()) ||
        sku.name.toLowerCase().includes(skuSearchTerm.toLowerCase())
      )
    : skus;

  // 当选择SKU时更新表单
  const handleSelectSKU = (sku: any) => {
    setSelectedSKU(sku);
    setFormData({
      ...formData,
      skuId: sku.id
    });
    setShowSKUDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSKU) return;

    setLoading(true);
    try {
      if (schedule) {
        // 更新现有排单
        await updateProductionSchedule(schedule.id, {
          skuId: formData.skuId,
          sku: selectedSKU,
          scheduledDate: new Date(formData.scheduledDate),
          plannedQuantity: formData.plannedQuantity,
          packagingMethod: formData.packagingMethod,
          machine: formData.machine,
          remarks: formData.remarks
        });
      } else {
        // 创建新排单
        await createProductionSchedule({
          skuId: formData.skuId,
          sku: selectedSKU,
          purchaseRequestId: 'manual-schedule', // 手动创建的排单
          scheduledDate: new Date(formData.scheduledDate),
          plannedQuantity: formData.plannedQuantity,
          packagingMethod: formData.packagingMethod,
          machine: formData.machine,
          status: 'pending',
          remarks: formData.remarks
        });
      }

      onSuccess();
    } catch (error) {
      console.error('保存排单失败:', error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {schedule ? '编辑生产排单' : '新增生产排单'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* SKU选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择SKU <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={selectedSKU ? `${selectedSKU.code} - ${selectedSKU.name}` : skuSearchTerm}
                onChange={(e) => {
                  setSkuSearchTerm(e.target.value);
                  setSelectedSKU(null);
                  setFormData({...formData, skuId: ''});
                  setShowSKUDropdown(true);
                }}
                onFocus={() => setShowSKUDropdown(true)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="搜索SKU编码或产品名称..."
                required
              />
              {showSKUDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredSKUs.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">未找到匹配的SKU</div>
                  ) : (
                    filteredSKUs.map(sku => (
                      <div
                        key={sku.id}
                        onClick={() => handleSelectSKU(sku)}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          {sku.imageUrl && (
                            <img 
                              src={sku.imageUrl} 
                              alt={sku.name}
                              className="w-8 h-8 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-medium">{sku.code}</div>
                            <div className="text-xs text-gray-500">{sku.name}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 排单日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              排单日期 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* 计划数量 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              计划数量 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.plannedQuantity}
              onChange={(e) => setFormData({...formData, plannedQuantity: parseInt(e.target.value) || 0})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入计划生产数量"
              required
            />
          </div>

          {/* 包装方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              包装方式 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.packagingMethod}
              onChange={(e) => setFormData({...formData, packagingMethod: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入包装方式"
              required
            />
          </div>

          {/* 机器 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              机器 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.machine}
              onChange={(e) => setFormData({...formData, machine: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">请选择机器</option>
              {machines.map(machine => (
                <option key={machine} value={machine}>{machine}</option>
              ))}
            </select>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入备注信息..."
            />
          </div>

          {/* 操作按钮 */}
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
              disabled={loading || !formData.skuId || !formData.machine || !formData.packagingMethod}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? '保存中...' : '保存'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};