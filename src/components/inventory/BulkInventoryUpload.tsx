import React, { useState } from 'react';
import { X, Upload, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';

interface BulkInventoryUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkInventoryUpload: React.FC<BulkInventoryUploadProps> = ({ onClose, onSuccess }) => {
  const { bulkUpdateInventory, getSKUs } = useProcurement();
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const skus = getSKUs();

  const downloadTemplate = () => {
    const headers = ['SKU*', '品名', '在途数*', '在库数*', '总库存*', '补货周期*', '补货点*', '目标覆盖期*', '预测月销量*', '预计可售时间*', '建议补货量*'];
    const sampleData = [
      'KIT-001,厨房用品A,50,150,200,30,100,45,80,75,120',
      'HAR-001,五金用品B,30,70,100,25,120,40,60,50,150',
      'FRA-001,相框C,0,80,80,20,90,35,45,53,100'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '库存导入模板.csv');
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

      const inventoryData = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        
        if (values.length < 10) {
          errors.push({ row: i + 1, message: '数据列数不足，至少需要10列数据' });
          continue;
        }

        const [skuCode, productName, inTransit, inStock, total, replenishmentCycle, replenishmentPoint, targetCoveragePeriod, forecastMonthlySales, estimatedSalesDays, suggestedReplenishment] = values.map(v => v.trim());

        if (!skuCode || !inTransit || !inStock || !total || !replenishmentCycle || !replenishmentPoint || !targetCoveragePeriod || !forecastMonthlySales || !estimatedSalesDays || !suggestedReplenishment) {
          errors.push({ row: i + 1, message: '所有必填字段都不能为空' });
          continue;
        }

        // 验证SKU是否存在
        const sku = skus.find(s => s.code === skuCode);
        if (!sku) {
          errors.push({ row: i + 1, message: `SKU ${skuCode} 不存在，请先在产品列表中添加` });
          continue;
        }

        // 验证数字格式
        const inTransitNum = parseInt(inTransit);
        const inStockNum = parseInt(inStock);
        const totalNum = parseInt(total);
        const replenishmentCycleNum = parseInt(replenishmentCycle);
        const replenishmentPointNum = parseInt(replenishmentPoint);
        const targetCoveragePeriodNum = parseInt(targetCoveragePeriod);
        const forecastMonthlySalesNum = parseInt(forecastMonthlySales);
        const estimatedSalesDaysNum = parseInt(estimatedSalesDays);
        const suggestedReplenishmentNum = parseInt(suggestedReplenishment);

        if (isNaN(inTransitNum) || isNaN(inStockNum) || isNaN(totalNum) || isNaN(replenishmentCycleNum) || isNaN(replenishmentPointNum) || isNaN(targetCoveragePeriodNum) || isNaN(forecastMonthlySalesNum) || isNaN(estimatedSalesDaysNum) || isNaN(suggestedReplenishmentNum)) {
          errors.push({ row: i + 1, message: '所有数字字段必须是有效数字' });
          continue;
        }

        if (inTransitNum < 0 || inStockNum < 0 || totalNum < 0 || replenishmentCycleNum < 0 || replenishmentPointNum < 0 || targetCoveragePeriodNum < 0 || forecastMonthlySalesNum < 0 || estimatedSalesDaysNum < 0 || suggestedReplenishmentNum < 0) {
          errors.push({ row: i + 1, message: '所有数量字段不能为负数' });
          continue;
        }

        // 验证总库存是否等于在途数+在库数
        if (totalNum !== inTransitNum + inStockNum) {
          errors.push({ row: i + 1, message: '总库存应该等于在途数+在库数' });
          continue;
        }

        inventoryData.push({
          skuId: sku.id,
          sku,
          inTransitQuantity: inTransitNum,
          inStockQuantity: inStockNum,
          totalQuantity: totalNum,
          replenishmentCycle: replenishmentCycleNum,
          replenishmentPoint: replenishmentPointNum,
          targetCoveragePeriod: targetCoveragePeriodNum,
          forecastMonthlySales: forecastMonthlySalesNum,
          estimatedSalesDays: estimatedSalesDaysNum,
          suggestedReplenishment: suggestedReplenishmentNum
        });
      }

      if (errors.length > 0 && inventoryData.length === 0) {
        setUploadResult({
          success: false,
          totalRows: lines.length - 1,
          successCount: 0,
          errors
        });
        return;
      }

      const result = await bulkUpdateInventory(inventoryData);
      setUploadResult({
        success: true,
        totalRows: lines.length - 1,
        successCount: inventoryData.length,
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">批量导入库存销量</h2>
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
              <li>• 必填字段：SKU、在途数、在库数、总库存、补货周期、补货点、目标覆盖期、预测月销量、预计可售时间、建议补货量</li>
              <li>• 总库存 = 在途数 + 在库数</li>
              <li>• SKU必须在产品列表中已存在</li>
              <li>• 请先下载模板文件，按照格式填写数据</li>
            </ul>
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