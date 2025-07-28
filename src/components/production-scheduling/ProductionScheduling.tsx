import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Play, 
  Square, 
  CheckSquare,
  Package,
  Settings,
  Save,
  X,
  ArrowRight,
  Undo,
  User,
  Cog,
  ZoomIn
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../ui/StatusBadge';

// 模拟数据类型定义
interface ProductionSKU {
  id: string;
  inspectionDate: Date;
  orderNumber: string;
  sku: {
    code: string;
    name: string;
    imageUrl?: string;
  };
  purchaseQuantity: number;
  productionQuantity?: number;
  material: string;
  packagingMethod: string;
  scheduledDate?: Date;
  productionSteps?: ProductionStep[];
  status: 'pending' | 'pre_scheduled' | 'in_production' | 'completed';
  completedDate?: Date;
}

interface ProductionStep {
  id: string;
  name: string;
  type: 'binding' | 'tray' | 'blister' | 'packing';
  machine?: string;
  operator?: string;
  isCompleted: boolean;
  completedDate?: Date;
}

interface MachineOperatorGroup {
  id: string;
  machine: string;
  operator: string;
}

type TabType = 'pending' | 'pre_scheduled' | 'in_production' | 'completed';

// 模拟数据
const mockProductionSKUs: ProductionSKU[] = [
  {
    id: 'prod-001',
    inspectionDate: new Date('2024-01-26'),
    orderNumber: 'PR-2024-001',
    sku: {
      code: 'ELE-001',
      name: '电子产品A',
      imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'
    },
    purchaseQuantity: 100,
    material: '塑料',
    packagingMethod: '纸盒包装',
    status: 'pending'
  },
  {
    id: 'prod-002',
    inspectionDate: new Date('2024-01-25'),
    orderNumber: 'PR-2024-002',
    sku: {
      code: 'TOY-001',
      name: '玩具B',
      imageUrl: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg'
    },
    purchaseQuantity: 200,
    productionQuantity: 150,
    material: '木材',
    packagingMethod: '气泡膜包装',
    status: 'pre_scheduled',
    scheduledDate: new Date(),
    productionSteps: [
      { id: 'step-1', name: '生产绑卡', type: 'binding', machine: '大机器', operator: '张三', isCompleted: false },
      { id: 'step-2', name: '包中托', type: 'tray', operator: '李四', isCompleted: false },
      { id: 'step-3', name: '吸塑包装', type: 'blister', operator: '王五', isCompleted: false },
      { id: 'step-4', name: '打包外箱', type: 'packing', operator: '赵六', isCompleted: false }
    ]
  },
  {
    id: 'prod-003',
    inspectionDate: new Date('2024-01-24'),
    orderNumber: 'PR-2024-003',
    sku: {
      code: 'KIT-001',
      name: '厨房用品A',
      imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'
    },
    purchaseQuantity: 80,
    productionQuantity: 80,
    material: '不锈钢',
    packagingMethod: '纸盒包装',
    status: 'in_production',
    scheduledDate: new Date('2024-01-27'),
    productionSteps: [
      { id: 'step-5', name: '生产绑卡', type: 'binding', machine: '小机器1', operator: '张三', isCompleted: true, completedDate: new Date() },
      { id: 'step-6', name: '包中托', type: 'tray', operator: '李四', isCompleted: true, completedDate: new Date() },
      { id: 'step-7', name: '吸塑包装', type: 'blister', operator: '王五', isCompleted: false },
      { id: 'step-8', name: '打包外箱', type: 'packing', operator: '赵六', isCompleted: false }
    ]
  }
];

const machineOptions = ['大机器', '小机器1', '小机器2', '绑卡机'];
const operatorOptions = ['张三', '李四', '王五', '赵六', '孙七', '周八'];

