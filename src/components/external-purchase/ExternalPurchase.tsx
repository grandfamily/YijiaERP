import React from 'react';
import { Package, Calendar, AlertTriangle, CheckCircle, Search, CreditCard, Clock } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { CardProgress } from '../card-progress/CardProgress';

export const ExternalPurchase: React.FC = () => {
  const { getPurchaseRequests, getOrderAllocations } = useProcurement();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedRequest, setSelectedRequest] = React.useState<string | null>(null);
  
  // 获取已分配的厂家包装订单
  const { data: externalRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'deadline', direction: 'asc' }
  );

  // 过滤出厂家包装订单
  const filteredExternalRequests = externalRequests.filter(request => {
    const allocation = getOrderAllocations().find(a => a.purchaseRequestId === request.id);
    return allocation?.type === 'external';
  });

  console.log('厂家包装订单数据:', externalRequests);

  const filteredRequests = filteredExternalRequests.filter(request => 
    request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.items.some(item => 
      item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status: string) => {
    const colors = {
      allocated: 'blue',
      in_progress: 'yellow',
      in_production: 'yellow',
      completed: 'green'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      allocated: '已分配',
      in_production: '生产中',
      quality_check: '质检中',
      ready_to_ship: '待发货',
      shipped: '已发货',
      completed: '已完成'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const isOverdue = (deadline: Date) => {
    return new Date() > new Date(deadline);
  };

  const getTimeProgress = (createdAt: Date, deadline: Date) => {
    const now = new Date();
    const total = deadline.getTime() - createdAt.getTime();
    const elapsed = now.getTime() - createdAt.getTime();
    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    return {
      progress,
      isOverdue: now > deadline,
      daysRemaining: Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">厂家包装</h1>
          <p className="text-gray-600">管理厂家包装采购订单</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索SKU或订单号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600">进行中: {filteredRequests.length}</span>
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有进行中的厂家包装</h3>
          <p className="text-gray-600">所有厂家包装订单都已完成</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredRequests.map((request) => {
            const timeProgress = getTimeProgress(request.createdAt, request.deadline);
            
            return (
            <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {request.requestNumber}
                  </h3>
                  <StatusBadge
                    status={getStatusText(request.status)}
                    color={getStatusColor(request.status)}
                  />
                  {isOverdue(request.deadline) && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">逾期</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>截止: {new Date(request.deadline).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>

              {/* Time Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">时间进度</span>
                  <span className={`text-sm ${timeProgress.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                    {timeProgress.isOverdue 
                      ? `已逾期 ${Math.abs(timeProgress.daysRemaining)} 天`
                      : `剩余 ${timeProgress.daysRemaining} 天`
                    }
                  </span>
                </div>
                <ProgressBar 
                  progress={timeProgress.progress}
                  color={timeProgress.isOverdue ? 'red' : timeProgress.progress > 80 ? 'yellow' : 'blue'}
                />
              </div>

              {/* Embedded Card Progress */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">纸卡进度</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">设计阶段</span>
                      <span className="text-sm font-medium text-gray-900">60%</span>
                    </div>
                    <ProgressBar progress={60} color="blue" size="sm" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">生产阶段</span>
                      <span className="text-sm font-medium text-gray-900">0%</span>
                    </div>
                    <ProgressBar progress={0} color="gray" size="sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">申请人</h4>
                  <p className="text-gray-900">{request.requester.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">总金额</h4>
                  <p className="text-gray-900">¥{request.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">SKU数量</h4>
                  <p className="text-gray-900">{request.items.length}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">采购项目</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">SKU</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">产品名称</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">数量</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">供应商</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-900">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {request.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 text-sm text-gray-900">{item.sku.code}</td>
                          <td className="py-2 px-3 text-sm text-gray-900">{item.sku.name}</td>
                          <td className="py-2 px-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="py-2 px-3 text-sm text-gray-900">
                            {item.supplier?.name || '-'}
                          </td>
                          <td className="py-2 px-3 text-sm">
                            <div className="flex items-center space-x-2">
                              {item.status === 'completed' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                              )}
                              <span className="text-gray-600">
                                {item.status === 'completed' ? '已完成' : '进行中'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  查看详情
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  更新进度
                </button>
                <button 
                  onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                  className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  {selectedRequest === request.id ? '收起详情' : '纸卡详情'}
                </button>
              </div>

              {/* Expanded Card Progress Details */}
              {selectedRequest === request.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <CardProgress embedded={true} requestId={request.id} />
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};