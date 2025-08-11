
import React from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalStore } from '../../store/globalStore';

type TabType = 'pending' | 'completed';

export const QualityControl: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [zoomedImage, setZoomedImage] = React.useState<string | null>(null);
  const { user } = useAuth();
  const records = useGlobalStore(s => s.qualityControlRecords);
  const updateRecord = useGlobalStore(s => s.updateQualityControlRecord);

  // 全局store唯一流转，已无window事件依赖
  const isWarehouseStaff = user?.role === 'warehouse_staff';

  // 全局store唯一流转，自动补全逻辑由生产排单/到货检验流转时直接写入全局store

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
        inspectionStatus: 'completed',
        inspectionDate: new Date(),
        inspectorId: user?.id || '',
        inspector: user,
        updatedAt: new Date()
      });
      const updatedItem = {
        ...item,
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
        inspectionStatus: 'completed',
        inspectionDate: new Date(),
        inspectorId: user?.id || '',
        inspector: user
      };
      const shippingRecord = {
        id: `ship-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purchaseRequestNumber: updatedItem.purchaseRequestNumber,
        skuId: updatedItem.skuId,
        sku: updatedItem.sku,
        packageCount: updatedItem.packageCount,
        totalPieces: updatedItem.totalPieces,
        piecesPerUnit: updatedItem.piecesPerUnit,
        boxLength: updatedItem.boxLength,
        boxWidth: updatedItem.boxWidth,
        boxHeight: updatedItem.boxHeight,
        unitWeight: updatedItem.unitWeight,
        totalQuantity: updatedItem.totalQuantity,
        boxVolume: updatedItem.boxVolume,
        totalVolume: updatedItem.totalVolume,
        totalWeight: updatedItem.totalWeight,
        inspectionDate: updatedItem.inspectionDate,
        status: 'pending_shipment',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('addShippingRecord', {
          detail: shippingRecord
        });
        window.dispatchEvent(event);
      }
      alert(`验收数据保存成功！SKU ${updatedItem.sku.code} 已自动流转到发货出柜的"待发货"子栏目`);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 数据过滤
  const getFilteredData = () => {
    return records.filter((item: any) => {
      const matchesTab = activeTab === 'pending' 
        ? item.inspectionStatus === 'pending'
        : item.inspectionStatus === 'completed';
      const matchesSearch = !searchTerm || 
        item.purchaseRequestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  };

  // 渲染输入框
  const renderInputField = (item: any, field: string, placeholder: string, step: string = "1") => {
    const value = item[field] || '';
    return (
      <input
        type="number"
        min="0"
        step={step}
        value={value === 0 ? '' : value}
        onChange={(e) => handleDataUpdate(item.id, field, e.target.value)}
        disabled={!isWarehouseStaff}
        className={`w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isWarehouseStaff ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        placeholder={isWarehouseStaff ? placeholder : ''}
      />
    );
  };

  // 统计tab数量
  const getTabStats = () => {
    const pending = records.filter((item: any) => item.inspectionStatus === 'pending').length;
    const completed = records.filter((item: any) => item.inspectionStatus === 'completed').length;
    return { pending, completed };
  };
  const tabStats = getTabStats();

  // 图片放大

  // 渲染
  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">统计入库</h1>
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        {/* 选项卡 */}
        <div className="flex space-x-4 border-b pb-2">
          <button
            className={`px-4 py-2 font-semibold ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('pending')}
          >
            待统计 <span className="ml-1 text-xs bg-blue-100 text-blue-600 rounded px-2">{tabStats.pending}</span>
          </button>
          <button
            className={`px-4 py-2 font-semibold ${activeTab === 'completed' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('completed')}
          >
            已验收 <span className="ml-1 text-xs bg-green-100 text-green-600 rounded px-2">{tabStats.completed}</span>
          </button>
        </div>
        {/* 数据表格 */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">订单号</th>
                <th className="px-4 py-2 border-b">SKU编码</th>
                <th className="px-4 py-2 border-b">SKU名称</th>
                <th className="px-4 py-2 border-b">应到数量</th>
                <th className="px-4 py-2 border-b">实到数量</th>
                <th className="px-4 py-2 border-b">中包数</th>
                <th className="px-4 py-2 border-b">总件数</th>
                <th className="px-4 py-2 border-b">单件数量</th>
                <th className="px-4 py-2 border-b">外箱长</th>
                <th className="px-4 py-2 border-b">外箱宽</th>
                <th className="px-4 py-2 border-b">外箱高</th>
                <th className="px-4 py-2 border-b">单件重量</th>
                <th className="px-4 py-2 border-b">操作</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredData().map((item: any) => (
                <tr key={item.id} className="text-center">
                  <td className="px-4 py-2 border-b">{item.purchaseRequestNumber}</td>
                  <td className="px-4 py-2 border-b">{item.sku?.code}</td>
                  <td className="px-4 py-2 border-b">{item.sku?.name}</td>
                  <td className="px-4 py-2 border-b">{item.expectedQuantity}</td>
                  <td className="px-4 py-2 border-b">{item.receivedQuantity}</td>
                  <td className="px-2 py-2 border-b">{activeTab === 'pending' ? renderInputField(item, 'packageCount', '中包数') : item.packageCount}</td>
                  <td className="px-2 py-2 border-b">{activeTab === 'pending' ? renderInputField(item, 'totalPieces', '总件数') : item.totalPieces}</td>
                  <td className="px-2 py-2 border-b">{activeTab === 'pending' ? renderInputField(item, 'piecesPerUnit', '单件数量') : item.piecesPerUnit}</td>
                  <td className="px-2 py-2 border-b">{activeTab === 'pending' ? renderInputField(item, 'boxLength', '外箱长', '0.01') : item.boxLength}</td>
                  <td className="px-2 py-2 border-b">{activeTab === 'pending' ? renderInputField(item, 'boxWidth', '外箱宽', '0.01') : item.boxWidth}</td>
                  <td className="px-2 py-2 border-b">{activeTab === 'pending' ? renderInputField(item, 'boxHeight', '外箱高', '0.01') : item.boxHeight}</td>
                  <td className="px-2 py-2 border-b">{activeTab === 'pending' ? renderInputField(item, 'unitWeight', '单件重量', '0.001') : item.unitWeight}</td>
                  <td className="px-4 py-2 border-b">
                    {activeTab === 'pending' && isWarehouseStaff && (
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => handleSave(item.id)}
                      >保存</button>
                    )}
                    {activeTab === 'completed' && (
                      <span className="text-green-600">已验收</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* 图片放大弹窗 */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="relative">
            <img src={zoomedImage} alt="放大图片" className="max-w-2xl max-h-[80vh] rounded shadow-lg" />
            <button
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
              onClick={() => setZoomedImage(null)}
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      )}

    </>
  );
}

export default QualityControl;

