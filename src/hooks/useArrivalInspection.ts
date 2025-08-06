import { useState, useEffect } from 'react';
import { arrivalInspectionStore } from '../store/arrivalInspection';
import { ArrivalInspection, ArrivalInspectionStatus, InspectionPhoto } from '../types';

export const useArrivalInspection = () => {
  const [arrivalInspections, setArrivalInspections] = useState<ArrivalInspection[]>(
    arrivalInspectionStore.getArrivalInspections()
  );
  const [inspectionStats, setInspectionStats] = useState(
    arrivalInspectionStore.getInspectionStats()
  );

  useEffect(() => {
    const unsubscribe = arrivalInspectionStore.subscribe(() => {
      setArrivalInspections(arrivalInspectionStore.getArrivalInspections());
      setInspectionStats(arrivalInspectionStore.getInspectionStats());
    });
    return unsubscribe;
  }, []);

  return {
    // 状态数据
    arrivalInspections,
    inspectionStats,
    
    // 获取方法
    getArrivalInspections: () => arrivalInspectionStore.getArrivalInspections(),
    getArrivalInspectionsByType: (productType: 'semi_finished' | 'finished', status: ArrivalInspectionStatus) =>
      arrivalInspectionStore.getArrivalInspectionsByType(productType, status),
    getArrivalInspectionById: (id: string) => arrivalInspectionStore.getArrivalInspectionById(id),
    
    // 更新方法
    updateArrivalStatus: (id: string, isArrived: boolean, arrivalDate?: Date) =>
      arrivalInspectionStore.updateArrivalStatus(id, isArrived, arrivalDate),
    batchUpdateArrivalStatus: (requestIds: string[], productType: 'semi_finished' | 'finished', isArrived: boolean) =>
      arrivalInspectionStore.batchUpdateArrivalStatus(requestIds, productType, isArrived),
    updateArrivalInspection: (id: string, updates: Partial<ArrivalInspection>) =>
      arrivalInspectionStore.updateArrivalInspection(id, updates),
    
    // 检验方法
    completeInspection: (
      id: string,
      inspectorId: string,
      arrivalQuantity: number,
      photos: InspectionPhoto[],
      qualityResult: 'passed' | 'failed',
      inspectionNotes?: string
    ) => arrivalInspectionStore.completeInspection(id, inspectorId, arrivalQuantity, photos, qualityResult, inspectionNotes),
    
    // 统计方法
    getInspectionStats: () => arrivalInspectionStore.getInspectionStats(),
    
    // 联动方法
    handleArrivalNotificationBatchComplete: (requestIds: string[], productType: 'semi_finished' | 'finished') =>
      arrivalInspectionStore.handleArrivalNotificationBatchComplete(requestIds, productType)
  };
};