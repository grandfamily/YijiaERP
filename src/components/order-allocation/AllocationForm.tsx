import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseType, PaymentMethod, CardType } from '../../types';

interface AllocationFormProps {
  requestId: string;
  onClose: () => void;
  onSuccess: (allocationData: any) => void;
}

export const AllocationForm: React.FC<AllocationFormProps> = ({
  requestId,
  onClose,
  onSuccess
}) => {
  const { getPurchaseRequestById } = useProcurement();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const request = getPurchaseRequestById(requestId);

  const [formData, setFormData] = useState({
    type: 'external' as PurchaseType,
    paymentMethod: 'payment_on_delivery' as PaymentMethod,
    prepaymentAmount: 0,
    creditDate: '',
    productionDate: '',
    deliveryDate: '',
    cardType: 'finished' as CardType,
    remarks: ''
  });

  if (!request) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const allocationData = {
        type: formData.type,
        paymentMethod: formData.paymentMethod,
        prepaymentAmount: formData.prepaymentAmount,
        creditDate: formData.creditDate ? new Date(formData.creditDate) : undefined,
        productionDate: new Date(formData.productionDate),
        deliveryDate: new Date(formData.deliveryDate),
        allocationStatus: 'allocated' as const,
        cardType: formData.cardType,
        remarks: formData.remarks
      };

      onSuccess(allocationData);
    } catch (error) {
      console.error('分配订单失败:', error);
      alert('分配订单失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            分配订单 - {request.requestNumber}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">订单信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">申请人:</span>
                <p className="font-medium">{request.requester.name}</p>
              </div>
              <div>
                <span className="text-gray-600">总金额:</span>
                <p className="font-medium">¥{request.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-600">SKU数量:</span>
                <p className="font-medium">{request.items.length}</p>
              </div>
              <div>
                <span className="text-gray-600">提交时间:</span>
                <p className="font-medium">{new Date(request.createdAt).toLocaleDateString('zh-CN')}</p>
              </div>
            </div>
          </div>

          {/* Allocation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分配类型 <span className="text-red-500">*</span>
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

          {/* Payment Method */}
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

          {/* Prepayment Amount */}
          {(formData.paymentMethod === 'payment_on_delivery' || formData.paymentMethod === 'cash_on_delivery') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预付定金金额 (元)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.prepaymentAmount}
                onChange={(e) => setFormData({...formData, prepaymentAmount: parseFloat(e.target.value) || 0})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          )}

          {/* Credit Date */}
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

          {/* Production Date */}
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

          {/* Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              交货日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Card Type */}
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

          {/* Remarks */}
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

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? '分配中...' : '确认分配'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};