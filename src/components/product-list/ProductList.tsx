import React, { useState } from 'react';
import { Plus, Search, Upload, Download, Edit, Trash2, Package } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { SKU } from '../../types';
import { CreateProduct } from './CreateProduct';
import { EditProduct } from './EditProduct';
import { BulkUpload } from './BulkUpload';

export const ProductList: React.FC = () => {
  const { getSKUs, deleteSKU } = useProcurement();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SKU | null>(null);

  const products = getSKUs();
  
  const filteredProducts = products.filter(product =>
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.identificationCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManageProducts = hasPermission('manage_products');

  const handleDelete = async (productId: string) => {
    if (window.confirm('确定要删除这个产品吗？此操作不可撤销。')) {
      try {
        await deleteSKU(productId);
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleExport = () => {
    // 导出产品列表为CSV
    const headers = ['SKU编码', '产品名称', '英文品名', '产品类别', '识别码', '图片地址'];
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(product => [
        product.code,
        product.name,
        product.englishName,
        product.category,
        product.identificationCode,
        product.imageUrl || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `产品列表_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-3">
          {canManageProducts && (
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
                <span>新增产品</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索产品编码、名称、类别..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600">总计: {filteredProducts.length} 个产品</span>
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有产品记录</h3>
          <p className="text-gray-600">开始添加产品信息</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">SKU编码</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">产品名称</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">英文品名</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">产品类别</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">识别码</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">图片</th>
                  {canManageProducts && (
                    <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{product.code}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">{product.name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">{product.englishName}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-900">{product.identificationCode}</div>
                    </td>
                    <td className="py-4 px-4">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </td>
                    {canManageProducts && (
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setEditingProduct(product)}
                            className="p-1 text-gray-400 hover:text-green-600 rounded"
                            title="编辑"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Create Product Modal */}
      {showCreateForm && (
        <CreateProduct 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProduct 
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => setEditingProduct(null)}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUpload 
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => setShowBulkUpload(false)}
        />
      )}
    </div>
  );
};