export const ProductionScheduling: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [productionSKUs, setProductionSKUs] = useState<ProductionSKU[]>(mockProductionSKUs);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 权限检查
  const isProductionStaff = user?.role === 'production_staff';

  // 根据标签页过滤数据
  const getFilteredData = () => {
    return productionSKUs.filter(item => {
      const matchesTab = item.status === activeTab;
      const matchesSearch = !searchTerm || 
        item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesTab && matchesSearch;
    });
  };

  const filteredData = getFilteredData();

  // 处理全选
  const handleSelectAll = () => {
    if (selectedItems.length === filteredData.length && filteredData.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData.map(item => item.id));
    }
  };

  // 处理单选
  const handleSelectItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // 处理预排单
  const handlePreSchedule = () => {
    if (selectedItems.length === 0) return;
    
    setProductionSKUs(prevSKUs => 
      prevSKUs.map(sku => 
        selectedItems.includes(sku.id)
          ? { 
              ...sku, 
              status: 'pre_scheduled',
              scheduledDate: new Date(),
              productionQuantity: sku.purchaseQuantity,
              productionSteps: [
                { id: `step-${Date.now()}-1`, name: '生产绑卡', type: 'binding', isCompleted: false },
                { id: `step-${Date.now()}-2`, name: '包中托', type: 'tray', isCompleted: false },
                { id: `step-${Date.now()}-3`, name: '吸塑包装', type: 'blister', isCompleted: false },
                { id: `step-${Date.now()}-4`, name: '打包外箱', type: 'packing', isCompleted: false }
              ]
            }
          : sku
      )
    );
    
    setSelectedItems([]);
  };

  // 处理退回待排单
  const handleReturnToPending = (itemId: string) => {
    setProductionSKUs(prevSKUs => 
      prevSKUs.map(sku => 
        sku.id === itemId
          ? { 
              ...sku, 
              status: 'pending',
              scheduledDate: undefined,
              productionQuantity: undefined,
              productionSteps: undefined
            }
          : sku
      )
    );
  };

  // 处理确认生产
  const handleConfirmProduction = () => {
    if (selectedItems.length === 0) return;
    
    setProductionSKUs(prevSKUs => 
      prevSKUs.map(sku => 
        selectedItems.includes(sku.id)
          ? { ...sku, status: 'in_production' }
          : sku
      )
    );
    
    setSelectedItems([]);
  };

  // 处理生产数量修改
  const handleProductionQuantityChange = (itemId: string, quantity: number) => {
    const item = productionSKUs.find(sku => sku.id === itemId);
    if (!item) return;
    
    const validQuantity = Math.max(1, Math.min(quantity, item.purchaseQuantity));
    
    setProductionSKUs(prevSKUs => {
      const newSKUs = [...prevSKUs];
      const index = newSKUs.findIndex(sku => sku.id === itemId);
      
      if (index !== -1) {
        newSKUs[index] = { ...newSKUs[index], productionQuantity: validQuantity };
        
        // 如果生产数量小于采购数量，创建剩余数量的新记录
        if (validQuantity < item.purchaseQuantity) {
          const remainingQuantity = item.purchaseQuantity - validQuantity;
          const remainingItem: ProductionSKU = {
            ...item,
            id: `${item.id}-remaining-${Date.now()}`,
            purchaseQuantity: remainingQuantity,
            productionQuantity: undefined,
            status: 'pending',
            scheduledDate: undefined,
            productionSteps: undefined
          };
          newSKUs.push(remainingItem);
        }
      }
      
      return newSKUs;
    });
  };

  // 处理生产环节完成
  const handleStepComplete = (itemId: string, stepId: string) => {
    setProductionSKUs(prevSKUs => 
      prevSKUs.map(sku => {
        if (sku.id === itemId && sku.productionSteps) {
          const updatedSteps = sku.productionSteps.map(step => 
            step.id === stepId 
              ? { ...step, isCompleted: true, completedDate: new Date() }
              : step
          );
          
          // 检查是否所有环节都完成
          const allCompleted = updatedSteps.every(step => step.isCompleted);
          
          return {
            ...sku,
            productionSteps: updatedSteps,
            status: allCompleted ? 'completed' : 'in_production',
            completedDate: allCompleted ? new Date() : undefined
          };
        }
        return sku;
      })
    );
  };

  // 导出排单表
  const handleExportSchedule = () => {
    const preScheduledItems = productionSKUs.filter(item => item.status === 'pre_scheduled');
    
    const exportData = preScheduledItems.map(item => ({
      '排单日期': item.scheduledDate?.toLocaleDateString('zh-CN') || '',
      '订单编号': item.orderNumber,
      'SKU编码': item.sku.code,
      '品名': item.sku.name,
      '采购数量': item.purchaseQuantity,
      '生产数量': item.productionQuantity || item.purchaseQuantity,
      '材质': item.material,
      '包装方式': item.packagingMethod,
      '生产绑卡机器': item.productionSteps?.find(s => s.type === 'binding')?.machine || '',
      '生产绑卡操作员': item.productionSteps?.find(s => s.type === 'binding')?.operator || '',
      '包中托操作员': item.productionSteps?.find(s => s.type === 'tray')?.operator || '',
      '吸塑包装操作员': item.productionSteps?.find(s => s.type === 'blister')?.operator || '',
      '打包外箱操作员': item.productionSteps?.find(s => s.type === 'packing')?.operator || ''
    }));

    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `生产排单表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 处理图片点击
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 获取统计数据
  const getTabStats = () => {
    const pending = productionSKUs.filter(item => item.status === 'pending').length;
    const preScheduled = productionSKUs.filter(item => item.status === 'pre_scheduled').length;
    const inProduction = productionSKUs.filter(item => item.status === 'in_production').length;
    const completed = productionSKUs.filter(item => item.status === 'completed').length;
    
    return { pending, preScheduled, inProduction, completed };
  };

  const tabStats = getTabStats();

  // 渲染待排单
  const renderPending = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 py-3 px-3 text-left font-medium text-gray-900">
                <button onClick={handleSelectAll} className="flex items-center">
                  {selectedItems.length === filteredData.length && filteredData.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">验收日期</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">SKU</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">品名</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">采购数量</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">材质</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">包装方式</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-3 px-3">
                  <button onClick={() => handleSelectItem(item.id)} className="flex items-center">
                    {selectedItems.includes(item.id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="py-3 px-3 text-sm text-gray-900">
                  {item.inspectionDate.toLocaleDateString('zh-CN')}
                </td>
                <td className="py-3 px-3 text-sm font-medium text-blue-600">{item.orderNumber}</td>
                <td className="py-3 px-3 text-center">
                  {item.sku.imageUrl ? (
                    <div className="relative group inline-block">
                      <img 
                        src={item.sku.imageUrl} 
                        alt={item.sku.name}
                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(item.sku.imageUrl!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                           onClick={() => handleImageClick(item.sku.imageUrl!)}>
                        <ZoomIn className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-sm font-medium text-gray-900">{item.sku.code}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.sku.name}</td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  {item.purchaseQuantity.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.material}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.packagingMethod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染预排单
  const renderPreScheduled = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 py-3 px-3 text-left font-medium text-gray-900">
                <button onClick={handleSelectAll} className="flex items-center">
                  {selectedItems.length === filteredData.length && filteredData.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">排单日期</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">SKU</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">品名</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">采购数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">生产数量</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">材质</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">包装方式</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">生产绑卡</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">包中托</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">吸塑包装</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">打包外箱</th>
              {isProductionStaff && (
                <th className="text-center py-3 px-3 font-medium text-gray-900">操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-3 px-3">
                  <button onClick={() => handleSelectItem(item.id)} className="flex items-center">
                    {selectedItems.includes(item.id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="py-3 px-3 text-sm text-gray-900">
                  {item.scheduledDate?.toLocaleDateString('zh-CN')}
                </td>
                <td className="py-3 px-3 text-sm font-medium text-blue-600">{item.orderNumber}</td>
                <td className="py-3 px-3 text-center">
                  {item.sku.imageUrl ? (
                    <div className="relative group inline-block">
                      <img 
                        src={item.sku.imageUrl} 
                        alt={item.sku.name}
                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(item.sku.imageUrl!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                           onClick={() => handleImageClick(item.sku.imageUrl!)}>
                        <ZoomIn className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-sm font-medium text-gray-900">{item.sku.code}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.sku.name}</td>
                <td className="py-3 px-3 text-center text-sm text-gray-900">
                  {item.purchaseQuantity.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-center">
                  {isProductionStaff ? (
                    <input
                      type="number"
                      min="1"
                      max={item.purchaseQuantity}
                      value={item.productionQuantity || item.purchaseQuantity}
                      onChange={(e) => handleProductionQuantityChange(item.id, parseInt(e.target.value) || 1)}
                      className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <span className="text-sm font-medium text-blue-600">
                      {(item.productionQuantity || item.purchaseQuantity).toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.material}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.packagingMethod}</td>
                
                {/* 生产环节配置 */}
                <td className="py-3 px-3 text-center">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">
                      机器: {item.productionSteps?.find(s => s.type === 'binding')?.machine || '未配置'}
                    </div>
                    <div className="text-xs text-gray-600">
                      操作员: {item.productionSteps?.find(s => s.type === 'binding')?.operator || '未配置'}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-xs text-gray-600">
                  {item.productionSteps?.find(s => s.type === 'tray')?.operator || '未配置'}
                </td>
                <td className="py-3 px-3 text-center text-xs text-gray-600">
                  {item.productionSteps?.find(s => s.type === 'blister')?.operator || '未配置'}
                </td>
                <td className="py-3 px-3 text-center text-xs text-gray-600">
                  {item.productionSteps?.find(s => s.type === 'packing')?.operator || '未配置'}
                </td>
                
                {isProductionStaff && (
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingItem(item.id)}
                        className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                        title="编辑配置"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleReturnToPending(item.id)}
                        className="px-2 py-1 text-xs text-orange-600 border border-orange-600 rounded hover:bg-orange-50 transition-colors"
                        title="退回"
                      >
                        退回
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染生产中
  const renderInProduction = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 py-3 px-3 text-left font-medium text-gray-900">
                <button onClick={handleSelectAll} className="flex items-center">
                  {selectedItems.length === filteredData.length && filteredData.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">排单日期</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">SKU</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">品名</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">生产数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">生产绑卡</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">包中托</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">吸塑包装</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">打包外箱</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-3 px-3">
                  <button onClick={() => handleSelectItem(item.id)} className="flex items-center">
                    {selectedItems.includes(item.id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="py-3 px-3 text-sm text-gray-900">
                  {item.scheduledDate?.toLocaleDateString('zh-CN')}
                </td>
                <td className="py-3 px-3 text-sm font-medium text-blue-600">{item.orderNumber}</td>
                <td className="py-3 px-3 text-center">
                  {item.sku.imageUrl ? (
                    <div className="relative group inline-block">
                      <img 
                        src={item.sku.imageUrl} 
                        alt={item.sku.name}
                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(item.sku.imageUrl!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                           onClick={() => handleImageClick(item.sku.imageUrl!)}>
                        <ZoomIn className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-sm font-medium text-gray-900">{item.sku.code}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.sku.name}</td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  {(item.productionQuantity || item.purchaseQuantity).toLocaleString()}
                </td>
                
                {/* 生产环节进度 */}
                {item.productionSteps?.map((step) => (
                  <td key={step.id} className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <StatusBadge
                        status={step.isCompleted ? '已完成' : '进行中'}
                        color={step.isCompleted ? 'green' : 'yellow'}
                        size="sm"
                      />
                      {step.completedDate && (
                        <div className="text-xs text-gray-500">
                          {step.completedDate.toLocaleDateString('zh-CN')}
                        </div>
                      )}
                      {!step.isCompleted && isProductionStaff && (
                        <button
                          onClick={() => handleStepComplete(item.id, step.id)}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          完成
                        </button>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染已完成
  const renderCompleted = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 py-3 px-3 text-left font-medium text-gray-900">
                <button onClick={handleSelectAll} className="flex items-center">
                  {selectedItems.length === filteredData.length && filteredData.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">完成日期</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">SKU</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">品名</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900">生产数量</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">材质</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900">包装方式</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="py-3 px-3">
                  <button onClick={() => handleSelectItem(item.id)} className="flex items-center">
                    {selectedItems.includes(item.id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </td>
                <td className="py-3 px-3 text-sm text-gray-900">
                  {item.completedDate?.toLocaleDateString('zh-CN')}
                </td>
                <td className="py-3 px-3 text-sm font-medium text-blue-600">{item.orderNumber}</td>
                <td className="py-3 px-3 text-center">
                  {item.sku.imageUrl ? (
                    <div className="relative group inline-block">
                      <img 
                        src={item.sku.imageUrl} 
                        alt={item.sku.name}
                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(item.sku.imageUrl!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                           onClick={() => handleImageClick(item.sku.imageUrl!)}>
                        <ZoomIn className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-sm font-medium text-gray-900">{item.sku.code}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.sku.name}</td>
                <td className="py-3 px-3 text-center text-sm font-medium text-blue-600">
                  {(item.productionQuantity || item.purchaseQuantity).toLocaleString()}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.material}</td>
                <td className="py-3 px-3 text-sm text-gray-900">{item.packagingMethod}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">生产排单</h1>
            <p className="text-gray-600">管理生产排期和进度跟踪</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号或SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">SKU: {filteredData.length}</span>
            </div>
          </div>
        </div>

        {/* 权限提示 */}
        {!isProductionStaff && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">权限提示</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  您当前是{user?.role === 'department_manager' ? '部门主管' : 
                           user?.role === 'general_manager' ? '总经理' : 
                           user?.role === 'purchasing_officer' ? '采购专员' : '其他角色'}，只能查看生产排单数据。只有生产人员可以编辑和操作。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">待排单</h3>
                <p className="text-2xl font-bold text-gray-900">{tabStats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">预排单</h3>
                <p className="text-2xl font-bold text-gray-900">{tabStats.preScheduled}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Play className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">生产中</h3>
                <p className="text-2xl font-bold text-gray-900">{tabStats.inProduction}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">已完成</h3>
                <p className="text-2xl font-bold text-gray-900">{tabStats.completed}</p>
              </div>
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
              <span>待排单</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.pending}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('pre_scheduled')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pre_scheduled'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>预排单</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'pre_scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.preScheduled}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('in_production')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'in_production'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Play className="h-5 w-5" />
              <span>生产中</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'in_production' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.inProduction}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>已完成</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {tabStats.completed}
              </span>
            </button>
          </nav>
        </div>

        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                已选择 <span className="font-medium text-blue-600">{selectedItems.length}</span> 个SKU
              </div>
            </div>
            {isProductionStaff && selectedItems.length > 0 && (
              <div className="flex items-center space-x-3">
                {activeTab === 'pending' && (
                  <button
                    onClick={handlePreSchedule}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span>预排单</span>
                  </button>
                )}
                {activeTab === 'pre_scheduled' && (
                  <>
                    <button
                      onClick={handleExportSchedule}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>导出排单表</span>
                    </button>
                    <button
                      onClick={handleConfirmProduction}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>确认生产</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pending' ? '没有待排单的SKU' : 
               activeTab === 'pre_scheduled' ? '没有预排单的SKU' : 
               activeTab === 'in_production' ? '没有生产中的SKU' : 
               '没有已完成的SKU'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pending' ? '等待从自己包装模块流转SKU' : 
               activeTab === 'pre_scheduled' ? '请从待排单中添加SKU' : 
               activeTab === 'in_production' ? '没有正在生产的SKU' : 
               '还没有完成生产的SKU'}
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && renderPending()}
            {activeTab === 'pre_scheduled' && renderPreScheduled()}
            {activeTab === 'in_production' && renderInProduction()}
            {activeTab === 'completed' && renderCompleted()}
          </>
        )}
      </div>

      {/* 图片放大模态框 */}
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

      {/* 编辑配置模态框 */}
      {editingItem && (
        <ProductionConfigModal
          itemId={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(config) => {
            // 保存配置逻辑
            setEditingItem(null);
          }}
        />
      )}
    </>
  );
};

// 生产配置模态框组件
interface ProductionConfigModalProps {
  itemId: string;
  onClose: () => void;
  onSave: (config: any) => void;
}

const ProductionConfigModal: React.FC<ProductionConfigModalProps> = ({ itemId, onClose, onSave }) => {
  const [bindingGroups, setBindingGroups] = useState<MachineOperatorGroup[]>([
    { id: '1', machine: '', operator: '' }
  ]);
  const [trayOperator, setTrayOperator] = useState('');
  const [blisterOperator, setBlisterOperator] = useState('');
  const [packingOperator, setPackingOperator] = useState('');

  const addBindingGroup = () => {
    setBindingGroups([...bindingGroups, { id: Date.now().toString(), machine: '', operator: '' }]);
  };

  const removeBindingGroup = (id: string) => {
    if (bindingGroups.length > 1) {
      setBindingGroups(bindingGroups.filter(group => group.id !== id));
    }
  };

  const updateBindingGroup = (id: string, field: 'machine' | 'operator', value: string) => {
    setBindingGroups(bindingGroups.map(group => 
      group.id === id ? { ...group, [field]: value } : group
    ));
  };

  const handleSave = () => {
    const config = {
      bindingGroups,
      trayOperator,
      blisterOperator,
      packingOperator
    };
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">生产环节配置</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 生产绑卡配置 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">生产绑卡</h3>
              <button
                onClick={addBindingGroup}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>添加组合</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {bindingGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">机器</label>
                    <select
                      value={group.machine}
                      onChange={(e) => updateBindingGroup(group.id, 'machine', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">请选择机器</option>
                      {machineOptions.map(machine => (
                        <option key={machine} value={machine}>{machine}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">操作员</label>
                    <select
                      value={group.operator}
                      onChange={(e) => updateBindingGroup(group.id, 'operator', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">请选择操作员</option>
                      {operatorOptions.map(operator => (
                        <option key={operator} value={operator}>{operator}</option>
                      ))}
                    </select>
                  </div>
                  {bindingGroups.length > 1 && (
                    <button
                      onClick={() => removeBindingGroup(group.id)}
                      className="p-2 text-red-600 hover:text-red-700 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 其他环节配置 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">包中托操作员</label>
              <select
                value={trayOperator}
                onChange={(e) => setTrayOperator(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择操作员</option>
                {operatorOptions.map(operator => (
                  <option key={operator} value={operator}>{operator}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">吸塑包装操作员</label>
              <select
                value={blisterOperator}
                onChange={(e) => setBlisterOperator(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择操作员</option>
                {operatorOptions.map(operator => (
                  <option key={operator} value={operator}>{operator}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">打包外箱操作员</label>
              <select
                value={packingOperator}
                onChange={(e) => setPackingOperator(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择操作员</option>
                {operatorOptions.map(operator => (
                  <option key={operator} value={operator}>{operator}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>保存配置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};