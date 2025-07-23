import React, { useState } from 'react';
import { X, Upload, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { PurchaseType } from '../../types';

interface BulkImportPurchaseRequestsProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkImportPurchaseRequests: React.FC<BulkImportPurchaseRequestsProps> = ({ 
  onClose, 
  onSuccess 
}) => {
  const { createPurchaseRequest, getSKUs } = useProcurement();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [purchaseType, setPurchaseType] = useState<PurchaseType>('external');

  const skus = getSKUs();

  const downloadTemplate = () => {
    const headers = ['SKU', '材料', '包装方式', '单价', '数量'];
    const sampleData = [
      'KIT-001,不锈钢材质,纸盒包装方式,15.50,100',
      'HAR-001,塑料材质,塑料袋包装方式,8.80,200',
      'FRA-001,木材材质,气泡膜包装方式,25.00,50'
    ];
    
    // 使用UTF-8 BOM确保Excel正确识别中文字符
    const csvContent = '\uFEFF' + [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '采购申请批量导入模板.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateRequestNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-6); // 取时间戳后6位
    
    const prefix = purchaseType === 'external' ? 'CF' : 'WJ';
    return `${prefix}-${year}${month}${day}${timestamp}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('文件中没有数据行');
      }

      const errors = [];
      const requestsToCreate = [];

      // 一张表格生成一个订单，收集所有有效的SKU项目
      const allItems = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < 5) {
          errors.push({ row: i + 1, message: '数据列数不足，需要5列数据' });
          continue;
        }

        const [skuCode, material, packagingMethod, unitPrice, quantity] = values;

        if (!skuCode || !unitPrice || !quantity) {
          errors.push({ row: i + 1, message: 'SKU、单价、数量不能为空' });
          continue;
        }

        // 验证SKU是否存在
        const sku = skus.find(s => s.code === skuCode);
        if (!sku) {
          errors.push({ row: i + 1, message: `SKU ${skuCode} 不存在，请先在产品列表中添加` });
          continue;
        }

        // 验证数字格式
        const unitPriceNum = parseFloat(unitPrice);
        const quantityNum = parseInt(quantity);

        if (isNaN(unitPriceNum) || unitPriceNum < 0) {
          errors.push({ row: i + 1, message: '单价必须是有效的非负数字' });
          continue;
        }

        if (isNaN(quantityNum) || quantityNum <= 0) {
          errors.push({ row: i + 1, message: '数量必须是大于0的整数' });
          continue;
        }

        // 添加到所有项目列表
        allItems.push({
          skuId: sku.id,
          sku,
          quantity: quantityNum,
          unitPrice: unitPriceNum,
          totalPrice: unitPriceNum * quantityNum,
          material: material && material.trim() !== '' ? material.trim() : '',
          packagingMethod: packagingMethod && packagingMethod.trim() !== '' ? packagingMethod.trim() : '',
          remarks: '',
          status: 'pending' as const
        });
      }

      // 如果有有效的项目，创建一个采购申请
      if (allItems.length > 0) {
        const requestNumber = generateRequestNumber();
        const totalAmount = allItems.reduce((sum, item) => sum + item.totalPrice, 0);

        requestsToCreate.push({
          requestNumber,
          requesterId: user!.id,
          requester: user!,
          items: allItems.map((item, index) => ({
            ...item,
            id: `item-${Date.now()}-${index}`
          })),
          totalAmount,
          status: 'submitted' as const,
          approvalStatus: 'pending' as const,
          remarks: '批量导入创建',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
      }

      if (errors.length > 0 && requestsToCreate.length === 0) {
        setUploadResult({
          success: false,
          totalRows: lines.length - 1,
          successCount: 0,
          createdRequests: 0,
          errors
        });
        return;
      }

      // 创建采购申请
      let successCount = 0;
      for (const requestData of requestsToCreate) {
        try {
          await createPurchaseRequest(requestData);
          successCount++;
        } catch (error) {
          errors.push({ 
            row: 0,
            message: `创建订单 ${requestData.requestNumber} 失败: ${error instanceof Error ? error.message : '未知错误'}` 
          });
        }
      }

      setUploadResult({
        success: successCount > 0,
        totalRows: lines.length - 1,
        successCount: lines.length - 1 - errors.length,
        createdRequests: successCount,
        errors
      });

      if (errors.length === 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }

    } catch (error) {
      console.error('批量导入失败:', error);
      setUploadResult({
        success: false,
        totalRows: 0,
        successCount: 0,
        createdRequests: 0,
        errors: [{ row: 0, message: error instanceof Error ? error.message : '导入失败' }]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">批量导入采购申请</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Purchase Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              采购类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={purchaseType}
              onChange={(e) => setPurchaseType(e.target.value as PurchaseType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="external">厂家包装</option>
              <option value="in_house">自己包装</option>
            </select>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">导入说明</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 支持CSV格式文件</li>
              <li>• 必填字段：SKU、单价、数量</li>
              <li>• 可选字段：材料、包装方式（请使用简体中文）</li>
              <li>• 中文字段：材料和包装方式请使用简体中文，避免特殊符号</li>
              <li>• 系统会自动为每个表格生成唯一的订单编号</li>
              <li>• 订单编号规则：{purchaseType === 'external' ? 'CF' : 'WJ'}-YYYYMMDDXXXXXX</li>
              <li>• SKU必须在产品列表中已存在</li>
              <li>• 一张表格的所有数据生成一个采购申请</li>
              <li>• 请先下载模板文件，按照格式填写数据，保存时选择UTF-8编码</li>
            </ul>
          </div>

          {/* Order Number Generation Rules */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 mb-2">订单编号生成规则</h3>
            <div className="text-sm text-green-700 space-y-1">
              <div>• <strong>厂家包装</strong>：CF-YYYYMMDDXXXXXX（如：CF-20250118123456）</div>
              <div>• <strong>自己包装</strong>：WJ-YYYYMMDDXXXXXX（如：WJ-20250118123456）</div>
              <div>• <strong>时间戳</strong>：YYYYMMDD + 6位时间戳确保唯一性</div>
              <div>• <strong>自动生成</strong>：每个表格自动分配一个唯一编号</div>
            </div>
          </div>

          {/* Download Template */}
          <div className="flex items-center justify-center">
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>下载导入模板</span>
            </button>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-sm text-gray-600 mb-4">
                选择CSV文件或拖拽到此处
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">正在处理文件...</span>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className={`border rounded-lg p-4 ${
              uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center space-x-2 mb-3">
                {uploadResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                <h3 className={`font-medium ${
                  uploadResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uploadResult.success ? '导入完成' : '导入失败'}
                </h3>
              </div>
              
              <div className={`text-sm ${
                uploadResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                <p>总行数: {uploadResult.totalRows}</p>
                <p>成功处理: {uploadResult.successCount}</p>
                <p>创建订单: {uploadResult.createdRequests}</p>
                {uploadResult.errors.length > 0 && (
                  <p>错误数量: {uploadResult.errors.length}</p>
                )}
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">错误详情:</h4>
                  <div className="max-h-32 overflow-y-auto">
                    {uploadResult.errors.map((error: any, index: number) => (
                      <div key={index} className="text-xs text-red-600">
                        {error.row > 0 ? `第${error.row}行: ` : ''}{error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {uploadResult?.success ? '完成' : '取消'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};