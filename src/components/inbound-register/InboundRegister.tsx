import React from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalStore } from '../../store/globalStore';

type TabType = 'pending' | 'completed';

export const InboundRegister: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [zoomedImage, setZoomedImage] = React.useState<string | null>(null);
  const { user } = useAuth();
  const records = useGlobalStore((state) => state.inboundRegisters);
  const updateRecord = useGlobalStore((state) => state.updateInboundRegister);

  const isWarehouseStaff = user?.role === 'warehouse_staff';

  // 数据更新
  const handleDataUpdate = (itemId: string, field: string, value: string | number) => {
    if (!isWarehouseStaff) return;
    try {
      const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      updateRecord(itemId, { [field]: numericValue, updatedAt: new Date() });
    } catch (error) {
      console.error('数据更新失败:', error);
    }
  };

  // 保存
  const handleSave = (itemId: string) => {
    if (!isWarehouseStaff) {
      alert('权限不足：只有仓管人员可以保存数据');
      return;
    }
    try {
      const item = records.find((i: any) => i.id === itemId);
      if (!item) {
        alert('未找到对应的SKU数据');
        return;
      }
      const requiredFields = [
        { field: 'packageCount', name: '中包数' },
        { field: 'totalPieces', name: '总件数' },
        { field: 'piecesPerUnit', name: '单件数量' },
        { field: 'boxLength', name: '外箱长' },
        { field: 'boxWidth', name: '外箱宽' },
        { field: 'boxHeight', name: '外箱高' },
        { field: 'unitWeight', name: '单件重量' }
      ];
      const emptyFields = requiredFields.filter(({ field }) => {
        const value = item[field as keyof typeof item];
        return !value || value === 0;
      });
      if (emptyFields.length > 0) {
        const fieldNames = emptyFields.map(f => f.name).join('、');
        alert(`请填写完整信息：${fieldNames}`);
        return;
      }
      const packageCount = Number(item.packageCount) || 0;
      const totalPieces = Number(item.totalPieces) || 0;
      const piecesPerUnit = Number(item.piecesPerUnit) || 0;
      const boxLength = Number(item.boxLength) || 0;
      const boxWidth = Number(item.boxWidth) || 0;
      const boxHeight = Number(item.boxHeight) || 0;
      const unitWeight = Number(item.unitWeight) || 0;
      if (totalPieces <= 0 || piecesPerUnit <= 0 || boxLength <= 0 || boxWidth <= 0 || boxHeight <= 0 || unitWeight <= 0) {
        alert('所有数值必须大于0');
        return;
      }
      const totalQuantity = totalPieces * piecesPerUnit;
      const boxVolume = (boxLength * boxWidth * boxHeight) / 1000000;
      const totalVolume = totalPieces * boxVolume;
      const totalWeight = totalPieces * unitWeight;
      
      updateRecord(itemId, {
        packageCount,
        totalPieces,
        piecesPerUnit,
        boxLength,
        boxWidth,
        boxHeight,
        unitWeight,
        totalQuantity,
        boxVolume,
        totalVolume,
        totalWeight,
        status: 'completed',
        registerDate: new Date(),
        registerUserId: user?.id || '',
        registerUser: user,
        updatedAt: new Date()
      });
      
      // 同步到发货出柜"待发货" - 直接使用全局store添加质检记录
      const qualityControlRecord = {
        id: `qc-inbound-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purchaseRequestNumber: item.purchaseRequestNumber,
        skuId: item.skuId,
        sku: item.sku,
        expectedQuantity: item.expectedQuantity,
        receivedQuantity: item.receivedQuantity,
        inspectionStatus: 'pending' as const,
        inspectionDate: null,
        inspectorId: null,
        inspector: null,
        packageCount,
        totalPieces,
        piecesPerUnit,
        boxLength,
        boxWidth,
        boxHeight,
        unitWeight,
        totalQuantity,
        boxVolume,
        totalVolume,
        totalWeight,
        remarks: `来源：入库登记已完成 - 登记人员: ${user?.name || '未知'}`,
        status: 'pending_shipment' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 直接添加到全局store的质检记录（发货出柜的数据源）
      useGlobalStore.getState().addQualityControlRecord(qualityControlRecord);
      console.log(`已创建发货出柜记录: SKU ${item.sku?.code}, ID: ${qualityControlRecord.id}`);
      
      alert(`入库登记保存成功！SKU ${item.sku?.code} 已自动流转到发货出柜的"待发货"列表`);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 数据过滤
  const getFilteredData = () => {
    return records.filter((item: any) => {
      const matchesTab = activeTab === 'pending' 
        ? item.status === 'pending'
        : item.status === 'completed';
      const matchesSearch = !searchTerm || 
        item.purchaseRequestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  };

  const filteredData = getFilteredData();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">入库登记</h1>
          <p className="text-gray-600">管理入库商品的登记和详细信息</p>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            待入库 ({records.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            已入库 ({records.filter(r => r.status === 'completed').length})
          </button>
        </nav>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单编号、SKU代码或品名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 数据表格 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {activeTab === 'pending' ? '待入库列表' : '已入库列表'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单编号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">图片</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">品名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预期数量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">实收数量</th>
                {activeTab === 'pending' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中包数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总件数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单件数量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">外箱长(cm)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">外箱宽(cm)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">外箱高(cm)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单件重量(kg)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </>
                )}
                {activeTab === 'completed' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总数量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总体积(m³)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总重量(kg)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登记时间</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {item.purchaseRequestNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.productName}
                        className="h-10 w-10 rounded object-cover cursor-pointer"
                        onClick={() => setZoomedImage(item.image)}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">无图</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.identifier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.expectedQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.receivedQuantity}
                  </td>
                  {activeTab === 'pending' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.packageCount || ''}
                          onChange={(e) => handleDataUpdate(item.id, 'packageCount', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={!isWarehouseStaff}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.totalPieces || ''}
                          onChange={(e) => handleDataUpdate(item.id, 'totalPieces', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={!isWarehouseStaff}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.piecesPerUnit || ''}
                          onChange={(e) => handleDataUpdate(item.id, 'piecesPerUnit', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={!isWarehouseStaff}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.boxLength || ''}
                          onChange={(e) => handleDataUpdate(item.id, 'boxLength', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={!isWarehouseStaff}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.boxWidth || ''}
                          onChange={(e) => handleDataUpdate(item.id, 'boxWidth', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={!isWarehouseStaff}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.boxHeight || ''}
                          onChange={(e) => handleDataUpdate(item.id, 'boxHeight', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={!isWarehouseStaff}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitWeight || ''}
                          onChange={(e) => handleDataUpdate(item.id, 'unitWeight', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          disabled={!isWarehouseStaff}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSave(item.id)}
                          disabled={!isWarehouseStaff}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
                        >
                          保存
                        </button>
                      </td>
                    </>
                  )}
                  {activeTab === 'completed' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.totalQuantity || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.totalVolume ? item.totalVolume.toFixed(3) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.totalWeight ? item.totalWeight.toFixed(2) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.registerDate ? new Date(item.registerDate).toLocaleDateString('zh-CN') : '-'}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 图片放大模态框 */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-3xl max-h-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">商品图片</h3>
              <button
                onClick={() => setZoomedImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <img 
              src={zoomedImage} 
              alt="商品图片"
              className="max-w-full max-h-96 object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InboundRegister;
