import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { SKU } from '../../types';

interface CreateProductProps {
  onClose: () => void;
  onSuccess: () => void;
}

// 常用选项
const categoryOptions = [
  '厨房用品', '五金用品', '相框', '钟表', '镜子', '老外货', '其他'
];

export const CreateProduct: React.FC<CreateProductProps> = ({ onClose, onSuccess }) => {
  const { createSKU } = useProcurement();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    englishName: '',
    category: '',
    identificationCode: '',
    imageUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newSKU: Omit<SKU, 'id'> = {
        code: formData.code,
        name: formData.name,
        englishName: formData.englishName,
        category: formData.category,
        identificationCode: formData.identificationCode,
        imageUrl: formData.imageUrl || undefined
      };

      await createSKU(newSKU);
      onSuccess();
    } catch (error) {
      console.error('创建产品失败:', error);
      alert('创建产品失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">新增产品</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU编码 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: ELE-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                识别码 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.identificationCode}
                onChange={(e) => setFormData({...formData, identificationCode: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="内部识别码"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                产品名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="中文产品名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                英文品名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.englishName}
                onChange={(e) => setFormData({...formData, englishName: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="English Product Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                产品类别 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">请选择类别</option>
                {categoryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片地址
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Image Preview */}
          {formData.imageUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片预览
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                <img 
                  src={formData.imageUrl} 
                  alt="产品预览"
                  className="w-32 h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建产品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};