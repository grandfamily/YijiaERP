
import { useGlobalStore } from '../store/globalStore';
import { ProductionSchedule, ProductionStatus } from '../types';

export const useProduction = () => {
  // 全局store数据
  const productionSchedules = useGlobalStore(s => s.productionSchedules);
  const setProductionSchedules = useGlobalStore(s => s.setProductionSchedules);
  const updateProductionSchedule = useGlobalStore(s => s.updateProductionSchedule);

  // 派生状态
  const pendingSchedules = productionSchedules.filter(s => s.status === 'pending');
  const inProductionSchedules = productionSchedules.filter(s => s.status === 'in_production');
  const completedSchedules = productionSchedules.filter(s => s.status === 'completed');

  // 统计
  const productionStats = {
    pending: pendingSchedules.length,
    inProduction: inProductionSchedules.length,
    completed: completedSchedules.length,
    total: productionSchedules.length,
    pendingQuantity: pendingSchedules.reduce((sum, s) => sum + s.plannedQuantity, 0),
    inProductionQuantity: inProductionSchedules.reduce((sum, s) => sum + s.plannedQuantity, 0),
    completedQuantity: completedSchedules.reduce((sum, s) => sum + (s.completedQuantity || 0), 0),
    totalQuantity:
      pendingSchedules.reduce((sum, s) => sum + s.plannedQuantity, 0) +
      inProductionSchedules.reduce((sum, s) => sum + s.plannedQuantity, 0) +
      completedSchedules.reduce((sum, s) => sum + (s.completedQuantity || 0), 0),
    completionRate:
      productionSchedules.length > 0
        ? (completedSchedules.length / productionSchedules.length) * 100
        : 0
  };

  // 获取方法
  const getProductionSchedules = (status?: ProductionStatus | ProductionStatus[]) => {
    if (!status) return productionSchedules;
    const statusArray = Array.isArray(status) ? status : [status];
    return productionSchedules.filter(s => statusArray.includes(s.status));
  };
  const getProductionScheduleById = (id: string) => productionSchedules.find(s => s.id === id);

  // 创建方法
  const createProductionSchedule = (schedule: Omit<ProductionSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSchedule: ProductionSchedule = {
      ...schedule,
      id: `ps-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setProductionSchedules([...productionSchedules, newSchedule]);
  };
  const bulkCreateProductionSchedules = (schedules: Omit<ProductionSchedule, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const newSchedules: ProductionSchedule[] = schedules.map(s => ({
      ...s,
      id: `ps-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    setProductionSchedules([...productionSchedules, ...newSchedules]);
  };

  // 更新方法
  // updateProductionSchedule 已直接暴露
  const bulkUpdateProductionStatus = (ids: string[], status: ProductionStatus, operatorId?: string) => {
    setProductionSchedules(
      productionSchedules.map(s =>
        ids.includes(s.id)
          ? {
              ...s,
              status,
              operatorId: operatorId || s.operatorId,
              updatedAt: new Date()
            }
          : s
      )
    );
  };

  // 删除方法
  const deleteProductionSchedule = (id: string) => {
    setProductionSchedules(productionSchedules.filter(s => s.id !== id));
  };

  // 辅助方法
  const getAvailableMachines = () => [
    '包装机A',
    '包装机B',
    '包装机C',
    '包装机D',
    '组装线1',
    '组装线2',
    '测试台1',
    '测试台2'
  ];

  // 兼容原API
  const createSchedulesFromInHouseProduction = () => {
    // 这里可根据实际业务实现
    // 示例：根据采购申请生成生产排单
    // 留空或抛错，待后续补全
    throw new Error('Not implemented');
  };

  return {
    productionSchedules,
    pendingSchedules,
    inProductionSchedules,
    completedSchedules,
    productionStats,
    setProductionSchedules,
    updateProductionSchedule,
    getProductionSchedules,
    getProductionScheduleById,
    createProductionSchedule,
    bulkCreateProductionSchedules,
    bulkUpdateProductionStatus,
    deleteProductionSchedule,
    getAvailableMachines,
    createSchedulesFromInHouseProduction,
  };
};