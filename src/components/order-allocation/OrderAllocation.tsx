import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  User, 
  Package, 
  Search, 
  Eye, 
  Edit, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Save,
  X,
  Filter,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseRequest, OrderAllocation as OrderAllocationType, PaymentMethod, AllocationStatus } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';

type TabType = 'pending' | 'allocated';

// 纸卡类型选项
type CardType = 'finished' | 'design' | 'none';

export const OrderAllocation: React.FC = () => {
  const { getPurchaseRequests, createOrderAllocation, updateOrderAllocation, getOrderAllocations, getOrderAllocationByRequestId } = useProcurement();
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [editingAllocation, setEditingAllocation] = useState<OrderAllocationType | null>(null);

  // 获取终审通过的订单（待分配）
  const { data: approvedRequests } = getPurchaseRequests(
    { status: ['approved'] },
    { field: 'finalApprovalDate', direction: 'desc' }
  );

  // 获取已分配的订单
  const { data: allocatedRequests } = getPurchaseRequests(
    { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped', 'completed'] },
    { field: 'updatedAt', direction: 'desc' }
  );

  const currentRequests = activeTab === 'pending' ? approvedRequests : allocatedRequests;

  const filteredRequests = currentRequests.filter(request =>
    request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requester.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.items.some(item => 
      item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const canEditAllocation = hasPermission('edit_purchase_request') && user?.role === 'purchasing_officer';
  const canViewAllocation = true;

  const getStatusColor = (status: string) => {
    const colors = {
      approved: 'green',
      allocated: 'blue',
      in_production: 'yellow',
      quality_check: 'purple',
      ready_to_ship: 'indigo',
      shipped: 'blue',
      completed: 'emerald'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      approved: '待分配',
      allocated: '已分配',
      in_production: '生产中',
      quality_check: '质检中',
      ready_to_ship: '待发货',
      shipped: '已发货',
      completed: '已完成'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getAllocationStatusText = (status: AllocationStatus) => {
    const statusMap = {
      pending: '待分配',
      allocated: '已分配',
      in_production: '待生产',
      production_scheduled: '已排产',
      pending_receipt: '待收货',
      received: '已收货',
      pending_shipment: '待发货',
      shipped: '已发货'
    };
    return statusMap[status] || status;
  };

  const getPaymentMethodText = (method: PaymentMethod) => {
    const methodMap = {
      payment_on_delivery: '付款发货',
      cash_on_delivery: '货到付款',
      credit_terms: '账期'
    };
    return methodMap[method] || method;
  };

  const getCardTypeText = (type: CardType) => {
    const typeMap = {
      finished: '纸卡成品',
      design: '设计稿',
      none: '不需要'
    };
    return typeMap[type] || '不需要';
  };

  const getPendingStats = () => {
    return {
      total: approvedRequests.length,
      urgent: approvedRequests.filter(r => new Date() > new Date(r.deadline)).length,
      thisWeek: approvedRequests.filter(r => {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return new Date(r.deadline) <= weekFromNow;
      }).length
    };
  };

  const getAllocatedStats = () => {
    return {
      total: allocatedRequests.length,
      inProduction: allocatedRequests.filter(r => r.status === 'in_production').length,
      completed: allocatedRequests.filter(r => r.status === 'completed').length,
      shipped: allocatedRequests.filter(r => r.status === 'shipped').length
    };
  };

  const renderTabContent = () => {
    const stats = activeTab === 'pending' ? getPendingStats() : getAllocatedStats();
    
    return (
      <>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {activeTab === 'pending' ? (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">待分配订单</h3>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">逾期订单</h3>
                    <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">本周到期</h3>
                    <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">总金额</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      ¥{approvedRequests.reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">已分配订单</h3>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8 text-yellow-600" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">生产中</h3>
                    <p className="text-2xl font-bold text-gray-900">{stats.inProduction}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">已完成</h3>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">已发货</h3>
                    <p className="text-2xl font-bold text-gray-900">{stats.shipped}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Orders Table */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pending' ? '没有待分配的订单' : '没有已分配的订单'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pending' ? '所有订单都已完成分配' : '还没有分配的订单'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">订单编号</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900">申请人</th>
                    {activeTab === 'pending' ? (
                      <>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">SKU数量</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">总金额</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">状态</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">终审时间</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">操作</th>
                      </>
                    ) : (
                      <>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">采购类型</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">供应商</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">纸卡类型</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">付款方式</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">定金金额</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">SKU数量</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">总金额</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">分配时间</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">交货日期</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">状态</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">操作</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-center">
                        <div className="font-medium text-gray-900">{request.requestNumber}</div>
                        {activeTab === 'pending' && new Date() > new Date(request.deadline) && (
                          <div className="flex items-center space-x-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600">已逾期</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{request.requester.name}</span>
                        </div>
                      </td>
                      {activeTab === 'pending' ? (
                        <>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900">{request.items.length}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900 font-medium">
                                ¥{request.totalAmount.toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <StatusBadge
                              status={getStatusText(request.status)}
                              color={getStatusColor(request.status)}
                            />
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-gray-500 text-sm">
                              {request.finalApprovalDate 
                                ? new Date(request.finalApprovalDate).toLocaleDateString('zh-CN')
                                : '-'
                              }
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button 
                                onClick={() => setSelectedRequest(request)}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                title="查看详情"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {canEditAllocation && (
                                <button 
                                  onClick={() => setSelectedRequest(request)}
                                  className="p-1 text-gray-400 hover:text-green-600 rounded"
                                  title="分配订单"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {(() => {
                            const allocation = getOrderAllocationByRequestId(request.id);
                            const mainSupplier = request.items.find(item => item.supplier)?.supplier;
                            
                            return (
                              <>
                                {/* 采购类型 */}
                                <td className="py-4 px-4 text-center">
                                  <StatusBadge
                                    status={allocation?.type === 'external' ? '厂家包装' : '自己包装'}
                                    color={allocation?.type === 'external' ? 'blue' : 'green'}
                                  />
                                </td>
                                
                                {/* 供应商 */}
                                <td className="py-4 px-4 text-center">
                                  <span className="text-gray-900 text-sm">
                                    {mainSupplier?.name || '-'}
                                  </span>
                                </td>
                                
                                {/* 纸卡类型 */}
                                <td className="py-4 px-4 text-center">
                                  <StatusBadge
                                    status={getCardTypeText(allocation?.cardType)}
                                    color="purple"
                                    size="sm"
                                  />
                                </td>
                                
                                {/* 付款方式 */}
                                <td className="py-4 px-4 text-center">
                                  <span className="text-gray-900 text-sm">
                                    {allocation?.paymentMethod === 'payment_on_delivery' ? '付款发货' : 
                                     allocation?.paymentMethod === 'cash_on_delivery' ? '货到付款' : 
                                     allocation?.paymentMethod === 'credit_terms' ? '账期' : '-'}
                                  </span>
                                </td>
                                
                                {/* 定金金额 */}
                                <td className="py-4 px-4 text-center">
                                  <span className="text-gray-900 font-medium text-sm">
                                    {allocation?.prepaymentAmount && allocation.prepaymentAmount > 0 
                                      ? `¥${allocation.prepaymentAmount.toLocaleString()}` 
                                      : '-'
                                    }
                                  </span>
                                </td>
                                
                                {/* SKU数量 */}
                                <td className="py-4 px-4 text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <Package className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900">{request.items.length}</span>
                                  </div>
                                </td>
                                
                                {/* 总金额 */}
                                <td className="py-4 px-4 text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-900 font-medium">
                                      ¥{request.totalAmount.toLocaleString()}
                                    </span>
                                  </div>
                                </td>
                                
                                {/* 分配时间 */}
                                <td className="py-4 px-4 text-center">
                                  <span className="text-gray-500 text-sm">
                                    {allocation?.allocatedAt 
                                      ? new Date(allocation.allocatedAt).toLocaleDateString('zh-CN')
                                      : new Date(request.updatedAt).toLocaleDateString('zh-CN')
                                    }
                                  </span>
                                </td>
                                
                                {/* 交货日期 */}
                                <td className="py-4 px-4 text-center">
                                  <span className="text-gray-500 text-sm">
                                    {allocation?.deliveryDate 
                                      ? new Date(allocation.deliveryDate).toLocaleDateString('zh-CN')
                                      : '-'
                                    }
                                  </span>
                                </td>
                                
                                {/* 状态 */}
                                <td className="py-4 px-4 text-center">
                                  <StatusBadge
                                    status={getStatusText(request.status)}
                                    color={getStatusColor(request.status)}
                                  />
                                </td>
                                
                                {/* 操作 */}
                                <td className="py-4 px-4 text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <button 
                                      onClick={() => setSelectedRequest(request)}
                                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                      title="查看详情"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            );
                          })()}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单分配</h1>
          <p className="text-gray-600">管理终审通过订单的分配和流转</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、申请人或SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            <span>待分配订单</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {approvedRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('allocated')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'allocated'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircle className="h-5 w-5" />
            <span>已分配订单</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeTab === 'allocated' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {allocatedRequests.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Order Allocation Modal */}
      {selectedRequest && (
        <OrderAllocationModal
          request={selectedRequest}
          canEdit={canEditAllocation && activeTab === 'pending'}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

interface OrderAllocationModalProps {
  request: PurchaseRequest;
  canEdit: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const OrderAllocationModal: React.FC<OrderAllocationModalProps> = ({
  request,
  canEdit,
  onClose,
  onSuccess
}) => {
  const { createOrderAllocation, updatePurchaseRequest, createCardProgressForRequest, createAccessoryProgressForRequest, getSuppliers } = useProcurement();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'external' as PurchaseType,
    paymentMethod: 'payment_on_delivery' as PaymentMethod,
    prepaymentAmount: 0,
    creditDate: '',
    productionDate: new Date().toISOString().split('T')[0],
    deliveryDays: 30,
    supplierId: '',
    supplierName: '',
    cardType: 'finished' as CardType,
    remarks: ''
  });

  const [itemPrices, setItemPrices] = useState<{[key: string]: number}>({});
  const [currentItems, setCurrentItems] = useState(request.items);

  const suppliers = getSuppliers();
  const [filteredSuppliers, setFilteredSuppliers] = useState(suppliers);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  
  const handleItemPriceChange = (itemId: string, price: number) => {
    setItemPrices(prev => ({
      ...prev,
      [itemId]: price
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    if (currentItems.length <= 1) {
      alert('订单至少需要保留一个SKU项目');
      return;
    }
    setConfirmRemove(itemId);
  };

  const confirmRemoveItem = () => {
    if (confirmRemove) {
      setCurrentItems(prev => prev.filter(item => item.id !== confirmRemove));
      // 清理相关状态
      setItemPrices(prev => {
        const newPrices = { ...prev };
        delete newPrices[confirmRemove];
        return newPrices;
      });
      setConfirmRemove(null);
    }
  };
  
  const getTotalAmount = () => {
    return currentItems.reduce((sum, item) => {
      const unitPrice = itemPrices[item.id] || item.unitPrice || 0;
      return sum + (unitPrice * item.quantity);
    }, 0);
  };

  // 处理供应商搜索
  const handleSupplierSearch = (searchText: string) => {
    setFormData(prev => ({ ...prev, supplierName: searchText }));
    
    if (searchText.trim() === '') {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchText.toLowerCase()) ||
        supplier.code.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
    
    setShowSupplierDropdown(true);
  };

  // 选择供应商
  const handleSelectSupplier = (supplier: any) => {
    setFormData(prev => ({ 
      ...prev, 
      supplierId: supplier.id,
      supplierName: supplier.name
    }));
    setShowSupplierDropdown(false);
  };

  const isFormValid = () => {
    if (!formData.productionDate || !formData.deliveryDays || formData.deliveryDays <= 0) return false;
    if (formData.paymentMethod === 'credit_terms' && !formData.creditDate) return false;
    if ((formData.paymentMethod === 'payment_on_delivery' || formData.paymentMethod === 'cash_on_delivery') && formData.prepaymentAmount < 0) return false;
    if (!formData.supplierId && !formData.supplierName) return false;
    return currentItems.every(item => {
      const unitPrice = itemPrices[item.id] || item.unitPrice || 0;
      return typeof unitPrice === 'number' && !isNaN(unitPrice) && unitPrice >= 0;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isFormValid()) return;

    setLoading(true);
    try {
      // 查找或创建供应商
      let supplierId = formData.supplierId;
      let supplier = suppliers.find(s => s.id === formData.supplierId);
      
      if (!supplierId && formData.supplierName) {
        // 如果只有名称没有ID，尝试查找匹配的供应商
        supplier = suppliers.find(s => 
          s.name.toLowerCase() === formData.supplierName.toLowerCase()
        );
        
        if (supplier) {
          supplierId = supplier.id;
        } else {
          // 这里可以添加创建新供应商的逻辑，但目前我们只使用已有的供应商
          alert('未找到匹配的供应商，请从列表中选择');
          setLoading(false);
          return;
        }
      }
      
      const updatedItems = currentItems.map(item => ({
        ...item,
        unitPrice: itemPrices[item.id] || item.unitPrice || 0,
        totalPrice: (itemPrices[item.id] || item.unitPrice || 0) * item.quantity,
        supplierId: supplierId,
        supplier: supplier
      }));

      const totalAmount = getTotalAmount();
      
      // 计算交货日期
      const deliveryDate = new Date(formData.productionDate);
      deliveryDate.setDate(deliveryDate.getDate() + formData.deliveryDays);

      const allocation: Omit<OrderAllocationType, 'id' | 'createdAt' | 'updatedAt'> = {
        purchaseRequestId: request.id,
        type: formData.type,
        paymentMethod: formData.paymentMethod,
        prepaymentAmount: (formData.paymentMethod === 'payment_on_delivery' || formData.paymentMethod === 'cash_on_delivery') 
          ? formData.prepaymentAmount : undefined,
        creditDate: formData.paymentMethod === 'credit_terms' ? new Date(formData.creditDate) : undefined,
        productionDate: new Date(formData.productionDate),
        deliveryDate: deliveryDate,
        allocationStatus: 'allocated',
        allocatedBy: user.id,
        allocatedAt: new Date(),
        cardType: formData.cardType,
        remarks: formData.remarks
      };

      await createOrderAllocation(allocation);

      await updatePurchaseRequest(request.id, {
        status: 'allocated',
        type: formData.type,
        items: updatedItems,
        totalAmount,
        updatedAt: new Date()
      });

      // 自动创建纸卡进度记录
      const updatedRequest = {
        ...request,
        status: 'allocated' as const,
        type: formData.type,
        items: updatedItems,
        totalAmount
      };
      
      const cardProgressRecords = createCardProgressForRequest(updatedRequest);
      console.log(`✅ 订单 ${request.requestNumber} 分配完成，已创建 ${cardProgressRecords.length} 个纸卡进度记录`);
      
      // 🎯 关键验证：自己包装订单额外创建辅料进度记录
      if (updatedRequest.type === 'in_house') {
        const accessoryProgressRecords = createAccessoryProgressForRequest(updatedRequest);
        console.log(`✅ 自己包装订单 ${request.requestNumber} 已创建 ${accessoryProgressRecords.length} 个辅料进度记录`);
        console.log(`📋 流转验证成功：订单已同步到纸卡进度和辅料进度两个系统`);
      } else {
        console.log(`ℹ️  厂家包装订单 ${request.requestNumber} 仅同步到纸卡进度系统`);
      }
      
      onSuccess();
    } catch (error) {
      console.error('订单分配失败:', error);
      alert('订单分配失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {canEdit ? '订单分配' : '订单详情'} - {request.requestNumber}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">申请人</h3>
                <p className="text-gray-900">{request.requester.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">采购类型</h3>
                <p className="text-gray-900">
                  {request.type === 'external' ? '厂家包装' : '自己包装'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">当前状态</h3>
                <StatusBadge
                  status={request.status === 'approved' ? '待分配' : '已分配'}
                  color={request.status === 'approved' ? 'yellow' : 'blue'}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">订单总金额</h3>
                <p className="text-gray-900 font-bold text-lg">
                  ¥{(canEdit ? getTotalAmount() : request.totalAmount).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Allocation Form */}
            {canEdit && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">分配信息</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      采购类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as PurchaseType})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="external">厂家包装</option>
                      <option value="in_house">自己包装</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      供应商 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.supplierName}
                        onChange={(e) => handleSupplierSearch(e.target.value)}
                        onFocus={() => setShowSupplierDropdown(true)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入供应商名称搜索..."
                        required
                      />
                      {showSupplierDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredSuppliers.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500">未找到匹配的供应商</div>
                          ) : (
                            filteredSuppliers.map(supplier => (
                              <div
                                key={supplier.id}
                                onClick={() => handleSelectSupplier(supplier)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                              >
                                <div className="font-medium">{supplier.name}</div>
                                <div className="text-xs text-gray-500">
                                  {supplier.code} | {supplier.contactPerson} | {supplier.phone}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      纸卡类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.cardType}
                      onChange={(e) => setFormData({...formData, cardType: e.target.value as CardType})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="finished">纸卡成品</option>
                      <option value="design">设计稿</option>
                      <option value="none">不需要</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      付款方式 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="payment_on_delivery">付款发货</option>
                      <option value="cash_on_delivery">货到付款</option>
                      <option value="credit_terms">账期</option>
                    </select>
                  </div>

                  {(formData.paymentMethod === 'payment_on_delivery' || formData.paymentMethod === 'cash_on_delivery') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        预付定金金额
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.prepaymentAmount}
                        onChange={(e) => setFormData({...formData, prepaymentAmount: parseFloat(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {formData.paymentMethod === 'credit_terms' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        账期日期 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.creditDate}
                        onChange={(e) => setFormData({...formData, creditDate: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      生产日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.productionDate}
                      onChange={(e) => setFormData({...formData, productionDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      交货天数 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.deliveryDays}
                      onChange={(e) => setFormData({...formData, deliveryDays: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入交货天数"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      交货日期将自动计算为：生产日期 + {formData.deliveryDays} 天
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分配备注
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入分配备注..."
                  />
                </div>
              </div>
            )}

            {/* Enhanced Items Table with Improved Design */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">采购项目</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 px-4 py-3 grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 border-b border-gray-200">
                  <div className="text-center">图片</div>
                  <div>SKU编码</div>
                  <div>产品名称</div>
                  <div>英文名称</div>
                  <div>产品类别</div>
                  <div>识别码</div>
                  <div>材料</div>
                  <div>包装方式</div>
                  <div className="text-center">单价(元)</div>
                  <div className="text-center">数量</div>
                  <div className="text-center">总价(元)</div>
                  {canEdit && <div className="text-center">操作</div>}
                </div>
                
                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {currentItems.map((item) => (
                    <div key={item.id} className="px-4 py-4 grid grid-cols-12 gap-2 items-center bg-white hover:bg-gray-50 transition-colors">
                      {/* Product Image */}
                      <div className="flex justify-center">
                        {item.sku.imageUrl ? (
                          <img 
                            src={item.sku.imageUrl} 
                            alt={item.sku.name}
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-400">无图</span>
                          </div>
                        )}
                      </div>
                      
                      {/* SKU Code */}
                      <div className="text-sm font-medium text-gray-900">{item.sku.code}</div>
                      
                      {/* Product Name */}
                      <div className="text-sm text-gray-900">{item.sku.name}</div>
                      
                      {/* English Name */}
                      <div className="text-sm text-gray-600">{item.sku.englishName}</div>
                      
                      {/* Category */}
                      <div className="text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.sku.category}
                        </span>
                      </div>
                      
                      {/* Identification Code */}
                      <div className="text-sm text-gray-600">{item.sku.identificationCode}</div>
                      
                      {/* Material */}
                      <div className="text-sm text-gray-600">{item.material || '-'}</div>
                      
                      {/* Packaging Method */}
                      <div className="text-sm text-gray-600">{item.packagingMethod || '-'}</div>
                      
                      {/* Unit Price */}
                      <div className="text-center">
                        {canEdit ? (
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={itemPrices[item.id] || item.unitPrice || ''}
                              onChange={(e) => handleItemPriceChange(item.id, parseFloat(e.target.value) || 0)}
                              className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            ¥{(item.unitPrice || 0).toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      {/* Quantity */}
                      <div className="text-center">
                        <span className="text-sm text-gray-900">{item.quantity}</span>
                      </div>
                      
                      {/* Total Price */}
                      <div className="text-center">
                        <span className="text-sm font-bold text-blue-600">
                          ¥{((itemPrices[item.id] || item.unitPrice || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      {canEdit && (
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="移除此项"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Remarks */}
            {request.remarks && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">申请备注</h3>
                <p className="text-gray-900">{request.remarks}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {canEdit ? '取消' : '关闭'}
              </button>
              {canEdit && (
                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? '分配中...' : '确认分配'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal for Item Removal */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">确认移除SKU</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    确定要从订单中移除这个SKU项目吗？此操作不可撤销。
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setConfirmRemove(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmRemoveItem}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  确认移除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};