import React, { useState } from 'react';
import { X, Upload, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';

interface BulkCostUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkCostUploadModal: React.FC<BulkCostUploadModalProps> = ({ onClose, onSuccess }) => {
  const { getAccessoryProgress, updateAccessoryProgress, getPurchaseRequests } = useProcurement();
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const accessoryProgress = getAccessoryProgress();
  const { data: purchaseRequests } = getPurchaseRequests();

  const downloadTemplate = () => {
    const headers = ['订单编号*', 'SKU编码*', '产品名称', '采购数量*', '泡壳*', '中托*', 
      '纸箱*', '条码*', '唛头*', '刀版*', '模具*'
    ];
    
    const sampleData = [
      'CF-20250001,KIT-001,厨房用品A,100,10,10,2,5,10,25,45',
      'WJ-20250001,HAR-001,五金用品B,200,15,12,3,6,8,30,50'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '辅料成本导入模板.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        
        if (values.length < 11) {
          errors.push({ row: i + 1, message: '数据列数不足，需要11列数据' });
          continue;
        }

        const [
          orderNumber, skuCode, productName, purchaseQuantity, blisterCost, trayCost,
          cartonCost, barcodeCost, labelCost, dieCost, moldCost
        ] = values;

        if (!orderNumber || !skuCode) {
          errors.push({ row: i + 1, message: '订单编号和SKU编码不能为空' });
          continue;
        }

        // 清理数据，移除空格
        const cleanOrderNumber = orderNumber.trim();
        const cleanSkuCode = skuCode.trim();
        const cleanProductName = productName ? productName.trim() : '';

        // 查找对应的采购申请
        const request = purchaseRequests.find(pr => pr.requestNumber === cleanOrderNumber);
        if (!request) {
          errors.push({ row: i + 1, message: `订单编号 ${cleanOrderNumber} 不存在` });
          continue;
        }

        // 查找对应的辅料进度记录
        const progress = accessoryProgress.find(ap => 
          ap.purchaseRequestId === request.id && ap.sku.code === cleanSkuCode
        );
        
        if (!progress) {
          errors.push({ row: i + 1, message: `SKU ${cleanSkuCode} 在订单 ${cleanOrderNumber} 中不存在辅料进度记录` });
          continue;
        }

        // 验证采购数量
        const purchaseQty = purchaseQuantity ? parseFloat(purchaseQuantity.trim()) : NaN;
        if (isNaN(purchaseQty) || purchaseQty < 0) {
          errors.push({ row: i + 1, message: '采购数量必须是有效的非负数字' });
          continue;
        }

        // 验证成本数据 - 单独处理每个字段以便更精确的错误信息
        const costFields = [
          { name: '泡壳', value: blisterCost },
          { name: '中托', value: trayCost },
          { name: '纸箱', value: cartonCost },
          { name: '条码', value: barcodeCost },
          { name: '唛头', value: labelCost },
          { name: '刀版', value: dieCost },
          { name: '模具', value: moldCost }
        ];
        
        let hasInvalidCost = false;
        const numericCosts = costFields.map((field, index) => {
          const trimmedValue = field.value ? field.value.toString().trim() : '';
          const cost = parseFloat(trimmedValue);
          
          if (isNaN(cost) || cost < 0) {
            errors.push({ row: i + 1, message: `${field.name}成本必须是有效的非负数字，当前值: "${trimmedValue}"` });
            hasInvalidCost = true;
            return 0;
          }
          return cost;
        });
        
        if (hasInvalidCost) {
          continue;
        }

        try {
          // 更新辅料项目成本
          const updatedAccessories = progress.accessories.map(accessory => {
            let cost = 0; 
            switch (accessory.type) {
              case 'blister': cost = numericCosts[0]; break;
              case 'tray': cost = numericCosts[1]; break;
              case 'carton': cost = numericCosts[2]; break;
              case 'barcode': cost = numericCosts[3]; break;
              case 'label': cost = numericCosts[4]; break;
            }
            return { ...accessory, cost };
          });

          // 计算总成本
          const totalCost = numericCosts.reduce((sum, cost) => sum + cost, 0);

          await updateAccessoryProgress(progress.id, {
            accessories: updatedAccessories,
            purchaseQuantity: purchaseQty,
            blisterCost: numericCosts[0],
            trayCost: numericCosts[1],
            cartonCost: numericCosts[2],
            barcodeCost: numericCosts[3],
            labelCost: numericCosts[4],
            dieCost: numericCosts[5],
            moldCost: numericCosts[6],
            totalCost,
            updatedAt: new Date()
          });

          successCount++;
        } catch (error) {
          errors.push({ row: i + 1, message: '更新辅料成本失败' });
        }
      }

      setUploadResult({
        success: successCount > 0,
        totalRows: lines.length - 1,
        successCount,
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
          <h2 className="text-xl font-semibold text-gray-900">批量导入辅料成本</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">导入说明</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 支持CSV格式文件</li>
              <li>• 必填字段：订单编号、SKU编码、采购数量、7项成本数据（泡壳、中托、纸箱、条码、唛头、刀版、模具）</li>
              <li>• 成本数据必须是有效的非负数字，精确到小数点后2位</li>
              <li>• 系统将根据订单编号和SKU编码自动匹配对应的辅料进度记录</li>
              <li>• 辅料总成本 = 泡壳 + 中托 + 纸箱 + 条码 + 唛头 + 刀版 + 模具</li>
              <li>• 请先下载模板文件，按照格式填写数据</li>
            </ul>
          </div>

          {/* Cost Items Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 mb-2">辅料成本项目说明</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
              <div>• 采购数量：生产所需数量</div>
              <div>• 泡壳成本：长周期辅料</div>
              <div>• 中托成本：长周期辅料</div>
              <div>• 纸箱成本：短周期辅料</div>
              <div>• 条码成本：短周期辅料</div>
              <div>• 唛头成本：短周期辅料</div>
              <div>• 模具成本：一次性投入</div>
              <div>• 刀版成本：一次性投入</div>
              <div className="col-span-2 font-medium text-green-900">
                • 总成本计算：泡壳+中托+纸箱+条码+唛头+刀版+模具
              </div>
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
                <p>成功导入: {uploadResult.successCount}</p>
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
                        第{error.row}行: {error.message}
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