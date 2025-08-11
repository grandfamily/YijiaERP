import { useGlobalStore } from '../store/globalStore';
import { ArrivalInspectionStatus, InspectionPhoto } from '../types';

export const useArrivalInspection = () => {
  // 全局store数据
  const arrivalInspections = useGlobalStore((state) => state.arrivalInspections);
  // const setArrivalInspections = useGlobalStore((state) => state.setArrivalInspections);
  const updateArrivalInspection = useGlobalStore((state) => state.updateArrivalInspection);

  // 获取方法
  const getArrivalInspections = () => arrivalInspections;
  const getArrivalInspectionsByType = (productType: 'semi_finished' | 'finished', status: ArrivalInspectionStatus) =>
    arrivalInspections.filter(ai => ai.productType === productType && ai.inspectionStatus === status);
  const getArrivalInspectionById = (id: string) => arrivalInspections.find(ai => ai.id === id);

  // 更新方法
  const updateArrivalStatus = (id: string, isArrived: boolean, arrivalDate?: Date) => {
    updateArrivalInspection(id, { isArrived, arrivalDate });
  };
  const batchUpdateArrivalStatus = (requestIds: string[], productType: 'semi_finished' | 'finished', isArrived: boolean) => {
    arrivalInspections.forEach(ai => {
      if (requestIds.includes(ai.purchaseRequestId) && ai.productType === productType) {
        updateArrivalInspection(ai.id, { isArrived });
      }
    });
  };

  // 检验方法
  const completeInspection = (
    id: string,
    inspectorId: string,
    arrivalQuantity: number,
    photos: InspectionPhoto[],
    qualityResult: 'passed' | 'failed',
    inspectionNotes?: string
  ) => {
    // 🎯 根据验收结果决定状态
    const inspectionStatus = qualityResult === 'passed' ? 'completed' : 'rejected';
    
    updateArrivalInspection(id, {
      inspectionStatus: inspectionStatus as ArrivalInspectionStatus,
      inspectorId,
      arrivalQuantity,
      inspectionPhotos: photos,
      inspectionDate: new Date(),
      inspectionNotes,
      qualityResult
    });
    // 这里可扩展流转逻辑
  };

  // 统计方法
  const getInspectionStats = () => {
    const total = arrivalInspections.length;
    const completed = arrivalInspections.filter(ai => ai.inspectionStatus === 'completed').length;
    const pending = arrivalInspections.filter(ai => ai.inspectionStatus === 'pending').length;
    const rejected = arrivalInspections.filter(ai => ai.inspectionStatus === 'rejected').length;
    
    // 按产品类型和状态细分统计
    const semiFinishedPending = arrivalInspections.filter(ai => 
      ai.productType === 'semi_finished' && ai.inspectionStatus === 'pending'
    ).length;
    
    const semiFinishedCompleted = arrivalInspections.filter(ai => 
      ai.productType === 'semi_finished' && ai.inspectionStatus === 'completed'
    ).length;
    
    const finishedPending = arrivalInspections.filter(ai => 
      ai.productType === 'finished' && ai.inspectionStatus === 'pending'
    ).length;
    
    const finishedCompleted = arrivalInspections.filter(ai => 
      ai.productType === 'finished' && ai.inspectionStatus === 'completed'
    ).length;
    
    return { 
      total, 
      completed, 
      pending,
      rejected,
      semiFinishedPending,
      semiFinishedCompleted,
      finishedPending,
      finishedCompleted
    };
  };

  // 联动方法
  const handleArrivalNotificationBatchComplete = (requestIds: string[], productType: 'semi_finished' | 'finished') => {
    batchUpdateArrivalStatus(requestIds, productType, true);
  };

  return {
    arrivalInspections,
    getArrivalInspections,
    getArrivalInspectionsByType,
    getArrivalInspectionById,
    updateArrivalStatus,
    batchUpdateArrivalStatus,
    updateArrivalInspection,
    completeInspection,
    getInspectionStats,
    handleArrivalNotificationBatchComplete
  };
};