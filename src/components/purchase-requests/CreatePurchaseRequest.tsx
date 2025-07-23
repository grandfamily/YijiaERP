import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, ZoomIn, Search, ChevronDown } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseType, PurchaseRequestItem, SKU } from '../../types';

interface CreatePurchaseRequestProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface SKUSearchProps {
  value: string;
  onChange: (skuId: string) => void;
  skus: SKU[];
  placeholder?: string;
  required?: boolean;
}

const SKUSearch: React.FC<SKUSearchProps> = ({ 
  value, 
  onChange, 
  skus, 
  placeholder = "搜索SKU编码或产品名称...",
  required = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSKUs, setFilteredSKUs] = useState<SKU[]>([]);
  const [selectedSKU, setSelectedSKU] = useState<SKU | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize selected SKU when value changes
  useEffect(() => {
    if (value) {
      const sku = skus.find(s => s.id === value);
      setSelectedSKU(sku || null);
      setSearchTerm(sku ? `${sku.code} - ${sku.name}` : '');
    } else {
      setSelectedSKU(null);
      setSearchTerm('');
    }
  }, [value, skus]);

  // Filter SKUs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSKUs(skus.slice(0, 10)); // Show first 10 SKUs when no search term
    } else {
      const filtered = skus.filter(sku => 
        sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sku.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sku.identificationCode.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10); // Limit to 10 results for performance
      
      setFilteredSKUs(filtered);
      
      // Auto-select if only one exact match
      if (filtered.length === 1 && 
          (filtered[0].code.toLowerCase() === searchTerm.toLowerCase() ||
           filtered[0].name.toLowerCase() === searchTerm.toLowerCase())) {
        handleSelectSKU(filtered[0]);
      }
    }
  }, [searchTerm, skus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // Clear selection if user is typing
    if (selectedSKU && newValue !== `${selectedSKU.code} - ${selectedSKU.name}`) {
      setSelectedSKU(null);
      onChange('');
    }
  };

  const handleSelectSKU = (sku: SKU) => {
    setSelectedSKU(sku);
    setSearchTerm(`${sku.code} - ${sku.name}`);
    setIsOpen(false);
    onChange(sku.id);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSKUs.length === 1) {
        handleSelectSKU(filteredSKUs[0]);
      }
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredSKUs.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {searchTerm ? '未找到匹配的SKU' : '请输入搜索关键词'}
            </div>
          ) : (
            <>
              {!searchTerm && (
                <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-b">
                  请选择SKU
                </div>
              )}
              {filteredSKUs.map((sku) => (
                <div
                  key={sku.id}
                  onClick={() => handleSelectSKU(sku)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    {sku.imageUrl && (
                      <img 
                        src={sku.imageUrl} 
                        alt={sku.name}
                        className="w-8 h-8 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 text-sm">{sku.code}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {sku.category}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 truncate">{sku.name}</div>
                      <div className="text-xs text-gray-500 truncate">{sku.englishName}</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const CreatePurchaseRequest: React.FC<CreatePurchaseRequestProps> = ({ onClose, onSuccess }) => {
  const { createPurchaseRequest, getSKUs, getSuppliers } = useProcurement();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    remarks: ''
  });

  const [items, setItems] = useState<Omit<PurchaseRequestItem, 'id' | 'status' | 'sku' | 'supplier' | 'unitPrice' | 'totalPrice' | 'supplierId' | 'deadline' | 'paymentTerms'>[]>([
    {
      skuId: '',
      quantity: 1,
      unitPrice: 0,
      remarks: '',
      material: '',
      packagingMethod: ''
    }
  ]);

  const skus = getSKUs();

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate total price when unit price or quantity changes
    if (field === 'unitPrice' || field === 'quantity') {
      const unitPrice = field === 'unitPrice' ? value : (newItems[index].unitPrice || 0);
      const quantity = field === 'quantity' ? value : newItems[index].quantity;
      newItems[index].totalPrice = unitPrice * quantity;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { 
      skuId: '',
      quantity: 1,
      unitPrice: 0,
      remarks: '',
      material: '',
      packagingMethod: ''
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Calculate total amount for all items
  const getTotalAmount = () => {
    return items.reduce((sum, item) => {
      const unitPrice = item.unitPrice || 0;
      const quantity = item.quantity || 0;
      return sum + (unitPrice * quantity);
    }, 0);
  };

  const getSelectedSKU = (skuId: string) => {
    return skus.find(sku => sku.id === skuId);
  };

  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;


    setLoading(true);
    try {
      const requestItems: PurchaseRequestItem[] = items.map((item, index) => {
        const sku = skus.find(s => s.id === item.skuId);
        
        if (!sku) {
          throw new Error(`SKU未找到: ${item.skuId}`);
        }
        
        return {
          id: `item-${Date.now()}-${index}`,
          skuId: item.skuId,
          sku: sku!,
          quantity: item.quantity,
          unitPrice: item.unitPrice || 0,
          totalPrice: (item.unitPrice || 0) * item.quantity,
          remarks: item.remarks,
          status: 'pending',
          material: item.material,
          packagingMethod: item.packagingMethod
        };
      });


      const newRequest = {
        requesterId: user.id,
        requester: user,
        items: requestItems,
        totalAmount: getTotalAmount(),
        status: 'submitted',
        approvalStatus: 'pending',
        remarks: formData.remarks,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 保留内部使用，不显示
      };


      await createPurchaseRequest(newRequest);

      onSuccess();
    } catch (error) {
      console.error('❌ 创建采购申请失败:', error);
      alert(`创建采购申请失败: ${error instanceof Error ? error.message : '未知错误'}，请重试`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">创建采购申请</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">采购项目</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>添加SKU</span>
                </button>
              </div>

              <div className="space-y-6">
                {items.map((item, index) => {
                  const selectedSKU = getSelectedSKU(item.skuId);
                  
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 text-sm">项目 {index + 1}</h4>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* SKU Search */}
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            搜索SKU <span className="text-red-500">*</span>
                          </label>
                        </div>
                        <SKUSearch
                          value={item.skuId}
                          onChange={(skuId) => handleItemChange(index, 'skuId', skuId)}
                          skus={skus}
                          placeholder="输入SKU编码或产品名称进行搜索..."
                          required
                        />
                      </div>

                      <>
                      {/* Single Row SKU Information Display */}
                      {selectedSKU && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                          {/* Header Row - Updated to include price fields */}
                          <div className="bg-gray-100 px-4 py-2 grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 border-b border-gray-200">
                            <div className="text-center">图片</div>
                            <div>SKU编码</div>
                            <div>产品名称</div>
                            <div>英文名称</div>
                            <div>产品类别</div>
                            <div>识别码</div>
                            <div>材料</div>
                            <div>包装方式</div>
                            <div className="text-center">单价(元)</div>
                            <div>数量</div>
                            <div className="text-center">总价(元)</div>
                          </div>
                          
                          {/* Data Row */}
                          <div className="px-4 py-3 grid grid-cols-12 gap-2 items-center bg-white">
                            {/* Product Image */}
                            <div className="flex justify-center">
                              {selectedSKU.imageUrl ? (
                                <div className="relative group">
                                  <img 
                                    src={selectedSKU.imageUrl} 
                                    alt={selectedSKU.name}
                                    className="w-10 h-10 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => handleImageClick(selectedSKU.imageUrl!)}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                                       onClick={() => handleImageClick(selectedSKU.imageUrl!)}>
                                    <ZoomIn className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded border flex items-center justify-center">
                                  <span className="text-xs text-gray-400">无图</span>
                                </div>
                              )}
                            </div>
                            
                            {/* SKU Code */}
                            <div className="text-sm font-medium text-gray-900" title={selectedSKU.code}>
                              {selectedSKU.code}
                            </div>
                            
                            {/* Product Name (Chinese) */}
                            <div className="text-sm text-gray-900 truncate" title={selectedSKU.name}>
                              {selectedSKU.name}
                            </div>
                            
                            {/* Product Name (English) */}
                            <div className="text-sm text-gray-600" title={selectedSKU.englishName}>
                              {selectedSKU.englishName}
                            </div>
                            
                            {/* Category */}
                            <div className="text-sm text-gray-600 truncate" title={selectedSKU.category}>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {selectedSKU.category}
                              </span>
                            </div>
                            
                            {/* Identification Code */}
                            <div className="text-sm text-gray-600" title={selectedSKU.identificationCode}>
                              {selectedSKU.identificationCode}
                            </div>
                            
                            {/* Material */}
                            <div>
                              <input
                                type="text"
                                value={item.material}
                                onChange={(e) => handleItemChange(index, 'material', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="材料"
                              />
                            </div>
                            
                            {/* Packaging Method */}
                            <div>
                              <input
                                type="text"
                                value={item.packagingMethod}
                                onChange={(e) => handleItemChange(index, 'packagingMethod', e.target.value)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="包装方式"
                              />
                            </div>
                            
                            {/* Unit Price */}
                            <div>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice || ''}
                                onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent text-center"
                                placeholder="0.00"
                              />
                            </div>
                            
                            {/* Quantity */}
                            <div>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent text-center"
                                required
                              />
                            </div>
                            
                            {/* Total Price (Auto-calculated) */}
                            <div className="text-center">
                              <span className="text-sm font-bold text-blue-600">
                                ¥{((item.unitPrice || 0) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show message when no SKU selected */}
                      {!selectedSKU && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          请搜索并选择SKU以查看产品信息
                        </div>
                      )}
                      </>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Amount Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">申请总金额:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ¥{getTotalAmount().toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                包含 {items.length} 个SKU项目
              </p>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                申请备注
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入申请备注..."
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '创建中...' : '创建申请'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Zoom Modal */}
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
    </>
  );
};