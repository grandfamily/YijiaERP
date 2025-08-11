import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Search, Package, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProduction } from '../../hooks/useProduction';
import { useGlobalStore } from '../../store/globalStore';
import { ProductionSchedule } from '../../types';

// 子栏目类型
const TABS = [
  { key: 'pending', label: '待排单' },
  { key: 'draft', label: '预排单' },
  { key: 'in_production', label: '生产中' },
  { key: 'completed', label: '已完成' }
] as const;
type TabType = typeof TABS[number]['key'];

export const ProductionScheduling: React.FC = () => {
  // 统一hook声明区
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const { user } = useAuth();
  const isProductionStaff = user?.role === 'production_staff';
  const {
    pendingSchedules,
    inProductionSchedules,
    completedSchedules,
    productionSchedules,
    updateProductionSchedule,
  } = useProduction();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 成功/错误弹窗状态管理
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    sku?: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    sku: ''
  });

  // 生产环节状态管理
  const [productionStages, setProductionStages] = useState<Record<string, {
    bindCards: 'in_progress' | 'completed';
    midPackage: 'in_progress' | 'completed';
    blister: 'in_progress' | 'completed';
    outerBox: 'in_progress' | 'completed';
  }>>({});

  // 表格数据源
  let data: ProductionSchedule[] = [];
  if (activeTab === 'pending') data = pendingSchedules;
  else if (activeTab === 'draft') data = productionSchedules.filter((s: any) => s.status === 'scheduled');
  else if (activeTab === 'in_production') data = inProductionSchedules;
  else if (activeTab === 'completed') data = completedSchedules;

  // 搜索过滤
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.purchaseRequestNumber?.toLowerCase().includes(searchLower) ||
      item.sku?.code?.toLowerCase().includes(searchLower) ||
      item.sku?.name?.toLowerCase().includes(searchLower)
    );
  });

  // 选中操作
  const handleSelectAll = () => {
    if (selectedIds.length === filteredData.length) setSelectedIds([]);
    else setSelectedIds(filteredData.map(item => item.id));
  };
  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // 预排单批次编辑
  type BatchBindCard = { machine: string; operator: string };
  type DraftEditType = Record<string, {
    scheduledDate?: string;
    productionQuantity?: number;
    batchBindCard?: BatchBindCard[];
    midPackage?: string;
    blister?: string;
    outerBox?: string;
  }>;
  const [draftEdit, setDraftEdit] = useState<DraftEditType>({ 
    batch: { 
      scheduledDate: dayjs().format('YYYY-MM-DD'), 
      batchBindCard: [{ machine: '', operator: '' }], 
      midPackage: '', 
      blister: '', 
      outerBox: '' 
    } 
  });

  // 生产数量变更
  const handleProductionQuantityChange = (id: string, value: number) => {
    setDraftEdit(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        productionQuantity: value
      }
    }));
  };

  // 退回到待排单
  const handleReturnToPending = (id: string) => {
    updateProductionSchedule(id, { status: 'pending' });
    setSelectedIds(ids => ids.filter(i => i !== id));
  };

  // 批量流转到预排单
  const handleToDraft = () => {
    selectedIds.forEach(id => {
      updateProductionSchedule(id, { status: 'scheduled' });
    });
    setSelectedIds([]);
  };

  // 初始化生产环节状态
  const initProductionStage = (itemId: string) => {
    if (!productionStages[itemId]) {
      setProductionStages(prev => ({
        ...prev,
        [itemId]: {
          bindCards: 'in_progress',
          midPackage: 'in_progress',
          blister: 'in_progress',
          outerBox: 'in_progress'
        }
      }));
    }
  };

  // 完成生产环节
  const handleCompleteStage = (itemId: string, stage: 'bindCards' | 'midPackage' | 'blister' | 'outerBox') => {
    if (!isProductionStaff) {
      setModal({
        isOpen: true,
        type: 'error',
        title: '权限不足',
        message: '只有生产人员可以完成生产环节'
      });
      return;
    }
    
    // 更新环节状态
    const newStages = {
      ...productionStages,
      [itemId]: {
        ...productionStages[itemId],
        [stage]: 'completed' as const
      }
    };
    
    setProductionStages(newStages);
    
    // 检查是否所有环节都已完成
    const itemStages = newStages[itemId];
    const allCompleted = itemStages && 
      itemStages.bindCards === 'completed' &&
      itemStages.midPackage === 'completed' &&
      itemStages.blister === 'completed' &&
      itemStages.outerBox === 'completed';
    
    if (allCompleted) {
      // 自动流转到已完成标签页
      handleAutoCompleteProduction(itemId);
    }
  };

  // 自动完成生产流转
  const handleAutoCompleteProduction = (itemId: string) => {
    try {
      const item = inProductionSchedules.find((i: any) => i.id === itemId);
      if (!item) {
        console.error('未找到对应的生产中SKU数据');
        return;
      }
      
      // 更新生产排单状态为已完成
      updateProductionSchedule(itemId, { 
        status: 'completed',
        completedDate: new Date(),
        updatedAt: new Date()
      });

      // 自动创建入库登记记录
      const inboundRecord = {
        id: `inbound-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purchaseRequestNumber: item.purchaseRequestNumber || '',
        skuId: item.skuId,
        sku: item.sku,
        identifier: item.sku?.code || '',
        productName: item.sku?.name || '',
        image: item.sku?.imageUrl || undefined,
        expectedQuantity: item.plannedQuantity,
        receivedQuantity: item.plannedQuantity,
        packageCount: 0,
        totalPieces: 0,
        piecesPerUnit: 0,
        boxLength: 0,
        boxWidth: 0,
        boxHeight: 0,
        unitWeight: 0,
        totalQuantity: 0,
        boxVolume: 0,
        totalVolume: 0,
        totalWeight: 0,
        status: 'pending' as const,
        registerDate: null,
        registerUserId: null,
        registerUser: null,
        remarks: `来源：生产排单自动完成 - 生产人员: ${user?.name || '未知'}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 使用全局store添加入库登记记录
      useGlobalStore.getState().addInboundRegister(inboundRecord);
      
      console.log(`已创建入库登记记录: SKU ${item.sku?.code}, ID: ${inboundRecord.id}`);
      console.log(`注意：质检记录将在入库登记完成后自动创建`);

      // 清理该项目的环节状态
      setProductionStages(prev => {
        const newStages = { ...prev };
        delete newStages[itemId];
        return newStages;
      });

      setModal({
        isOpen: true,
        type: 'success',
        title: '🎉 生产完成！',
        message: '已自动流转到"已完成"列表和"入库登记"的"待入库"页面',
        sku: item.sku?.code
      });
    } catch (error) {
      console.error('自动完成生产失败:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: '操作失败',
        message: '生产完成流转失败，请重试'
      });
    }
  };

  // 完成生产阶段 - 自动流转到入库登记
  const handleFinishStage = (id: string) => {
    if (!isProductionStaff) {
      setModal({
        isOpen: true,
        type: 'error',
        title: '权限不足',
        message: '只有生产人员可以完成生产阶段'
      });
      return;
    }
    try {
      const item = completedSchedules.find((i: any) => i.id === id);
      if (!item) {
        setModal({
          isOpen: true,
          type: 'error',
          title: '数据错误',
          message: '未找到对应的生产排单数据'
        });
        return;
      }
      
      // 更新生产排单状态为已完成
      updateProductionSchedule(id, { 
        status: 'completed',
        updatedAt: new Date()
      });

      // 自动创建入库登记记录
      const inboundRecord = {
        id: `inbound-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purchaseRequestNumber: item.purchaseRequestNumber || '',
        skuId: item.skuId,
        sku: item.sku,
        identifier: item.sku?.code || '',
        productName: item.sku?.name || '',
        image: item.sku?.imageUrl || undefined,
        expectedQuantity: item.plannedQuantity,
        receivedQuantity: item.plannedQuantity,
        packageCount: 0,
        totalPieces: 0,
        piecesPerUnit: 0,
        boxLength: 0,
        boxWidth: 0,
        boxHeight: 0,
        unitWeight: 0,
        totalQuantity: 0,
        boxVolume: 0,
        totalVolume: 0,
        totalWeight: 0,
        status: 'pending' as const,
        registerDate: null,
        registerUserId: null,
        registerUser: null,
        remarks: `来源：生产排单已完成 - 生产人员: ${user?.name || '未知'}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 使用全局store添加入库登记记录
      useGlobalStore.getState().addInboundRegister(inboundRecord);
      
      console.log(`已创建入库登记记录: SKU ${item.sku?.code}, ID: ${inboundRecord.id}`);
      console.log(`注意：质检记录将在入库登记完成后自动创建`);

      setModal({
        isOpen: true,
        type: 'success',
        title: '生产完成！',
        message: '已自动流转到入库登记的"待入库"列表',
        sku: item.sku?.code
      });
    } catch (error) {
      console.error('完成生产阶段失败:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: '操作失败',
        message: '操作失败，请重试'
      });
    }
  };

  // 渲染表格头部
  const renderTableHeader = () => {
    const thClass = "px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider";
    
    if (activeTab === 'pending') {
      return (
        <tr>
          <th className={`w-14 text-left pl-4 ${thClass}`}>
            <input 
              type="checkbox" 
              className="w-5 h-5" 
              checked={selectedIds.length === filteredData.length && filteredData.length > 0} 
              onChange={handleSelectAll} 
            />
          </th>
          <th className={`text-left ${thClass}`}>订单编号</th>
          <th className={`text-left ${thClass}`}>图片</th>
          <th className={`text-left ${thClass}`}>SKU</th>
          <th className={`text-left ${thClass}`}>品名</th>
          <th className={`text-left ${thClass}`}>采购数量</th>
          <th className={`text-left ${thClass}`}>生产数量</th>
          <th className={`text-left ${thClass}`}>材质</th>
          <th className={`text-left ${thClass}`}>包装方式</th>
          <th className={`text-left ${thClass}`}>操作</th>
        </tr>
      );
    }
    if (activeTab === 'draft') {
      return (
        <tr>
          <th className={`w-14 text-left pl-4 ${thClass}`}>
            <input 
              type="checkbox" 
              className="w-5 h-5" 
              checked={selectedIds.length === filteredData.length && filteredData.length > 0} 
              onChange={handleSelectAll} 
            />
          </th>
          <th className={`text-left ${thClass}`}>排单日期</th>
          <th className={`text-left ${thClass}`}>订单编号</th>
          <th className={`text-left ${thClass}`}>图片</th>
          <th className={`text-left ${thClass}`}>SKU</th>
          <th className={`text-left ${thClass}`}>品名</th>
          <th className={`text-left ${thClass}`}>采购数量</th>
          <th className={`text-left ${thClass}`}>生产数量</th>
          <th className={`text-left ${thClass}`}>材质</th>
          <th className={`text-left ${thClass}`}>包装方式</th>
          <th className={`text-left ${thClass}`}>操作</th>
        </tr>
      );
    }
    if (activeTab === 'in_production') {
      return (
        <tr>
          <th className={`w-14 text-left pl-4 ${thClass}`}>
            <input 
              type="checkbox" 
              className="w-5 h-5" 
              checked={selectedIds.length === filteredData.length && filteredData.length > 0} 
              onChange={handleSelectAll} 
            />
          </th>
          <th className={`text-left ${thClass}`}>排单日期</th>
          <th className={`text-left ${thClass}`}>订单编号</th>
          <th className={`text-left ${thClass}`}>图片</th>
          <th className={`text-left ${thClass}`}>SKU</th>
          <th className={`text-left ${thClass}`}>品名</th>
          <th className={`text-left ${thClass}`}>生产数量</th>
          <th className={`text-center ${thClass}`}>生产绑卡</th>
          <th className={`text-center ${thClass}`}>包中托</th>
          <th className={`text-center ${thClass}`}>吸塑包装</th>
          <th className={`text-center ${thClass}`}>打包外箱</th>
        </tr>
      );
    }
    if (activeTab === 'completed') {
      return (
        <tr>
          <th className={`w-14 text-left pl-4 ${thClass}`}>
            <input 
              type="checkbox" 
              className="w-5 h-5" 
              checked={selectedIds.length === filteredData.length && filteredData.length > 0} 
              onChange={handleSelectAll} 
            />
          </th>
          <th className={`text-left ${thClass}`}>完成日期</th>
          <th className={`text-left ${thClass}`}>订单编号</th>
          <th className={`text-left ${thClass}`}>图片</th>
          <th className={`text-left ${thClass}`}>SKU</th>
          <th className={`text-left ${thClass}`}>品名</th>
          <th className={`text-left ${thClass}`}>生产数量</th>
          <th className={`text-left ${thClass}`}>材质</th>
          <th className={`text-left ${thClass}`}>包装方式</th>
          <th className={`text-left ${thClass}`}>状态</th>
        </tr>
      );
    }
    return null;
  };

  // 渲染表格行
  const renderTableRows = () => {
    return filteredData.map(item => {
      // 为生产中的项目初始化状态
      if (activeTab === 'in_production') {
        initProductionStage(item.id);
      }
      
      return (
        <tr key={item.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <input 
              type="checkbox" 
              className="w-5 h-5" 
              checked={selectedIds.includes(item.id)} 
              onChange={() => handleSelect(item.id)} 
              disabled={!isProductionStaff} 
            />
          </td>
          {(activeTab === 'draft' || activeTab === 'in_production') && (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.scheduledDate ? dayjs(item.scheduledDate).format('YYYY-MM-DD') : '-'}
            </td>
          )}
          {activeTab === 'completed' && (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {(item as any).completedDate 
                ? dayjs((item as any).completedDate).format('YYYY-MM-DD') 
                : (item.updatedAt ? dayjs(item.updatedAt).format('YYYY-MM-DD') : '-')
              }
            </td>
          )}
          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
            {item.purchaseRequestNumber}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {item.sku?.imageUrl ? (
              <img 
                src={item.sku.imageUrl} 
                alt={item.sku?.name}
                className="h-10 w-10 rounded object-cover cursor-pointer"
                onClick={() => setZoomedImage(item.sku.imageUrl!)}
              />
            ) : (
              <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {item.sku?.code}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {item.sku?.name}
          </td>
          {activeTab !== 'in_production' && (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.plannedQuantity}
            </td>
          )}
          {(activeTab === 'pending' || activeTab === 'draft') && (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {activeTab === 'draft' ? (
                <input
                  type="number"
                  value={draftEdit[item.id]?.productionQuantity || item.plannedQuantity}
                  onChange={(e) => handleProductionQuantityChange(item.id, parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  disabled={!isProductionStaff}
                />
              ) : (
                item.plannedQuantity
              )}
            </td>
          )}
          {activeTab === 'in_production' && (
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {(item as any).productionQuantity || item.plannedQuantity}
            </td>
          )}
          {(activeTab === 'pending' || activeTab === 'draft' || activeTab === 'completed') && (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.material || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.packagingMethod || '-'}
              </td>
            </>
          )}
          {activeTab === 'in_production' && (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-sm text-gray-900">
                    {(item as any).bindCards || '生产绑卡'}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    productionStages[item.id]?.bindCards === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {productionStages[item.id]?.bindCards === 'completed' ? '已完成' : '进行中'}
                  </div>
                  {productionStages[item.id]?.bindCards !== 'completed' && isProductionStaff && (
                    <button
                      onClick={() => handleCompleteStage(item.id, 'bindCards')}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      完成
                    </button>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-sm text-gray-900">
                    {(item as any).midPackage || '包中托'}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    productionStages[item.id]?.midPackage === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {productionStages[item.id]?.midPackage === 'completed' ? '已完成' : '进行中'}
                  </div>
                  {productionStages[item.id]?.midPackage !== 'completed' && isProductionStaff && (
                    <button
                      onClick={() => handleCompleteStage(item.id, 'midPackage')}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      完成
                    </button>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-sm text-gray-900">
                    {(item as any).blister || '吸塑包装'}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    productionStages[item.id]?.blister === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {productionStages[item.id]?.blister === 'completed' ? '已完成' : '进行中'}
                  </div>
                  {productionStages[item.id]?.blister !== 'completed' && isProductionStaff && (
                    <button
                      onClick={() => handleCompleteStage(item.id, 'blister')}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      完成
                    </button>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-sm text-gray-900">
                    {(item as any).outerBox || '打包外箱'}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    productionStages[item.id]?.outerBox === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {productionStages[item.id]?.outerBox === 'completed' ? '已完成' : '进行中'}
                  </div>
                  {productionStages[item.id]?.outerBox !== 'completed' && isProductionStaff && (
                    <button
                      onClick={() => handleCompleteStage(item.id, 'outerBox')}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      完成
                    </button>
                  )}
                </div>
              </td>
            </>
          )}
          {(activeTab === 'pending' || activeTab === 'draft' || activeTab === 'completed') && (
            <td className="px-6 py-4 whitespace-nowrap">
              {activeTab === 'pending' && (
                <span className="text-sm text-gray-500">等待排单</span>
              )}
              {activeTab === 'draft' && isProductionStaff && (
                <button
                  onClick={() => handleReturnToPending(item.id)}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  退回
                </button>
              )}
              {activeTab === 'completed' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  已完成
                </span>
              )}
            </td>
          )}
        </tr>
      );
    });
  };

  // 主体渲染
  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">生产排单</h1>
          <p className="text-gray-600">管理生产排期和进度跟踪</p>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {TABS.map(tab => {
            let count = 0;
            if (tab.key === 'pending') count = pendingSchedules.length;
            else if (tab.key === 'draft') count = productionSchedules.filter((s: any) => s.status === 'scheduled').length;
            else if (tab.key === 'in_production') count = inProductionSchedules.length;
            else if (tab.key === 'completed') count = completedSchedules.length;
            
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedIds([]); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </nav>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单编号、SKU代码或品名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 操作区 */}
      {activeTab === 'pending' && isProductionStaff && (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">已选择 {selectedIds.length} 个SKU</span>
          <button 
            onClick={handleToDraft} 
            disabled={selectedIds.length === 0} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            预排单
          </button>
        </div>
      )}

      {activeTab === 'draft' && isProductionStaff && (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">已选择 {selectedIds.length} 个SKU</span>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={selectedIds.length === 0}
            onClick={() => {
              selectedIds.forEach(id => {
                updateProductionSchedule(id, { status: 'in_production' });
              });
              setSelectedIds([]);
            }}
          >
            确认生产
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={() => {
              const batch = draftEdit['batch'] || {};
              const skuRows = filteredData.filter(item => selectedIds.includes(item.id)).map(item => [
                batch.scheduledDate || '',
                item.purchaseRequestNumber,
                item.sku?.code,
                item.sku?.name,
                item.plannedQuantity,
                draftEdit[item.id]?.productionQuantity || item.plannedQuantity,
                item.material,
                item.packagingMethod
              ]);
              const skuHeader = ['排单日期','订单编号','SKU编码','品名','采购数量','生产数量','材质','包装方式'];
              const bindMachines = (batch.batchBindCard || [{machine:'',operator:''}]).map((g: BatchBindCard) => g.machine).join('|');
              const bindOperators = (batch.batchBindCard || [{machine:'',operator:''}]).map((g: BatchBindCard) => g.operator).join('|');
              const configHeader = ['生产绑卡机器','生产绑卡操作员','包中托操作员','吸塑包装操作员','打包外箱操作员'];
              const configRow = [bindMachines, bindOperators, batch.midPackage || '', batch.blister || '', batch.outerBox || ''];
              const csvArr = [skuHeader, ...skuRows, [], configHeader, configRow];
              const csv = csvArr.map(r => r.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = '排单表.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={selectedIds.length === 0}
          >
            导出排单表
          </button>
        </div>
      )}

      {/* 数据表格 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {TABS.find(t => t.key === activeTab)?.label}列表
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {renderTableHeader()}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>

      {/* 批次生产配置区 - 仅在预排单标签页显示 */}
      {activeTab === 'draft' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-medium mb-4">批次生产配置</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排单日期</label>
              <input
                type="date"
                value={draftEdit['batch']?.scheduledDate || dayjs().format('YYYY-MM-DD')}
                onChange={(e) => setDraftEdit(prev => ({
                  ...prev,
                  batch: { ...prev.batch, scheduledDate: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">生产绑卡</label>
              {Array.isArray(draftEdit['batch']?.batchBindCard) && draftEdit['batch'].batchBindCard.length > 0 ?
                draftEdit['batch'].batchBindCard.map((group: BatchBindCard, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2 mb-2">
                    <select 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      value={group.machine} 
                      onChange={e => {
                        const val = e.target.value;
                        setDraftEdit(prev => ({
                          ...prev,
                          batch: {
                            ...prev.batch,
                            batchBindCard: (prev.batch?.batchBindCard ?? []).map((g: BatchBindCard, i: number) => 
                              i === idx ? { ...g, machine: val } : g
                            )
                          }
                        }));
                      }}
                    >
                      <option value="">选择机器</option>
                      <option>大机器</option>
                      <option>小机器1</option>
                      <option>小机器2</option>
                      <option>绑卡机</option>
                    </select>
                    <input 
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="操作员" 
                      value={group.operator} 
                      onChange={e => {
                        const val = e.target.value;
                        setDraftEdit(prev => ({
                          ...prev,
                          batch: {
                            ...prev.batch,
                            batchBindCard: (prev.batch?.batchBindCard ?? []).map((g: BatchBindCard, i: number) => 
                              i === idx ? { ...g, operator: val } : g
                            )
                          }
                        }));
                      }} 
                    />
                    <button
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      onClick={() => {
                        setDraftEdit(prev => ({
                          ...prev,
                          batch: {
                            ...prev.batch,
                            batchBindCard: (prev.batch?.batchBindCard ?? []).filter((_: BatchBindCard, i: number) => i !== idx)
                          }
                        }));
                      }}
                      disabled={(draftEdit['batch'].batchBindCard?.length ?? 0) === 1}
                    >
                      删除
                    </button>
                  </div>
                ))
                : null}
              <button
                className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                onClick={() => {
                  setDraftEdit(prev => {
                    const current = prev.batch?.batchBindCard;
                    return {
                      ...prev,
                      batch: {
                        ...prev.batch,
                        batchBindCard: Array.isArray(current) && current.length > 0
                          ? [...current, { machine: '', operator: '' }]
                          : [{ machine: '', operator: '' }]
                      }
                    };
                  });
                }}
              >
                添加绑卡
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">包中托操作员</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="操作员" 
                value={draftEdit['batch']?.midPackage || ''} 
                onChange={e => setDraftEdit(prev => ({ 
                  ...prev, 
                  batch: { ...prev.batch, midPackage: e.target.value } 
                }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">吸塑包装操作员</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="操作员" 
                value={draftEdit['batch']?.blister || ''} 
                onChange={e => setDraftEdit(prev => ({ 
                  ...prev, 
                  batch: { ...prev.batch, blister: e.target.value } 
                }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">打包外箱操作员</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="操作员" 
                value={draftEdit['batch']?.outerBox || ''} 
                onChange={e => setDraftEdit(prev => ({ 
                  ...prev, 
                  batch: { ...prev.batch, outerBox: e.target.value } 
                }))} 
              />
            </div>
          </div>
        </div>
      )}

      {/* 图片放大模态框 */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-3xl max-h-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">商品图片</h3>
              <button
                onClick={() => setZoomedImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <img 
              src={zoomedImage} 
              alt="商品图片"
              className="max-w-full max-h-96 object-contain"
            />
          </div>
        </div>
      )}

      {/* 成功/错误弹窗 */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                {modal.type === 'success' ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{modal.title}</h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                {modal.sku && (
                  <>
                    SKU <span className="font-medium text-gray-900">{modal.sku}</span> 
                  </>
                )}
                {modal.message}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setModal({ isOpen: false, type: 'success', title: '', message: '', sku: '' })}
                className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                  modal.type === 'success' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionScheduling;