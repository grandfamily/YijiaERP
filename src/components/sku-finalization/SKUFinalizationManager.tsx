import React, { useState } from 'react';
import { CheckCircle, X, Upload, Download, Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { SKUFinalization, SKU } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { BulkFinalizationUpload } from './BulkFinalizationUpload';

interface SKUFinalizationManagerProps {
  embedded?: boolean;
}

export const SKUFinalizationManager: React.FC<SKUFinalizationManagerProps> = ({ embedded = false }) => {
  const { getSKUFinalizations, getSKUs, updateSKUFinalization, createSKUFinalization } = useProcurement();
  const { hasPermission, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingFinalization, setEditingFinalization] = useState<SKUFinalization | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const finalizations = getSKUFinalizations();
  const skus = getSKUs();
  
  const filteredFinalizations = finalizations.filter(finalization =>
    finalization.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finalization.sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finalization.sku.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManageFinalization = user?.role === 'card_designer';

  const handleToggleFinalization = async (finalizationId: string, isFinalized: boolean) => {
    try {
      await updateSKUFinalization(finalizationId, {
        isFinalized,
        finalizedDate: isFinalized ? new Date() : undefined,
        finalizedBy: isFinalized ? user : undefined
      });
    } catch (error) {
      console.error('更新定稿状态失败:', error);
      alert('更新定稿状态失败，请重试');
    }
  };

  const handleExport = () => {
    const headers = ['SKU编码', '产品名称', '产品类别', '定稿状态', '定稿日期', '定稿人', '设计版本', '备注'];
    const csvContent = [
      headers.join(','),
      ...filteredFinalizations.map(finalization => [
        finalization.sku.code,
        finalization.sku.name,
        finalization.sku.category,
        finalization.isFinalized ? '已定稿' : '未定稿',
        finalization.finalizedDate ? finalization.finalizedDate.toLocaleDateString('zh-CN') : '',
        finalization.finalizedBy?.name || '',
        finalization.designVersion || '',
        finalization.remarks || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `SKU定稿状态_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFinalizationStats = () => {
    const total = filteredFinalizations.length;
    const finalized = filteredFinalizations.filter(f => f.isFinalized).length;
    const pending = total - finalized;
    const finalizationRate = total > 0 ? Math.round((finalized / total) * 100) : 0;

    return { total, finalized, pending, finalizationRate };
  };

  const stats = getFinalizationStats();

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">设计定稿管理</h2>
            <p className="text-gray-600">管理SKU的设计定稿状态，定稿后可直接进入生产环节</p>
          </div>
          <div className="flex items-center space-x-3">
            {canManageFinalization && (
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
                  <span>导出</span>
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>新增定稿</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">总SKU数量</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">已定稿</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.finalized}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">待定稿</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-600">定稿率</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.finalizationRate}%</p>
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
          <CheckCircle className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600">显示: {filteredFinalizations.length} 个SKU</span>
        </div>
      </div>

      {/* Finalization Table */}
      {filteredFinalizations.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有SKU定稿记录</h3>
          <p className="text-gray-600">开始管理SKU的设计定稿状态</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">SKU编码</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">产品名称</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">产品类别</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">定稿状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">定稿日期</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">定稿人</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">设计版本</th>
                  {canManageFinalization && (
                    <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFinalizations.map((finalization) => (
                  <tr key={finalization.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{finalization.sku.code}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">{finalization.sku.name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {finalization.sku.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge
                        status={finalization.isFinalized ? '已定稿' : '未定稿'}
                        color={finalization.isFinalized ? 'green' : 'yellow'}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-500 text-sm">
                        {finalization.finalizedDate 
                          ? finalization.finalizedDate.toLocaleDateString('zh-CN')
                          : '-'
                        }
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900">
                        {finalization.finalizedBy?.name || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900">
                        {finalization.designVersion || '-'}
                      </span>
                    </td>
                    {canManageFinalization && (
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setEditingFinalization(finalization)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="查看详情"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => setEditingFinalization(finalization)}
                            className="p-1 text-gray-400 hover:text-green-600 rounded"
                            title="编辑"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleFinalization(finalization.id, !finalization.isFinalized)}
                            className={`p-1 rounded ${
                              finalization.isFinalized 
                                ? 'text-gray-400 hover:text-yellow-600' 
                                : 'text-gray-400 hover:text-green-600'
                            }`}
                            title={finalization.isFinalized ? '取消定稿' : '标记为定稿'}
                          >
                            <CheckCircle className="h-4 w-4" />
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
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkFinalizationUpload 
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => setShowBulkUpload(false)}
        />
      )}

      {/* Edit Finalization Modal */}
      {editingFinalization && (
        <EditFinalizationModal 
          finalization={editingFinalization}
          onClose={() => setEditingFinalization(null)}
          onSuccess={() => setEditingFinalization(null)}
        />
      )}
    </div>
  );
};

interface EditFinalizationModalProps {
  finalization: SKUFinalization;
  onClose: () => void;
  onSuccess: () => void;
}

const EditFinalizationModal: React.FC<EditFinalizationModalProps> = ({ 
  finalization, 
  onClose, 
  onSuccess 
}) => {
  const { updateSKUFinalization } = useProcurement();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    isFinalized: finalization.isFinalized,
    designVersion: finalization.designVersion || '',
    remarks: finalization.remarks || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateSKUFinalization(finalization.id, {
        isFinalized: formData.isFinalized,
        finalizedDate: formData.isFinalized ? new Date() : undefined,
        finalizedBy: formData.isFinalized ? user : undefined,
        designVersion: formData.designVersion,
        remarks: formData.remarks
      });
      onSuccess();
    } catch (error) {
      console.error('更新定稿信息失败:', error);
      alert('更新定稿信息失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">编辑定稿信息 - {finalization.sku.code}</h2>
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
                <p className="font-medium">{finalization.sku.code}</p>
              </div>
              <div>
                <span className="text-gray-600">名称:</span>
                <p className="font-medium">{finalization.sku.name}</p>
              </div>
              <div>
                <span className="text-gray-600">类别:</span>
                <p className="font-medium">{finalization.sku.category}</p>
              </div>
              <div>
                <span className="text-gray-600">识别码:</span>
                <p className="font-medium">{finalization.sku.identificationCode}</p>
              </div>
            </div>
          </div>

          {/* Finalization Data */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isFinalized}
                  onChange={(e) => setFormData({...formData, isFinalized: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">已定稿</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                设计版本
              </label>
              <input
                type="text"
                value={formData.designVersion}
                onChange={(e) => setFormData({...formData, designVersion: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: v2.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入备注信息..."
              />
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};