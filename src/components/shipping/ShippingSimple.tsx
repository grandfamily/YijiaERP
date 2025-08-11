import React, { useState } from 'react';
import { Truck, Package, Search, Plus } from 'lucide-react';
import { useGlobalStore } from '../../store/globalStore';

export const Shipping: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // 从全局存储获取发货数据
  const shipments = useGlobalStore(state => state.shipments);
  console.log('🚢 发货数据:', shipments);

  // 过滤数据
  const filteredData = shipments.filter(shipment =>
    shipment.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors = {
      preparing: 'yellow',
      shipped: 'blue',
      in_transit: 'indigo',
      delivered: 'green'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getStatusText = (status: string) => {
    const texts = {
      preparing: '准备中',
      shipped: '已发货',
      in_transit: '运输中',
      delivered: '已送达'
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">发货出柜</h1>
          <p className="mt-2 text-gray-600">管理货物发货和集装箱跟踪</p>
        </div>

        {/* 搜索和统计 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索集装箱号或目的地..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-gray-600">
                  总货柜数: {shipments.length}
                </span>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>新建发货</span>
              </button>
            </div>
          </div>
        </div>

        {/* 发货列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {shipments.length === 0 ? '没有发货记录' : '没有找到匹配的发货记录'}
              </h3>
              <p className="text-gray-600">
                {shipments.length === 0 ? '还没有安排货物发货' : '请尝试不同的搜索条件'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredData.map((shipment) => (
                <div key={shipment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Truck className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          集装箱号: {shipment.containerNumber}
                        </h3>
                        <p className="text-sm text-gray-500">
                          目的地: {shipment.destination}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium bg-${getStatusColor(
                          shipment.status
                        )}-100 text-${getStatusColor(shipment.status)}-800`}
                      >
                        {getStatusText(shipment.status)}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        查看详情
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">发货日期:</span>
                      <span className="ml-2 text-gray-600">
                        {shipment.shippingDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">预计到达:</span>
                      <span className="ml-2 text-gray-600">
                        {shipment.estimatedArrival?.toLocaleDateString() || '待定'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">货物数量:</span>
                      <span className="ml-2 text-gray-600">
                        {shipment.items.length} 项
                      </span>
                    </div>
                  </div>
                  
                  {shipment.remarks && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-700">备注:</span>
                      <span className="ml-2 text-sm text-gray-600">{shipment.remarks}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
