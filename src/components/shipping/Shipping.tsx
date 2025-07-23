import React from 'react';
import { Truck, Package, Calendar, MapPin, CheckCircle, Clock, Search } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

// Mock data for shipping
const shippingData = [
  {
    id: 'ship-001',
    containerNumber: 'CONU1234567',
    purchaseRequests: ['PR-2024-001', 'PR-2024-002'],
    destination: 'Milano, Italy',
    shippingDate: new Date('2024-01-28'),
    estimatedArrival: new Date('2024-02-15'),
    status: 'shipped',
    items: [
      {
        id: 'item-001',
        skuCode: 'ELE-001',
        skuName: '电子产品A',
        shippedQuantity: 95,
        totalQuantity: 100,
        status: 'shipped'
      },
      {
        id: 'item-002',
        skuCode: 'ELE-002',
        skuName: '电子产品B',
        shippedQuantity: 50,
        totalQuantity: 50,
        status: 'shipped'
      }
    ]
  },
  {
    id: 'ship-002',
    containerNumber: 'CONU7654321',
    purchaseRequests: ['PR-2024-003'],
    destination: 'Rome, Italy',
    shippingDate: null,
    estimatedArrival: new Date('2024-02-20'),
    status: 'preparing',
    items: [
      {
        id: 'item-003',
        skuCode: 'TOY-001',
        skuName: '玩具B',
        shippedQuantity: 0,
        totalQuantity: 180,
        status: 'not_shipped'
      }
    ]
  }
];

export const Shipping: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredData = shippingData.filter(shipment =>
    shipment.containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.purchaseRequests.some(pr => pr.toLowerCase().includes(searchTerm.toLowerCase())) ||
    shipment.items.some(item => 
      item.skuCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.skuName.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
    const statusMap = {
      preparing: '准备中',
      shipped: '已发货',
      in_transit: '运输中',
      delivered: '已送达'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getItemStatusColor = (status: string) => {
    const colors = {
      not_shipped: 'red',
      shipped: 'green'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getItemStatusText = (status: string) => {
    const statusMap = {
      not_shipped: '未出货',
      shipped: '已出货'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getShippingProgress = (items: any[]) => {
    const shippedItems = items.filter(item => item.status === 'shipped').length;
    return Math.round((shippedItems / items.length) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">发货出柜</h1>
          <p className="text-gray-600">管理货物发货和集装箱跟踪</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索集装箱号、订单号或SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600">
              活跃货柜: {filteredData.filter(ship => ship.status !== 'delivered').length}
            </span>
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有发货记录</h3>
          <p className="text-gray-600">还没有安排货物发货</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredData.map((shipment) => {
            const progress = getShippingProgress(shipment.items);
            
            return (
              <div key={shipment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {shipment.containerNumber}
                    </h3>
                    <StatusBadge
                      status={getStatusText(shipment.status)}
                      color={getStatusColor(shipment.status)}
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{shipment.destination}</span>
                  </div>
                </div>

                {/* Shipping Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">发货进度</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">关联订单</h4>
                    <p className="text-gray-900">{shipment.purchaseRequests.join(', ')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">发货日期</h4>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {shipment.shippingDate 
                          ? shipment.shippingDate.toLocaleDateString('zh-CN')
                          : '待定'
                        }
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">预计到达</h4>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {shipment.estimatedArrival.toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">货物清单</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">SKU</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">产品名称</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">已发数量</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">总数量</th>
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {shipment.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 px-3 text-sm text-gray-900">{item.skuCode}</td>
                            <td className="py-2 px-3 text-sm text-gray-900">{item.skuName}</td>
                            <td className="py-2 px-3 text-sm text-gray-900">{item.shippedQuantity}</td>
                            <td className="py-2 px-3 text-sm text-gray-900">{item.totalQuantity}</td>
                            <td className="py-2 px-3 text-sm">
                              <div className="flex items-center space-x-2">
                                {item.status === 'shipped' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Clock className="h-4 w-4 text-red-500" />
                                )}
                                <StatusBadge
                                  status={getItemStatusText(item.status)}
                                  color={getItemStatusColor(item.status)}
                                  size="sm"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    查看详情
                  </button>
                  {shipment.status === 'preparing' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      确认发货
                    </button>
                  )}
                  {shipment.status === 'shipped' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      更新状态
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};