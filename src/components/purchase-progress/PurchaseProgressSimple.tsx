import React, { useState } from 'react';
import { AlertTriangle, Package, Calendar, User } from 'lucide-react';
import { useGlobalStore } from '../../store/globalStore';
import { StatusBadge } from '../ui/StatusBadge';

type TabType = 'in_progress' | 'external_completed' | 'internal_completed' | 'failed_orders';

export const PurchaseProgress: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('failed_orders');
  
  // 从全局存储获取不合格订单
  const rejectedOrders = useGlobalStore(state => state.rejectedOrders);
  console.log('🎯 从全局存储获取的不合格订单数量:', rejectedOrders.length, '详情:', rejectedOrders);

  const renderFailedOrdersTab = () => {
    console.log('🎯 渲染不合格订单标签页，当前订单数量:', rejectedOrders.length);
    console.log('🎯 不合格订单详情:', rejectedOrders);

    return (
      <div className="space-y-4">
        {rejectedOrders.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无不合格订单</h3>
            <p className="mt-1 text-sm text-gray-500">当前不合格订单数量: {rejectedOrders.length}</p>
          </div>
        ) : (
          rejectedOrders.map((order) => (
            <div key={order.id} className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8 text-red-600" />
                  <div>
                    <h3 className="text-lg font-medium text-red-900">
                      {order.sku.name} ({order.sku.code})
                    </h3>
                    <p className="text-sm text-red-700">采购申请号: {order.purchaseRequestNumber}</p>
                  </div>
                </div>
                <StatusBadge status="rejected" />
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">不合格原因:</span> {order.rejectionReason}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">检验时间:</span> {order.rejectionDate.toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">验收人员:</span> {order.rejectedBy}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">产品类型:</span> 
                    {order.productType === 'semi_finished' ? '半成品' : '成品'}
                  </span>
                </div>
                
                {order.inspectionNotes && (
                  <div className="col-span-full">
                    <span className="text-sm text-gray-700">
                      <span className="font-medium">检验备注:</span> {order.inspectionNotes}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex space-x-3">
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  联系供应商
                </button>
                <button className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700">
                  申请退换货
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700">
                  标记已处理
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">采购进度管理</h1>
          <p className="mt-2 text-gray-600">跟踪和管理采购订单的进度状态</p>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('in_progress')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'in_progress'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                进行中订单
              </button>
              <button
                onClick={() => setActiveTab('external_completed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'external_completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                厂家包装已完成
              </button>
              <button
                onClick={() => setActiveTab('internal_completed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'internal_completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                自己包装已完成
              </button>
              <button
                onClick={() => setActiveTab('failed_orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'failed_orders'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                不合格订单 {rejectedOrders.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {rejectedOrders.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'failed_orders' && renderFailedOrdersTab()}
            {activeTab !== 'failed_orders' && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">功能开发中</h3>
                <p className="mt-1 text-sm text-gray-500">此标签页正在开发中，请稍后再试</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
