import { useState, useEffect } from 'react';
import { productionStore } from '../store/production';
import { ProductionSchedule, ProductionStatus } from '../types';

export const useProduction = () => {
  const [productionSchedules, setProductionSchedules] = useState<ProductionSchedule[]>(productionStore.getProductionSchedules());
  const [pendingSchedules, setPendingSchedules] = useState<ProductionSchedule[]>(productionStore.getPendingSchedules());
  const [inProductionSchedules, setInProductionSchedules] = useState<ProductionSchedule[]>(productionStore.getInProductionSchedules());
  const [completedSchedules, setCompletedSchedules] = useState<ProductionSchedule[]>(productionStore.getCompletedSchedules());
  const [productionStats, setProductionStats] = useState(productionStore.getProductionStats());

  useEffect(() => {
    const unsubscribe = productionStore.subscribe(() => {
      setProductionSchedules(productionStore.getProductionSchedules());
      setPendingSchedules(productionStore.getPendingSchedules());
      setInProductionSchedules(productionStore.getInProductionSchedules());
      setCompletedSchedules(productionStore.getCompletedSchedules());
      setProductionStats(productionStore.getProductionStats());
    });
    return unsubscribe;
  }, []);

  return {
    // 状态数据
    productionSchedules,
    pendingSchedules,
    inProductionSchedules,
    completedSchedules,
    productionStats,
    
    // 获取方法
    getProductionSchedules: (status?: ProductionStatus | ProductionStatus[]) => 
      productionStore.getProductionSchedules(status),
    getProductionScheduleById: (id: string) => 
      productionStore.getProductionScheduleById(id),
    
    // 创建方法
    createProductionSchedule: (schedule: Omit<ProductionSchedule, 'id' | 'createdAt' | 'updatedAt'>) => 
      productionStore.createProductionSchedule(schedule),
    bulkCreateProductionSchedules: (schedules: Omit<ProductionSchedule, 'id' | 'createdAt' | 'updatedAt'>[]) => 
      productionStore.bulkCreateProductionSchedules(schedules),
    
    // 更新方法
    updateProductionSchedule: (id: string, updates: Partial<ProductionSchedule>) => 
      productionStore.updateProductionSchedule(id, updates),
    bulkUpdateProductionStatus: (ids: string[], status: ProductionStatus, operatorId?: string) => 
      productionStore.bulkUpdateProductionStatus(ids, status, operatorId),
    
    // 删除方法
    deleteProductionSchedule: (id: string) => 
      productionStore.deleteProductionSchedule(id),
    
    // 辅助方法
    getAvailableMachines: () => 
      productionStore.getAvailableMachines(),
    createSchedulesFromInHouseProduction: (purchaseRequestId: string) => 
      productionStore.createSchedulesFromInHouseProduction(purchaseRequestId),
    getProductionStats: () => 
      productionStore.getProductionStats()
  };
};