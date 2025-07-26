import React, { useState } from 'react';
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Package, 
  Search, 
  Clock,
  Save,
  Edit,
  Eye,
  ZoomIn,
  X,
  Calculator
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';

// Mock data for quality control - 扩展为SKU级别数据
const qualityControlData = [
  {
    id: 'qc-001',
    purchaseRequestNumber: 'PR-2024-001',
    skuId: 'sku-001',
    sku: {
      id: 'sku-001',
      code: 'ELE-001',
      name: '电子产品A',
      englishName: 'Electronic Product A',
      category: '电子产品',
      identificationCode: 'ID001',
      imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'
    },
    expectedQuantity: 100,
    receivedQuantity: 100,
    inspectionStatus: 'pending', // pending, completed
    inspectionDate: null,
    inspectorId: null,
    inspector: null,
    // 仓管人员填写的字段
    packageCount: null, // 中包数
    totalPieces: null, // 总件数
    piecesPerUnit: null, // 单件数量
    boxLength: null, // 外箱长(cm)
    boxWidth: null, // 外箱宽(cm)
    boxHeight: null, // 外箱高(cm)
    unitWeight: null, // 单件重量(kg)
    // 系统计算字段
    totalQuantity: null, // 总数量 = 总件数 * 单件数量
    boxVolume: null, // 外箱体积(m³) = 长*宽*高/1000000
    totalVolume: null, // 总体积(m³) = 总件数 * 外箱体积
    totalWeight: null, // 总重量(kg) = 总件数 * 单件重量
    remarks: '',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: 'qc-002',
    purchaseRequestNumber: 'PR-2024-001',
    skuId: 'sku-002',
    sku: {
      id: 'sku-002',
      code: 'ELE-002',
      name: '电子产品B',
      englishName: 'Electronic Product B',
      category: '电子产品',
      identificationCode: 'ID002',
      imageUrl: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg'
    },
    expectedQuantity: 50,
    receivedQuantity: 50,
    inspectionStatus: 'completed',
    inspectionDate: new Date('2024-01-26'),
    inspectorId: '4',
    inspector: {
      id: '4',
      name: '赵六',
      email: 'zhao.liu@company.com',
      role: 'warehouse_staff',
      department: '仓储部',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    // 已填写的数据
    packageCount: 5,
    totalPieces: 10,
    piecesPerUnit: 5,
    boxLength: 30,
    boxWidth: 20,
    boxHeight: 15,
    unitWeight: 0.5,
    // 计算结果
    totalQuantity: 50, // 10 * 5
    boxVolume: 0.009, // 30*20*15/1000000
    totalVolume: 0.09, // 10 * 0.009
    totalWeight: 5.0, // 10 * 0.5
    remarks: '验收完成，数据正常',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-26')
  },
  {
    id: 'qc-003',
    purchaseRequestNumber: 'PR-2024-002',
    skuId: 'sku-003',
    sku: {
      id: 'sku-003',
      code: 'TOY-001',
      name: '玩具B',
      englishName: 'Toy B',
      category: '玩具',
      identificationCode: 'ID003',
      imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'
    },
    expectedQuantity: 200,
    receivedQuantity: 180,
    inspectionStatus: 'pending',
    inspectionDate: null,
    inspectorId: null,
    inspector: null,
    packageCount: null,
    totalPieces: null,
    piecesPerUnit: null,
    boxLength: null,
    boxWidth: null,
    boxHeight: null,
    unitWeight: null,
    totalQuantity: null,
    boxVolume: null,
    totalVolume: null,
    totalWeight: null,
    remarks: '',
    createdAt: new Date('2024-01-24'),
    updatedAt: new Date('2024-01-24')
  }
];

type TabType = 'pending' | 'completed';

export const QualityControl: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 检查是否为仓管人员
  const isWarehouseStaff = user?.role === 'warehouse_staff';

  // 根据标签页过滤数据
  const getFilteredData = () => {
    const filtered = qualityControlData.filter(item => {
      const matchesTab = activeTab === 'pending' 
        ? item.inspectionStatus === 'pending'
        : item.inspectionStatus === 'completed';
      
      const matchesSearch = !searchTerm || 
        item.purchaseRequestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesTab && matchesSearch;
    });
    
    return filtered;
  };

  const filteredData = getFilteredData();

  // 获取统计数据
  const getTabStats = () => {
    const pending = qualityControlData.filter(item => item.inspectionStatus === 'pending').length;
    const completed = qualityControlData.filter(item => item.inspectionStatus === 'completed').length;
    return { pending, completed };
  };

  const tabStats = getTabStats();

  // 处理编辑模式
  const handleEdit = (itemId: string) => {
    const item = qualityControlData.find(i => i.id === itemId);
    if (item) {
      setEditingItem(itemId);
      setEditData({
        packageCount: item.packageCount || '',
        totalPieces: item.totalPieces || '',
        piecesPerUnit: item.piecesPerUnit || '',
        boxLength: item.boxLength || '',
        boxWidth: item.boxWidth || '',
        boxHeight: item.boxHeight || '',
        unitWeight: item.unitWeight || '',
        remarks: item.remarks || ''
      });
    }
  };

  // 处理数据变更
  const handleDataChange = (field: string, value: any) => {
    const newData = { ...editData, [field]: value };
    
    // 自动计算相关字段
    const totalPieces = parseFloat(newData.totalPieces) || 0;
    const piecesPerUnit = parseFloat(newData.piecesPerUnit) || 0;
    const boxLength = parseFloat(newData.boxLength) || 0;
    const boxWidth = parseFloat(newData.boxWidth) || 0;
    const boxHeight = parseFloat(newData.boxHeight) || 0;
    const unitWeight = parseFloat(newData.unitWeight) || 0;
    
    // 计算总数量
    newData.totalQuantity = totalPieces * piecesPerUnit;
    
    // 计算外箱体积 (m³)
    newData.boxVolume = (boxLength * boxWidth * boxHeight) / 1000000;
    
    // 计算总体积 (m³)
    newData.totalVolume = totalPieces * newData.boxVolume;
    
    // 计算总重量 (kg)
    newData.totalWeight = totalPieces * unitWeight;
    
    setEditData(newData);
  };

  // 保存数据
  const handleSave = (itemId: string) => {
    // 在实际应用中，这里会调用API保存数据
    console.log('保存验收数据:', itemId, editData);
    
    // 模拟保存成功
    const itemIndex = qualityControlData.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      qualityControlData[itemIndex] = {
        ...qualityControlData[itemIndex],
        ...editData,
        inspectionStatus: 'completed',
        inspectionDate: new Date(),
        inspectorId: user?.id,
        inspector: user,
        updatedAt: new Date()
      };
    }
    
    setEditingItem(null);
    setEditData({});
  };

  // 取消编辑
  const handleCancel = () => {
    setEditingItem(null);
    setEditData({});
  };

  // 处理图片点击
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 渲染可编辑字段
  const renderEditableField = (itemId: string, field: string, value: any, placeholder: string, unit?: string) => {
    const isEditing = editingItem === itemId;
    const displayValue = isEditing ? editData[field] : value;
    
    if (isEditing && isWarehouseStaff) {
      return (
        <input
          type="number"
          min="0"
          step="0.01"
          value={displayValue || ''}
          onChange={(e) => handleDataChange(field, e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent text-center"
          placeholder={placeholder}
        />
      );
    }
    
    return (
      <span className="text-sm text-gray-900">
        {displayValue ? `${displayValue}${unit || ''}` : '-'}
      </span>
    );
  };

  // 渲染计算字段
  const renderCalculatedField = (itemId: string, field: string, value: any, unit?: string, decimals: number = 2) => {
    const isEditing = editingItem === itemId;
    const displayValue = isEditing ? editData[field] : value;
    
    return (
      <span className="text-sm font-medium text-blue-600">
        {displayValue ? `${parseFloat(displayValue).toFixed(decimals)}${unit || ''}` : '-'}
      </span>
    );
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">验货入库</h1>
            <p className="text-gray-600">管理货物验收和入库检验，以SKU为单位进行详细数据记录</p>
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
            <div className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-600">
                SKU: {filteredData.length}
              </span>
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
              <span>待验收</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.pending}
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
              <span>已验收</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.completed}
              </span>
            </button>
          </nav>
        </div>

        {/* Content */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pending' ? '没有待验收的SKU' : '没有已验收的SKU'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pending' ? '所有SKU都已完成验收' : '还没有完成验收的SKU'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">订单编号</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-16">图片</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">SKU</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">品名</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-900 w-20">识别码</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">中包数</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">总件数</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">单件数量</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">总数量</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">外箱长(cm)</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">外箱宽(cm)</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">外箱高(cm)</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">外箱体积(m³)</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">总体积(m³)</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">单件重量(kg)</th>
                    <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">总重量(kg)</th>
                    {activeTab === 'completed' && (
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-32">验收时间</th>
                    )}
                    {isWarehouseStaff && (
                      <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">操作</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((item) => {
                    const isEditing = editingItem === item.id;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        {/* 订单编号 */}
                        <td className="py-3 px-3">
                          <div className="text-sm font-medium text-blue-600">{item.purchaseRequestNumber}</div>
                          <div className="text-xs text-gray-500">
                            {item.createdAt.toLocaleDateString('zh-CN')}
                          </div>
                        </td>
                        
                        {/* 图片 */}
                        <td className="py-3 px-3 text-center">
                          {item.sku.imageUrl ? (
                            <div className="relative group inline-block">
                              <img 
                                src={item.sku.imageUrl} 
                                alt={item.sku.name}
                                className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleImageClick(item.sku.imageUrl!)}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                                   onClick={() => handleImageClick(item.sku.imageUrl!)}>
                                <ZoomIn className="h-3 w-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                        
                        {/* SKU */}
                        <td className="py-3 px-3">
                          <div className="text-sm font-medium text-gray-900">{item.sku.code}</div>
                          <div className="text-xs text-gray-500">{item.sku.category}</div>
                        </td>
                        
                        {/* 品名 */}
                        <td className="py-3 px-3">
                          <div className="text-sm text-gray-900">{item.sku.name}</div>
                          <div className="text-xs text-gray-500">{item.sku.englishName}</div>
                        </td>
                        
                        {/* 识别码 */}
                        <td className="py-3 px-3">
                          <span className="text-sm text-gray-900">{item.sku.identificationCode}</span>
                        </td>
                        
                        {/* 中包数 - 可编辑 */}
                        <td className="py-3 px-3 text-center">
                          {renderEditableField(item.id, 'packageCount', item.packageCount, '0')}
                        </td>
                        
                        {/* 总件数 - 可编辑 */}
                        <td className="py-3 px-3 text-center">
                          {renderEditableField(item.id, 'totalPieces', item.totalPieces, '0')}
                        </td>
                        
                        {/* 单件数量 - 可编辑 */}
                        <td className="py-3 px-3 text-center">
                          {renderEditableField(item.id, 'piecesPerUnit', item.piecesPerUnit, '0')}
                        </td>
                        
                        {/* 总数量 - 计算字段 */}
                        <td className="py-3 px-3 text-center">
                          {renderCalculatedField(item.id, 'totalQuantity', item.totalQuantity, '', 0)}
                        </td>
                        
                        {/* 外箱长 - 可编辑 */}
                        <td className="py-3 px-3 text-center">
                          {renderEditableField(item.id, 'boxLength', item.boxLength, '0', 'cm')}
                        </td>
                        
                        {/* 外箱宽 - 可编辑 */}
                        <td className="py-3 px-3 text-center">
                          {renderEditableField(item.id, 'boxWidth', item.boxWidth, '0', 'cm')}
                        </td>
                        
                        {/* 外箱高 - 可编辑 */}
                        <td className="py-3 px-3 text-center">
                          {renderEditableField(item.id, 'boxHeight', item.boxHeight, '0', 'cm')}
                        </td>
                        
                        {/* 外箱体积 - 计算字段 */}
                        <td className="py-3 px-3 text-center">
                          {renderCalculatedField(item.id, 'boxVolume', item.boxVolume, 'm³', 6)}
                        </td>
                        
                        {/* 总体积 - 计算字段 */}
                        <td className="py-3 px-3 text-center">
                          {renderCalculatedField(item.id, 'totalVolume', item.totalVolume, 'm³', 3)}
                        </td>
                        
                        {/* 单件重量 - 可编辑 */}
                        <td className="py-3 px-3 text-center">
                          {renderEditableField(item.id, 'unitWeight', item.unitWeight, '0', 'kg')}
                        </td>
                        
                        {/* 总重量 - 计算字段 */}
                        <td className="py-3 px-3 text-center">
                          {renderCalculatedField(item.id, 'totalWeight', item.totalWeight, 'kg', 2)}
                        </td>
                        
                        {/* 验收时间 - 仅已验收显示 */}
                        {activeTab === 'completed' && (
                          <td className="py-3 px-3 text-center">
                            <div className="text-sm text-gray-900">
                              {item.inspectionDate ? item.inspectionDate.toLocaleDateString('zh-CN') : '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.inspector?.name || '-'}
                            </div>
                          </td>
                        )}
                        
                        {/* 操作 - 仅仓管人员可见 */}
                        {isWarehouseStaff && (
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSave(item.id)}
                                    className="p-1 text-green-600 hover:text-green-800 rounded"
                                    title="保存"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    className="p-1 text-gray-600 hover:text-gray-800 rounded"
                                    title="取消"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {activeTab === 'pending' && (
                                    <button
                                      onClick={() => handleEdit(item.id)}
                                      className="p-1 text-blue-600 hover:text-blue-800 rounded"
                                      title="开始验收"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  )}
                                  {activeTab === 'completed' && (
                                    <button
                                      onClick={() => handleEdit(item.id)}
                                      className="p-1 text-green-600 hover:text-green-800 rounded"
                                      title="修改数据"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
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

        {/* 计算说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-800">自动计算说明</h3>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>总数量</strong> = 总件数 × 单件数量</p>
            <p>• <strong>外箱体积(m³)</strong> = 外箱长 × 外箱宽 × 外箱高 ÷ 1,000,000</p>
            <p>• <strong>总体积(m³)</strong> = 总件数 × 外箱体积</p>
            <p>• <strong>总重量(kg)</strong> = 总件数 × 单件重量</p>
          </div>
        </div>
      </div>

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