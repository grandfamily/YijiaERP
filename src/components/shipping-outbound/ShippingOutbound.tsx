
import React, { useState } from 'react';
import {
  Truck,
  Package,
  CheckCircle,
  Search,
  Square,
  CheckSquare,
  ArrowRight,
  ZoomIn,
  X,
  Calculator,
  Send,
  Download,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
// import { StatusBadge } from '../ui/StatusBadge';


import { useGlobalStore } from '../../store/globalStore';
import type { QualityControlRecord } from '../../store/qualityControl';
import type { Shipment } from '../../types';

type TabType = 'pending' | 'pre_shipment' | 'shipped';

export const ShippingOutbound: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const shippingData = useGlobalStore(s => s.qualityControlRecords) || [];
  const setShippingData = useGlobalStore(s => s.setQualityControlRecords);
  const shippedBatches = useGlobalStore(s => s.shipments) || [];
  const setShippedBatches = useGlobalStore(s => s.setShipments);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [viewingBatch, setViewingBatch] = useState<any>(null);

  // 全局store唯一流转，已无window事件依赖

  // 权限检查：是否为物流专员
  const isLogisticsStaff = user?.role === 'logistics_staff';

  // 根据标签页过滤数据
  const getFilteredData = () => {
    let filtered = shippingData.filter(item => {
      const matchesTab = activeTab === 'pending' 
        ? item.status === 'pending_shipment'
        : activeTab === 'pre_shipment'
        ? item.status === 'pre_shipment'
        : item.status === 'shipped';
      
      const matchesSearch = !searchTerm || 
        item.purchaseRequestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesTab && matchesSearch;
    });
    
    return filtered;
  };

  const filteredData = getFilteredData();

  // 处理全选
  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length && filteredData.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map(item => item.id));
    }
  };

  // 处理单选
  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // 计算选中项目的统计数据
  const getSelectedStats = () => {
    const selectedData = filteredData.filter((item: QualityControlRecord) => selectedItems.includes(item.id));
    if (activeTab === 'pre_shipment') {
      // 预发货栏目：计算发货数据
      const totalVolume = selectedData.reduce((sum: number, item: QualityControlRecord) => sum + (item.shipmentTotalVolume ?? 0), 0);
      const totalWeight = selectedData.reduce((sum: number, item: QualityControlRecord) => sum + (item.shipmentTotalWeight ?? 0), 0);
      return { totalVolume, totalWeight };
    } else {
      // 待发货栏目：计算总数据
      const totalVolume = selectedData.reduce((sum: number, item: QualityControlRecord) => sum + (item.totalVolume ?? 0), 0);
      const totalWeight = selectedData.reduce((sum: number, item: QualityControlRecord) => sum + (item.totalWeight ?? 0), 0);
      return { totalVolume, totalWeight };
    }
  };

  const selectedStats = getSelectedStats();

  // 导出发货批次详情
  const handleExportBatchDetails = (batch: Shipment) => {
    const exportData = batch.items.map((item: any) => ({
      '订单编号': item.item.purchaseRequestNumber || item.item.id,
      'SKU': item.item.sku.code,
      '品名': item.item.sku.name,
      '识别码': item.item.sku.identificationCode,
      '中包数': item.shippedPackageCount || item.item.packageCount || '-',
      '发货件数': item.shippedTotalPieces || item.item.totalPieces || '-',
      '单件数量': item.item.piecesPerUnit || '-',
      '发货总数量': item.shippedQuantity,
      '外箱长(cm)': item.item.boxLength || '-',
      '外箱宽(cm)': item.item.boxWidth || '-',
      '外箱高(cm)': item.item.boxHeight || '-',
      '外箱体积(m³)': (item.item.boxLength && item.item.boxWidth && item.item.boxHeight) 
        ? ((item.item.boxLength * item.item.boxWidth * item.item.boxHeight) / 1000000).toFixed(6)
        : (item.item.boxVolume ? item.item.boxVolume.toFixed(6) : '-'),
      '发货总体积(m³)': item.shippedTotalVolume ? item.shippedTotalVolume.toFixed(3) : (item.item.totalVolume ? item.item.totalVolume.toFixed(3) : '-'),
      '单件重量(kg)': item.item.unitWeight ? item.item.unitWeight.toFixed(2) : '-',
      '发货总重量(kg)': item.shippedTotalWeight ? item.shippedTotalWeight.toFixed(2) : (item.item.totalWeight ? item.item.totalWeight.toFixed(2) : '-'),
    }));

    // 计算批次汇总数据
    const totalWeight = batch.items.reduce((sum: number, item: any) => 
      sum + (item.shippedTotalWeight || item.item.totalWeight || 0), 0);
    const totalVolume = batch.items.reduce((sum: number, item: any) => 
      sum + (item.shippedTotalVolume || item.item.totalVolume || 0), 0);

    // 转换为CSV格式
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      '批次信息',
      `批次编号,${batch.containerNumber}`,
      `SKU数量,${batch.items.length}`,
      `发货总重量(kg),${totalWeight.toFixed(2)}`,
      `发货总体积(m³),${totalVolume.toFixed(3)}`,
      `发货时间,${batch.shippingDate.toLocaleDateString('zh-CN')} ${batch.shippingDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
      '',
      'SKU详情',
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${(row[header as keyof typeof row] ?? '').toString()}"`).join(','))
    ].join('\n');

    // 下载文件
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
  link.download = `发货批次详情_${batch.containerNumber}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`;
    link.click();
  };
  // 处理预发货
  const handlePreShipment = () => {
    if (selectedItems.length === 0) return;
    
  const updatedData = shippingData.map(item =>
    selectedItems.includes(item.id)
      ? ({
          ...item,
          status: 'pre_shipment' as const,
          shipmentQuantity: item.totalPieces,
          shipmentTotalQuantity: item.totalQuantity,
          shipmentTotalVolume: item.totalVolume ?? 0,
          shipmentTotalWeight: item.totalWeight ?? 0
        } as QualityControlRecord)
      : item
  );
  setShippingData(updatedData);
    
    setSelectedItems([]);
  };

  // 处理退回待发货
  const handleReturnToPending = (itemId: string) => {
  const updatedData = shippingData.map(item =>
    item.id === itemId
      ? ({
          ...item,
          status: 'pending_shipment' as const,
          shipmentQuantity: undefined,
          shipmentTotalQuantity: undefined,
          shipmentTotalVolume: undefined,
          shipmentTotalWeight: undefined
        } as QualityControlRecord)
      : item
  );
  setShippingData(updatedData);
  };

  // 处理发货件数修改
  const handleShipmentQuantityChange = (itemId: string, shipmentQuantity: number) => {
    // 获取当前项目的总件数进行验证
    const currentItem = shippingData.find(item => item.id === itemId);
    if (!currentItem) return;
    
    // 确保发货件数不超过总件数，且不小于1
    const validShipmentQuantity = Math.max(1, Math.min(shipmentQuantity, currentItem.totalPieces));
    
  setShippingData(
    shippingData.map(item => {
      if (item.id === itemId) {
        const shipmentTotalQuantity = validShipmentQuantity * item.piecesPerUnit;
        const shipmentTotalVolume = validShipmentQuantity * (item.boxVolume ?? 0);
        const shipmentTotalWeight = validShipmentQuantity * item.unitWeight;
        return {
          ...item,
          shipmentQuantity: validShipmentQuantity,
          shipmentTotalQuantity,
          shipmentTotalVolume,
          shipmentTotalWeight
        } as QualityControlRecord;
      }
      return item;
    })
  );
  };

  // 处理确认发货
  const handleConfirmShipment = () => {
    if (selectedItems.length === 0) return;
    
    const selectedData = filteredData.filter(item => selectedItems.includes(item.id));
        const batchNumber = `SHIP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(shippedBatches.length + 1).padStart(3, '0')}`;
        
        // 创建新的发货批次（Shipment类型）
        const newBatch: Shipment = {
          id: `batch-${Date.now()}`,
          containerNumber: batchNumber,
          purchaseRequestIds: selectedData.map(item => item.purchaseRequestNumber),
          items: selectedData.map(item => ({
            itemId: item.id,
            item: {
              id: item.id,
              skuId: item.skuId,
              sku: item.sku,
              quantity: item.totalQuantity ?? 0,
              unitPrice: undefined,
              totalPrice: undefined,
              remarks: item.remarks,
              status: 'shipped',
              // 保存订单编号
              purchaseRequestNumber: item.purchaseRequestNumber,
              // 保存完整的包装信息
              packageCount: item.packageCount,
              totalPieces: item.totalPieces,
              piecesPerUnit: item.piecesPerUnit,
              boxLength: item.boxLength,
              boxWidth: item.boxWidth,
              boxHeight: item.boxHeight,
              unitWeight: item.unitWeight,
              totalVolume: item.totalVolume,
              totalWeight: item.totalWeight,
            },
            shippedQuantity: item.shipmentTotalQuantity ?? 0,
            // 保存发货相关的包装信息
            shippedPackageCount: item.packageCount,
            shippedTotalPieces: item.shipmentQuantity || item.totalPieces,
            shippedTotalVolume: item.shipmentTotalVolume ?? item.totalVolume,
            shippedTotalWeight: item.shipmentTotalWeight ?? item.totalWeight,
            status: 'shipped',
          })),
          destination: '',
          shippingDate: new Date(),
          estimatedArrival: undefined,
          actualArrival: undefined,
          status: 'shipped',
          logisticsStaffId: user?.id || '',
          logisticsStaff: user!,
          remarks: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies Partial<Shipment>;
        const updatedBatches = [...shippedBatches, newBatch];
        setShippedBatches(updatedBatches);
    
    // 处理部分发货的情况
    const newData = [...shippingData];
    selectedData.forEach(item => {
      const shipmentQuantity = item.shipmentQuantity || item.totalPieces;
      if (shipmentQuantity < item.totalPieces) {
        // 部分发货：创建剩余数量的新记录
        const remainingQuantity = item.totalPieces - shipmentQuantity;
        const remainingTotalQuantity = remainingQuantity * item.piecesPerUnit;
        const remainingTotalVolume = remainingQuantity * (item.boxVolume ?? 0);
        const remainingTotalWeight = remainingQuantity * item.unitWeight;
        const remainingItem: Partial<QualityControlRecord> = {
          ...item,
          id: `${item.id}-remaining-${Date.now()}`,
          totalPieces: remainingQuantity,
          totalQuantity: remainingTotalQuantity,
          totalVolume: remainingTotalVolume,
          totalWeight: remainingTotalWeight,
          status: 'pending_shipment' as const,
          shipmentQuantity: undefined,
          shipmentTotalQuantity: undefined,
          shipmentTotalVolume: undefined,
          shipmentTotalWeight: undefined
        };
        newData.push(remainingItem as QualityControlRecord);
      }
      // 移除原记录
      const index = newData.findIndex(d => d.id === item.id);
      if (index !== -1) {
        newData.splice(index, 1);
      }
    });
    setShippingData(newData);
    
    setSelectedItems([]);
  };

  // 处理图片点击
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 格式化数字显示
  const formatNumber = (value: number, decimals: number = 2) => {
    return parseFloat(value.toFixed(decimals)).toString();
  };

  // 获取统计数据
  const getTabStats = () => {
    const pending = shippingData.filter(item => item.status === 'pending_shipment').length;
    const preShipment = shippingData.filter(item => item.status === 'pre_shipment').length;
    const shipped = shippedBatches.length;
    
    return { pending, preShipment, shipped };
  };

  const tabStats = getTabStats();

  // 渲染待发货栏目
  const renderPendingShipment = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 py-3 px-3 text-left font-medium text-gray-900">
                <button onClick={handleSelectAll} className="flex items-center">
                  {selectedItems.length === filteredData.length && filteredData.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-3 px-3">
                  <button onClick={() => handleSelectItem(item.id)} className="flex items-center">
                    {selectedItems.includes(item.id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-blue-600">{item.purchaseRequestNumber}</div>
                </td>
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
                <td className="py-3 px-3 text-sm font-medium text-gray-900">{item.sku.code}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.sku.name}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.sku.identificationCode}</td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.packageCount > 0 ? item.packageCount : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在入库登记页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.totalPieces > 0 ? item.totalPieces : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在入库登记页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.piecesPerUnit > 0 ? item.piecesPerUnit : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在入库登记页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); }}
                    className={item.totalQuantity && item.totalQuantity > 0 ? "hover:text-blue-800" : "text-gray-400 cursor-not-allowed"}
                    title={item.totalQuantity && item.totalQuantity > 0 ? "点击查看详情" : "需要先在入库登记页面填写包装信息"}
                  >
                    {item.totalQuantity && item.totalQuantity > 0 ? item.totalQuantity : (
                      <span className="text-xs bg-yellow-50 px-2 py-1 rounded text-gray-400">
                        待计算
                      </span>
                    )}
                  </a>
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.boxLength > 0 ? `${item.boxLength}cm` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在统计入库页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.boxWidth > 0 ? `${item.boxWidth}cm` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在统计入库页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.boxHeight > 0 ? `${item.boxHeight}cm` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在统计入库页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  {(item.boxVolume ?? 0) > 0 ? `${formatNumber(item.boxVolume ?? 0, 6)}m³` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要先填写包装信息">
                      待计算
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  {(item.totalVolume ?? 0) > 0 ? `${formatNumber(item.totalVolume ?? 0, 3)}m³` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要先填写包装信息">
                      待计算
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.unitWeight > 0 ? `${formatNumber(item.unitWeight, 2)}kg` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在统计入库页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  {(item.totalWeight ?? 0) > 0 ? `${formatNumber(item.totalWeight ?? 0, 2)}kg` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要先填写包装信息">
                      待计算
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染预发货栏目
  const renderPreShipment = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 py-3 px-3 text-left font-medium text-gray-900">
                <button onClick={handleSelectAll} className="flex items-center">
                  {selectedItems.length === filteredData.length && filteredData.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-16">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">SKU</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">品名</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-20">识别码</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">中包数</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">总件数</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">发货件数</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">单件数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">发货总数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">外箱长(cm)</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">外箱宽(cm)</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">外箱高(cm)</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">外箱体积(m³)</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">发货总体积(m³)</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">单件重量(kg)</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">发货总重量(kg)</th>
              {isLogisticsStaff && (
                <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-3 px-3">
                  <button onClick={() => handleSelectItem(item.id)} className="flex items-center">
                    {selectedItems.includes(item.id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-blue-600">{item.purchaseRequestNumber}</div>
                </td>
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
                <td className="py-3 px-3 text-sm font-medium text-gray-900">{item.sku.code}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.sku.name}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.sku.identificationCode}</td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">{item.packageCount}</td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">{item.totalPieces}</td>
                <td className="py-3 px-3 text-center">
                  {isLogisticsStaff ? (
                    <input
                      type="number"
                      min="1"
                     max={item.totalPieces}
                      value={item.shipmentQuantity || item.totalPieces}
                      onChange={(e) => handleShipmentQuantityChange(item.id, parseInt(e.target.value) || 1)}
                     className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{item.shipmentQuantity || item.totalPieces}</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.piecesPerUnit > 0 ? item.piecesPerUnit : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在统计入库页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  {(item.shipmentTotalQuantity || item.totalQuantity || 0) > 0 ? (item.shipmentTotalQuantity || item.totalQuantity) : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要先填写包装信息">
                      待计算
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.boxLength > 0 ? `${item.boxLength}cm` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在统计入库页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.boxWidth > 0 ? `${item.boxWidth}cm` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在统计入库页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.boxHeight > 0 ? `${item.boxHeight}cm` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在统计入库页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  {(item.boxVolume ?? 0) > 0 ? `${formatNumber(item.boxVolume ?? 0, 6)}m³` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要先填写包装信息">
                      待计算
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  {(item.shipmentTotalVolume ?? item.totalVolume ?? 0) > 0 ? `${formatNumber((item.shipmentTotalVolume ?? item.totalVolume ?? 0), 3)}m³` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要先填写包装信息">
                      待计算
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.unitWeight > 0 ? `${formatNumber(item.unitWeight, 2)}kg` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要在统计入库页面填写">
                      待填写
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  {(item.shipmentTotalWeight ?? item.totalWeight ?? 0) > 0 ? `${formatNumber((item.shipmentTotalWeight ?? item.totalWeight ?? 0), 2)}kg` : (
                    <span className="text-gray-400 text-xs bg-yellow-50 px-2 py-1 rounded" title="需要先填写包装信息">
                      待计算
                    </span>
                  )}
                </td>
                {isLogisticsStaff && (
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleReturnToPending(item.id)}
                      className="px-2 py-1 text-xs text-orange-600 border border-orange-600 rounded hover:bg-orange-50 transition-colors"
                      title="退回待发货"
                    >
                      退回
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染已发货栏目
  const renderShipped = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-900">发货批次</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">SKU数量</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">发货总重量</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">发货总体积</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">发货时间</th>
              <th className="text-center py-3 px-4 font-medium text-gray-900">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {shippedBatches.map((batch) => (
              <tr key={batch.id} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="font-medium text-blue-600">{batch.containerNumber}</div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-medium text-gray-900">{batch.items.length}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-medium text-blue-600">
                    {formatNumber(batch.items.reduce((sum: number, i: any) => 
                      sum + (i.shippedTotalWeight || i.item.totalWeight || 0), 0), 2)}kg
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-medium text-blue-600">
                    {formatNumber(batch.items.reduce((sum: number, i: any) => 
                      sum + (i.shippedTotalVolume || i.item.totalVolume || 0), 0), 3)}m³
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-900">
                    {batch.shippingDate.toLocaleDateString('zh-CN')} {batch.shippingDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => setViewingBatch(batch)}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                  >
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">发货出柜</h1>
            <p className="text-gray-600">管理货物发货流程，支持批量操作和精细化发货控制</p>
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
              <Truck className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">
                {activeTab === 'shipped' ? `批次: ${shippedBatches.length}` : `SKU: ${filteredData.length}`}
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
              <ChevronRight className="h-5 w-5" />
              <span>待发货</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.pending}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pre_shipment')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pre_shipment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-5 w-5" />
              <span>预发货</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'pre_shipment' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.preShipment}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('shipped')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'shipped'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>已发货</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.shipped}
              </span>
            </button>
          </nav>
        </div>

        {/* 选中统计和操作栏 */}
        {(activeTab === 'pending' || activeTab === 'pre_shipment') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-sm text-gray-600">
                  已选择 <span className="font-medium text-blue-600">{selectedItems.length}</span> 个SKU
                </div>
                {selectedItems.length > 0 && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Calculator className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-600">
                        {activeTab === 'pre_shipment' ? '发货总体积' : '总体积'}: 
                        <span className="font-medium text-green-600 ml-1">
                          {formatNumber(selectedStats.totalVolume ?? 0, 3)}m³
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calculator className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-gray-600">
                        {activeTab === 'pre_shipment' ? '发货总重量' : '总重量'}: 
                        <span className="font-medium text-purple-600 ml-1">
                          {formatNumber(selectedStats.totalWeight ?? 0, 2)}kg
                        </span>
                      </span>
                    </div>
                  </>
                )}
              </div>
              {isLogisticsStaff && selectedItems.length > 0 && (
                <div className="flex items-center space-x-3">
                  {activeTab === 'pending' && (
                    <button
                      onClick={handlePreShipment}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>预发货</span>
                    </button>
                  )}
                  {activeTab === 'pre_shipment' && (
                    <button
                      onClick={handleConfirmShipment}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      <span>确认发货</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 内容区域 */}
        {filteredData.length === 0 && activeTab !== 'shipped' ? (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pending' ? '没有待发货的SKU' : '没有预发货的SKU'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pending' ? '所有SKU都已发货' : '没有准备发货的SKU'}
            </p>
          </div>
        ) : activeTab === 'shipped' && shippedBatches.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有已发货的批次</h3>
            <p className="text-gray-600">还没有完成发货的批次</p>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && renderPendingShipment()}
            {activeTab === 'pre_shipment' && renderPreShipment()}
            {activeTab === 'shipped' && renderShipped()}
          </>
        )}
      </div>

      {/* 图片放大模态框 */}
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

      {/* 发货批次详情模态框 */}
      {viewingBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                发货批次详情 - {viewingBatch.containerNumber}
              </h2>
              <button
                onClick={() => setViewingBatch(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 批次信息 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">批次信息</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">批次编号:</span>
                    <p className="font-medium">{viewingBatch.containerNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">SKU数量:</span>
                    <p className="font-medium">{viewingBatch.items.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">总重量:</span>
                    <p className="font-medium">
                      {formatNumber(viewingBatch.items.reduce((sum: number, item: any) => 
                        sum + (item.shippedTotalWeight || item.item.totalWeight || 0), 0), 2)}kg
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">总体积:</span>
                    <p className="font-medium">
                      {formatNumber(viewingBatch.items.reduce((sum: number, item: any) => 
                        sum + (item.shippedTotalVolume || item.item.totalVolume || 0), 0), 3)}m³
                    </p>
                  </div>
                </div>
              </div>

              {/* SKU详情表格 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">SKU详情</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">订单编号</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">图片</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">SKU</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">品名</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900">识别码</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">中包数</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">发货件数</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">单件数量</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">发货总数量</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">外箱长(cm)</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">外箱宽(cm)</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">外箱高(cm)</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">外箱体积(m³)</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">发货总体积(m³)</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">单件重量(kg)</th>
                        <th className="text-center py-3 px-3 font-medium text-gray-900">发货总重量(kg)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewingBatch.items.map((item: any) => (
                        <tr key={item.itemId} className="hover:bg-gray-50">
                          <td className="py-3 px-3 text-sm font-medium text-blue-600">
                            {item.item.purchaseRequestNumber || item.item.id}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {item.item.sku.imageUrl ? (
                              <img 
                                src={item.item.sku.imageUrl} 
                                alt={item.item.sku.name}
                                className="w-10 h-10 object-cover rounded border"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-sm font-medium text-gray-900">{item.item.sku.code}</td>
                          <td className="py-3 px-3 text-sm text-gray-900">{item.item.sku.name}</td>
                          <td className="py-3 px-3 text-sm text-gray-900">{item.item.sku.identificationCode}</td>
                          <td className="py-3 px-3 text-center text-sm text-gray-900">
                            {item.shippedPackageCount || item.item.packageCount || '-'}
                          </td>
                          <td className="py-3 px-3 text-center text-sm text-gray-900">
                            {item.shippedTotalPieces || item.item.totalPieces || '-'}
                          </td>
                          <td className="py-3 px-3 text-center text-sm text-gray-900">
                            {item.item.piecesPerUnit || '-'}
                          </td>
                          <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                            {item.shippedQuantity}
                          </td>
                          <td className="py-3 px-3 text-center text-sm text-gray-900">
                            {item.item.boxLength ? `${item.item.boxLength}cm` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center text-sm text-gray-900">
                            {item.item.boxWidth ? `${item.item.boxWidth}cm` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center text-sm text-gray-900">
                            {item.item.boxHeight ? `${item.item.boxHeight}cm` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                            {item.item.boxLength && item.item.boxWidth && item.item.boxHeight 
                              ? `${formatNumber((item.item.boxLength * item.item.boxWidth * item.item.boxHeight) / 1000000, 6)}m³`
                              : (item.item.boxVolume ? `${formatNumber(item.item.boxVolume, 6)}m³` : '-')
                            }
                          </td>
                          <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                            {item.shippedTotalVolume ? `${formatNumber(item.shippedTotalVolume, 3)}m³` : (item.item.totalVolume ? `${formatNumber(item.item.totalVolume, 3)}m³` : '-')}
                          </td>
                          <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                            {item.item.unitWeight ? `${formatNumber(item.item.unitWeight, 2)}kg` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                            {item.shippedTotalWeight ? `${formatNumber(item.shippedTotalWeight, 2)}kg` : (item.item.totalWeight ? `${formatNumber(item.item.totalWeight, 2)}kg` : '-')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 关闭按钮 */}
              <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleExportBatchDetails(viewingBatch)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mr-4"
                >
                  <Download className="h-4 w-4" />
                  <span>导出详情</span>
                </button>
                <button
                  onClick={() => setViewingBatch(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};