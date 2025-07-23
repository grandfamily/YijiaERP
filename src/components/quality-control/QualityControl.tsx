import React from 'react';
import { QrCode, CheckCircle, XCircle, AlertTriangle, Package, Search } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

// Mock data for quality control
const qualityControlData = [
  {
    id: 'qc-001',
    purchaseRequestNumber: 'PR-2024-001',
    items: [
      {
        id: 'item-001',
        skuCode: 'ELE-001',
        skuName: '电子产品A',
        expectedQuantity: 100,
        receivedQuantity: 100,
        inspectedQuantity: 100,
        passedQuantity: 95,
        rejectedQuantity: 5,
        qualityStatus: 'partial_pass',
        inspectionDate: new Date('2024-01-25'),
        defectReasons: ['外观瑕疵', '尺寸不符']
      },
      {
        id: 'item-002',
        skuCode: 'ELE-002',
        skuName: '电子产品B',
        expectedQuantity: 50,
        receivedQuantity: 50,
        inspectedQuantity: 50,
        passedQuantity: 50,
        rejectedQuantity: 0,
        qualityStatus: 'pass',
        inspectionDate: new Date('2024-01-26'),
        defectReasons: []
      }
    ]
  },
  {
    id: 'qc-002',
    purchaseRequestNumber: 'PR-2024-002',
    items: [
      {
        id: 'item-003',
        skuCode: 'TOY-001',
        skuName: '玩具B',
        expectedQuantity: 200,
        receivedQuantity: 180,
        inspectedQuantity: 0,
        passedQuantity: 0,
        rejectedQuantity: 0,
        qualityStatus: 'pending',
        inspectionDate: null,
        defectReasons: []
      }
    ]
  }
];

export const QualityControl: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredData = qualityControlData.filter(qc =>
    qc.purchaseRequestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qc.items.some(item => 
      item.skuCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.skuName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getQualityStatusColor = (status: string) => {
    const colors = {
      pending: 'yellow',
      pass: 'green',
      fail: 'red',
      partial_pass: 'orange'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getQualityStatusText = (status: string) => {
    const statusMap = {
      pending: '待检',
      pass: '合格',
      fail: '不合格',
      partial_pass: '部分合格'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getQualityStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'partial_pass':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <QrCode className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPassRate = (passed: number, total: number) => {
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">收货验货</h1>
          <p className="text-gray-600">管理货物接收和质量检验</p>
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
            <QrCode className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-gray-600">
              待检: {filteredData.reduce((acc, qc) => 
                acc + qc.items.filter(item => item.qualityStatus === 'pending').length, 0
              )}
            </span>
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有需要检验的货物</h3>
          <p className="text-gray-600">所有货物都已完成质检</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredData.map((qc) => (
            <div key={qc.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {qc.purchaseRequestNumber}
                </h3>
                <div className="text-sm text-gray-600">
                  {qc.items.length} 个项目
                </div>
              </div>

              <div className="space-y-4">
                {qc.items.map((item) => {
                  const passRate = getPassRate(item.passedQuantity, item.inspectedQuantity);
                  
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.skuName}</h4>
                            <p className="text-sm text-gray-600">{item.skuCode}</p>
                          </div>
                          <StatusBadge
                            status={getQualityStatusText(item.qualityStatus)}
                            color={getQualityStatusColor(item.qualityStatus)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          {getQualityStatusIcon(item.qualityStatus)}
                          {item.qualityStatus !== 'pending' && (
                            <span className="text-sm font-medium text-gray-700">
                              合格率: {passRate}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{item.expectedQuantity}</div>
                          <div className="text-sm text-gray-600">预计数量</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{item.receivedQuantity}</div>
                          <div className="text-sm text-gray-600">实收数量</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-yellow-600">{item.inspectedQuantity}</div>
                          <div className="text-sm text-gray-600">已检数量</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{item.passedQuantity}</div>
                          <div className="text-sm text-gray-600">合格数量</div>
                        </div>
                      </div>

                      {item.rejectedQuantity > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-red-800">
                              不合格数量: {item.rejectedQuantity}
                            </span>
                          </div>
                          {item.defectReasons.length > 0 && (
                            <div className="text-sm text-red-700">
                              <span className="font-medium">缺陷原因: </span>
                              {item.defectReasons.join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {item.qualityStatus !== 'pending' && item.inspectionDate && (
                        <div className="text-sm text-gray-600">
                          检验日期: {item.inspectionDate.toLocaleDateString('zh-CN')}
                        </div>
                      )}

                      <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                        {item.qualityStatus === 'pending' ? (
                          <>
                            <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                              开始检验
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                              录入数据
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                              查看详情
                            </button>
                            <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                              修改结果
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};