import React, { useState } from 'react';
import { X, Save, Upload, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { useProduction } from '../../hooks/useProduction';
import { useProcurement } from '../../hooks/useProcurement';

interface BulkScheduleFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkScheduleForm: React.FC<BulkScheduleFormProps> = ({ onClose, onSuccess }) => {
  const { bulkCreateProductionSchedules, getAvailableMachines } = useProduction();
  const { getSKUs } = useProcurement();
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const skus = getSKUs();
  const machines = getAvailableMachines();

  const downloadTemplate = () => {
    const headers = ['SKU编码*', '排单日期*', '计划数量*', '包装方式*', '机器*', '备注'];
    const sampleData = [
      'KIT-001,2024-08-01,100,纸盒包装,包装机A,优先生产',
      'HAR-001,2024-08-02,50,塑料包装,包装机B,',
      'FRA-001,2024-08-03,200,气泡膜包装,包装机C,批量生产'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '生产排单导入模板.csv');
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

      const scheduleData = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        
        if (values.length < 5) {
          errors.push({ row: i + 1, message: '数据列数不足，至少需要5列必填数据' });
          continue;
        }

        const [skuCode, scheduledDate, plannedQuantity, packagingMethod, machine, remarks] = values;

        if (!skuCode || !scheduledDate || !plannedQuantity || !packagingMethod || !machine) {
          errors.push({ row: i + 1, message: '必填字段不能为空' });
          continue;
        }

        // 验证SKU是否存在
        const sku = skus.find(s => s.code === skuCode.trim());
        if (!sku) {
          errors.push({ row: i + 1, message: `SKU ${skuCode} 不存在` });
          continue;
        }

        // 验证日期格式
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(scheduledDate.trim())) {
          errors.push({ row: i + 1, message: `日期格式不正确，应为YYYY-MM-DD格式` });
          continue;
        }

        // 验证数量
        const quantity = parseInt(plannedQuantity.trim());
        if (isNaN(quantity) || quantity <= 0) {
          errors.push({ row: i + 1, message: `计划数量必须是大于0的整数` });
          continue;
        }

        // 验证机器是否有效
        const trimmedMachine = machine.trim();
        if (!machines.includes(trimmedMachine)) {
          errors.push({ row: i + 1, message: `机器 ${trimmedMachine} 不存在` });
          continue;
        }

        scheduleData.push({
          skuId: sku.id,
          sku,
          purchaseRequestId: 'bulk-import', // 批量导入的标记
          scheduledDate: new Date(scheduledDate.trim()),
          plannedQuantity: quantity,
          packagingMethod: packagingMethod.trim(),
          machine: trimmedMachine,
          status: 'pending',
          remarks: remarks ? remarks.trim() : ''
        });
      }

      if (errors.length > 0 && scheduleData.length === 0) {
        setUploadResult({
          success: false,
          totalRows: lines.length - 1,
          successCount: 0,
          errors
        });
        return;
      }

      const result = await bulkCreateProductionSchedules(scheduleData);
      setUploadResult({
        success: true,
        totalRows: lines.length - 1,
        successCount: scheduleData.length,
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
          <h2 className="text-xl font-semibold text-gray-900">批量导入生产排单</h2>
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
              <li>• 必填字段：SKU编码、排单日期、计划数量、包装方式、机器</li>
              <li>• 可选字段：备注</li>
              <li>• 日期格式：YYYY-MM-DD</li>
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