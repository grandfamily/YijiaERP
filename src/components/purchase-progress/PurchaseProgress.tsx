import React, { useState, useEffect } from 'react';
import { Check, Clock, AlertCircle, Package, Truck, FileCheck, CreditCard, Factory, Clipboard, ShoppingCart } from 'lucide-react';

interface PurchaseRequest {
  id: string;
  orderNumber: string;
  supplier: string;
  totalAmount: number;
  createdAt: string;
  status: string;
  items: PurchaseItem[];
  allocation?: {
    type: 'internal' | 'external';
  };
}

interface PurchaseItem {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  progress: {
    depositPayment: { status: 'pending' | 'in_progress' | 'completed'; completedAt?: string };
    productionArrangement: { status: 'pending' | 'in_progress' | 'completed'; completedAt?: string };
    cardProvision: { status: 'pending' | 'in_progress' | 'completed'; completedAt?: string };
    packagingProduction: { status: 'pending' | 'in_progress' | 'completed'; completedAt?: string };
    finalPayment: { status: 'pending' | 'in_progress' | 'completed'; completedAt?: string };
    shippingArrangement: { status: 'pending' | 'in_progress' | 'completed'; completedAt?: string };
    deliveryConfirmation: { status: 'pending' | 'in_progress' | 'completed'; completedAt?: string };
  };
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (continueProduction: boolean) => void;
  purchaseQuantity: number;
  arrivalQuantity: number;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  purchaseQuantity,
  arrivalQuantity
}) => {
  if (!isOpen) return null;

  const remainingQuantity = purchaseQuantity - arrivalQuantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          剩余订单是否继续生产？
        </h3>
        
        <div className="mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">采购数量：</span>
            <span className="font-medium">{purchaseQuantity}件</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">到货数量：</span>
            <span className="font-medium text-green-600">{arrivalQuantity}件</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-600">剩余数量：</span>
            <span className="font-medium text-orange-600">{remainingQuantity}件</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => onConfirm(true)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            是（继续生产）
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            否（完成订单）
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export const PurchaseProgress: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'in_progress' | 'completed'>('in_progress');
  const [canEdit] = useState(true);
  const [completedSKUs, setCompletedSKUs] = useState<Set<string>>(new Set());
  const [arrivalQuantities, setArrivalQuantities] = useState<Record<string, number>>({});
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    purchaseQuantity: number;
    arrivalQuantity: number;
  }>({
    isOpen: false,
    itemId: '',
    purchaseQuantity: 0,
    arrivalQuantity: 0
  });

  // Mock data for demonstration
  const [purchaseRequests] = useState<PurchaseRequest[]>([
    {
      id: '1',
      orderNumber: 'PO001',
      supplier: '供应商A',
      totalAmount: 50000,
      createdAt: '2024-01-15',
      status: 'in_progress',
      allocation: { type: 'external' },
      items: [
        {
          id: 'item1',
          sku: 'SKU-001',
          productName: '产品A',
          quantity: 100,
          unitPrice: 250,
          totalPrice: 25000,
          progress: {
            depositPayment: { status: 'completed', completedAt: '2024-01-16' },
            productionArrangement: { status: 'completed', completedAt: '2024-01-17' },
            cardProvision: { status: 'completed', completedAt: '2024-01-18' },
            packagingProduction: { status: 'completed', completedAt: '2024-01-19' },
            finalPayment: { status: 'completed', completedAt: '2024-01-20' },
            shippingArrangement: { status: 'completed', completedAt: '2024-01-21' },
            deliveryConfirmation: { status: 'in_progress' }
          }
        },
        {
          id: 'item2',
          sku: 'SKU-002',
          productName: '产品B',
          quantity: 100,
          unitPrice: 250,
          totalPrice: 25000,
          progress: {
            depositPayment: { status: 'completed', completedAt: '2024-01-16' },
            productionArrangement: { status: 'in_progress' },
            cardProvision: { status: 'pending' },
            packagingProduction: { status: 'pending' },
            finalPayment: { status: 'pending' },
            shippingArrangement: { status: 'pending' },
            deliveryConfirmation: { status: 'pending' }
          }
        }
      ]
    },
    {
      id: '2',
      orderNumber: 'PO002',
      supplier: '供应商B',
      totalAmount: 30000,
      createdAt: '2024-01-20',
      status: 'in_progress',
      allocation: { type: 'internal' },
      items: [
        {
          id: 'item3',
          sku: 'SKU-003',
          productName: '产品C',
          quantity: 120,
          unitPrice: 250,
          totalPrice: 30000,
          progress: {
            depositPayment: { status: 'completed', completedAt: '2024-01-21' },
            productionArrangement: { status: 'completed', completedAt: '2024-01-22' },
            cardProvision: { status: 'completed', completedAt: '2024-01-23' },
            packagingProduction: { status: 'completed', completedAt: '2024-01-24' },
            finalPayment: { status: 'completed', completedAt: '2024-01-25' },
            shippingArrangement: { status: 'completed', completedAt: '2024-01-26' },
            deliveryConfirmation: { status: 'in_progress' }
          }
        }
      ]
    }
  ]);

  // Initialize arrival quantities with purchase quantities
  useEffect(() => {
    const initialQuantities: Record<string, number> = {};
    purchaseRequests.forEach(request => {
      request.items.forEach(item => {
        initialQuantities[item.id] = item.quantity;
      });
    });
    setArrivalQuantities(initialQuantities);
  }, [purchaseRequests]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '进行中';
      default:
        return '待开始';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStageIcon = (stageName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      depositPayment: <CreditCard className="w-4 h-4" />,
      productionArrangement: <Factory className="w-4 h-4" />,
      cardProvision: <Clipboard className="w-4 h-4" />,
      packagingProduction: <Package className="w-4 h-4" />,
      finalPayment: <CreditCard className="w-4 h-4" />,
      shippingArrangement: <Truck className="w-4 h-4" />,
      deliveryConfirmation: <FileCheck className="w-4 h-4" />
    };
    return iconMap[stageName] || <AlertCircle className="w-4 h-4" />;
  };

  const getStageName = (stageName: string) => {
    const nameMap: Record<string, string> = {
      depositPayment: '定金支付',
      productionArrangement: '安排生产',
      cardProvision: '纸卡提供',
      packagingProduction: '包装生产',
      finalPayment: '尾款支付',
      shippingArrangement: '安排发货',
      deliveryConfirmation: '收货确认'
    };
    return nameMap[stageName] || stageName;
  };

  const isSKUCompleted = (itemId: string) => {
    return completedSKUs.has(itemId);
  };

  const canSaveArrivalQuantity = (item: PurchaseItem): boolean => {
    const progress = item.progress;
    
    // 检查前6个必需节点是否都已完成
    const requiredStages = [
      'depositPayment',
      'productionArrangement', 
      'cardProvision',
      'packagingProduction',
      'finalPayment',
      'shippingArrangement'
    ];
    
    const allPreviousCompleted = requiredStages.every(stage => 
      progress[stage as keyof typeof progress]?.status === 'completed'
    );
    
    // 检查收货确认节点是否为进行中
    const deliveryInProgress = progress.deliveryConfirmation.status === 'in_progress';
    
    // 检查SKU是否已完成
    const skuNotCompleted = !isSKUCompleted(item.id);
    
    return allPreviousCompleted && deliveryInProgress && skuNotCompleted;
  };

  const handleSKUComplete = (itemId: string) => {
    setCompletedSKUs(prev => new Set([...prev, itemId]));
  };

  const handleBatchCompleteStage = (requestId: string, stageName: string) => {
    console.log(`Batch completing stage ${stageName} for request ${requestId}`);
  };

  const handleArrivalQuantityChange = (itemId: string, quantity: number) => {
    setArrivalQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };

  const handleSaveArrivalQuantity = (item: PurchaseItem) => {
    const arrivalQty = arrivalQuantities[item.id] || 0;
    const purchaseQty = item.quantity;

    if (arrivalQty >= purchaseQty) {
      // 情况A：到货数量 >= 采购数量，直接完成
      handleSKUComplete(item.id);
    } else {
      // 情况B：到货数量 < 采购数量，弹出确认对话框
      setConfirmationDialog({
        isOpen: true,
        itemId: item.id,
        purchaseQuantity: purchaseQty,
        arrivalQuantity: arrivalQty
      });
    }
  };

  const handleConfirmationDialogConfirm = (continueProduction: boolean) => {
    const { itemId } = confirmationDialog;
    
    if (continueProduction) {
      // 选择"是"：拆分SKU记录
      // 这里应该调用API来拆分记录，现在先简单处理
      console.log(`拆分SKU ${itemId}，已到货部分完成，剩余部分继续生产`);
      handleSKUComplete(itemId);
    } else {
      // 选择"否"：按实际到货数量完成
      console.log(`按实际到货数量完成SKU ${itemId}`);
      handleSKUComplete(itemId);
    }
    
    setConfirmationDialog({
      isOpen: false,
      itemId: '',
      purchaseQuantity: 0,
      arrivalQuantity: 0
    });
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialog({
      isOpen: false,
      itemId: '',
      purchaseQuantity: 0,
      arrivalQuantity: 0
    });
  };

  const getProgressPercentage = (progress: PurchaseItem['progress'], itemId: string) => {
    if (isSKUCompleted(itemId)) return 100;
    
    const stages = Object.values(progress);
    const completedStages = stages.filter(stage => stage.status === 'completed').length;
    return Math.round((completedStages / stages.length) * 100);
  };

  const getItemProgress = (item: PurchaseItem) => {
    if (isSKUCompleted(item.id)) {
      // 已完成的SKU，所有阶段都显示为已完成
      return {
        depositPayment: { status: 'completed' as const, completedAt: item.progress.depositPayment.completedAt || new Date().toISOString() },
        productionArrangement: { status: 'completed' as const, completedAt: item.progress.productionArrangement.completedAt || new Date().toISOString() },
        cardProvision: { status: 'completed' as const, completedAt: item.progress.cardProvision.completedAt || new Date().toISOString() },
        packagingProduction: { status: 'completed' as const, completedAt: item.progress.packagingProduction.completedAt || new Date().toISOString() },
        finalPayment: { status: 'completed' as const, completedAt: item.progress.finalPayment.completedAt || new Date().toISOString() },
        shippingArrangement: { status: 'completed' as const, completedAt: item.progress.shippingArrangement.completedAt || new Date().toISOString() },
        deliveryConfirmation: { status: 'completed' as const, completedAt: new Date().toISOString() }
      };
    }
    return item.progress;
  };

  const filteredRequests = purchaseRequests.map(request => ({
    ...request,
    items: request.items.filter(item => {
      const isCompleted = isSKUCompleted(item.id);
      return activeTab === 'completed' ? isCompleted : !isCompleted;
    })
  })).filter(request => request.items.length > 0);

  return (
    <div className="p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">采购进度</h1>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('in_progress')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'in_progress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              进行中
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              已完成
            </button>
          </nav>
        </div>
      </div>

      {/* Purchase Progress Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                订单信息
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                SKU信息
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                定金支付
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                安排生产
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                纸卡提供
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                包装生产
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                尾款支付
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                安排发货
              </th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                收货确认
              </th>
              {/* 仅厂家包装订单在进行中栏目显示到货数量列 */}
              {activeTab === 'in_progress' && (
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  到货数量
                </th>
              )}
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                进度
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRequests.map((request) => 
              request.items.map((item, itemIndex) => {
                const progress = getItemProgress(item);
                const progressPercentage = getProgressPercentage(item.progress, item.id);
                const isExternalPackaging = request.allocation?.type === 'external';
                
                return (
                  <tr key={`${request.id}-${item.id}`} className="hover:bg-gray-50">
                    {/* 订单信息 */}
                    <td className="py-4 px-4 border-b">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{request.orderNumber}</div>
                        <div className="text-gray-500">{request.supplier}</div>
                        <div className="text-gray-500">¥{request.totalAmount.toLocaleString()}</div>
                        <div className="text-gray-500">{request.createdAt}</div>
                      </div>
                    </td>

                    {/* SKU信息 */}
                    <td className="py-4 px-4 border-b">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{item.sku}</div>
                        <div className="text-gray-500">{item.productName}</div>
                        <div className="text-gray-500">数量: {item.quantity}</div>
                        <div className="text-gray-500">单价: ¥{item.unitPrice}</div>
                        <div className="text-gray-500">总价: ¥{item.totalPrice.toLocaleString()}</div>
                      </div>
                    </td>

                    {/* 各个阶段状态 */}
                    {Object.entries(progress).map(([stageName, stage]) => (
                      <td key={stageName} className="py-4 px-4 text-center border-b">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="flex items-center space-x-1">
                            {getStageIcon(stageName)}
                            {getStatusIcon(stage.status)}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(stage.status)}`}>
                            {getStatusText(stage.status)}
                          </span>
                          {stage.completedAt && (
                            <div className="text-xs text-gray-500">
                              {new Date(stage.completedAt).toLocaleDateString()}
                            </div>
                          )}
                          {/* 收货确认节点的完成按钮 - 仅自己包装订单显示 */}
                          {stageName === 'deliveryConfirmation' && 
                           stage.status === 'in_progress' && 
                           activeTab === 'in_progress' && 
                           !isSKUCompleted(item.id) &&
                           !isExternalPackaging && (
                            <button
                              onClick={() => handleSKUComplete(item.id)}
                              className="mt-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              完成
                            </button>
                          )}
                        </div>
                      </td>
                    ))}

                    {/* 到货数量列 - 仅厂家包装订单在进行中栏目显示 */}
                    {activeTab === 'in_progress' && (
                      <td className="py-4 px-4 text-center border-b">
                        {isExternalPackaging ? (
                          <div className="flex flex-col items-center space-y-2">
                            <input
                              type="number"
                              min="0"
                              value={arrivalQuantities[item.id] || item.quantity}
                              onChange={(e) => handleArrivalQuantityChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isSKUCompleted(item.id)}
                            />
                            <button
                              onClick={() => handleSaveArrivalQuantity(item)}
                              disabled={!canSaveArrivalQuantity(item)}
                              className={`px-3 py-1 text-xs rounded transition-colors ${
                                canSaveArrivalQuantity(item)
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              保存
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    )}

                    {/* 进度 */}
                    <td className="py-4 px-4 text-center border-b">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{progressPercentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}

            {/* Batch Complete Rows for each request */}
            <>
              {canEdit && activeTab === 'in_progress' && filteredRequests.map((request) => (
                <tr key={`batch-${request.id}`} className="bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-700" colSpan={5}>
                    批量操作 - {request.orderNumber}
                  </td>
                  {/* 批量完成按钮 */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleBatchCompleteStage(request.id, 'depositPayment')}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      批量完成
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleBatchCompleteStage(request.id, 'productionArrangement')}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      批量完成
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleBatchCompleteStage(request.id, 'cardProvision')}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      批量完成
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleBatchCompleteStage(request.id, 'packagingProduction')}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      批量完成
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleBatchCompleteStage(request.id, 'finalPayment')}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      批量完成
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleBatchCompleteStage(request.id, 'shippingArrangement')}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      批量完成
                    </button>
                  </td>
                  {/* 到货数量列占位 */}
                  {activeTab === 'in_progress' && (
                    <td className="py-3 px-4"></td>
                  )}
                  <td className="py-3 px-4"></td>
                </tr>
              ))}
            </>
          </tbody>
        </table>
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          暂无{activeTab === 'completed' ? '已完成' : '进行中'}的采购订单
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleConfirmationDialogClose}
        onConfirm={handleConfirmationDialogConfirm}
        purchaseQuantity={confirmationDialog.purchaseQuantity}
        arrivalQuantity={confirmationDialog.arrivalQuantity}
      />
    </div>
  );
};