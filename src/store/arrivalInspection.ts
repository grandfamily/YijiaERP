import { 
  ArrivalInspection,
  ArrivalInspectionStatus,
  InspectionPhoto,
  SKU,
  User
} from '../types';
import { authStore } from './auth';
import { procurementStore } from './procurement';

// 模拟到货检验数据
const mockArrivalInspections: ArrivalInspection[] = [
  {
    id: 'ai-001',
    purchaseRequestId: 'pr-001',
    skuId: 'sku-001',
    sku: {
      id: 'sku-001',
      code: 'KIT-001',
      name: '厨房用品A',
      englishName: 'Kitchen Product A',
      category: '厨房用品',
      identificationCode: 'ID001',
      imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'
    },
    purchaseRequestNumber: 'WJ-20250118001',
    purchaseQuantity: 100,
    arrivalQuantity: 95,
    isArrived: true,
    arrivalDate: new Date('2024-01-26'),
    inspectionStatus: 'pending',
    inspectionPhotos: [],
    productType: 'semi_finished',
    procurementProgress: 85,
    cardProgress: 60,
    accessoryProgress: 90,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-26')
  },
  {
    id: 'ai-002',
    purchaseRequestId: 'pr-002',
    skuId: 'sku-002',
    sku: {
      id: 'sku-002',
      code: 'HAR-001',
      name: '五金用品B',
      englishName: 'Hardware Product B',
      category: '五金用品',
      identificationCode: 'ID002',
      imageUrl: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg'
    },
    purchaseRequestNumber: 'CF-20250118002',
    purchaseQuantity: 200,
    arrivalQuantity: 200,
    isArrived: true,
    arrivalDate: new Date('2024-01-25'),
    inspectionStatus: 'completed',
    inspectionDate: new Date('2024-01-26'),
    inspectorId: '10',
    inspector: {
      id: '10',
      name: '刘十二',
      email: 'liu.shier@company.com',
      role: 'qc_officer',
      department: '质检部',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    inspectionPhotos: [],
    inspectionNotes: '质量良好，符合要求',
    qualityResult: 'passed',
    productType: 'finished',
    procurementProgress: 100,
    cardProgress: 100,
    accessoryProgress: 95,
    createdAt: new Date('2024-01-24'),
    updatedAt: new Date('2024-01-26')
  },
  {
    id: 'ai-003',
    purchaseRequestId: 'pr-003',
    skuId: 'sku-003',
    sku: {
      id: 'sku-003',
      code: 'FRA-001',
      name: '相框C',
      englishName: 'Photo Frame C',
      category: '相框',
      identificationCode: 'ID003',
      imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'
    },
    purchaseRequestNumber: 'WJ-20250118003',
    purchaseQuantity: 150,
    isArrived: false,
    inspectionStatus: 'pending',
    inspectionPhotos: [],
    productType: 'semi_finished',
    procurementProgress: 75,
    cardProgress: 40,
    accessoryProgress: 85,
    createdAt: new Date('2024-01-23'),
    updatedAt: new Date('2024-01-23')
  }
];

class ArrivalInspectionStore {
  private arrivalInspections: ArrivalInspection[] = mockArrivalInspections;
  private listeners: Array<() => void> = [];

  constructor() {
    // 立即执行一次数据同步
    this.syncFromProcurementProgress();
    this.initializeAutoFlowListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  // 🎯 自动流转监听器
  private initializeAutoFlowListeners() {
    // 监听采购订单变化，自动同步到货检验数据
    try {
      procurementStore.subscribe(() => {
        this.syncFromProcurementProgress();
      });
    } catch (error) {
      console.error('初始化自动流转监听器失败:', error);
    }
  }

  // 🎯 从采购进度同步数据
  private syncFromProcurementProgress() {
    try {
      // 获取已分配的订单（从订单分配流转而来）
      const { data: inProgressRequests } = procurementStore.getPurchaseRequests(
        { status: ['allocated', 'in_production', 'quality_check', 'ready_to_ship', 'shipped'] },
        { field: 'updatedAt', direction: 'desc' }
      );

      const orderAllocations = procurementStore.getOrderAllocations();

      inProgressRequests.forEach(request => {
        const allocation = orderAllocations.find(a => a.purchaseRequestId === request.id);
        if (!allocation) {
          console.log(`订单 ${request.requestNumber} 没有找到分配信息，跳过`);
          return;
        }

        request.items.forEach(item => {
          // 检查是否已存在检验记录
          const existingInspection = this.arrivalInspections.find(
            ai => ai.purchaseRequestId === request.id && ai.skuId === item.skuId
          );

          if (!existingInspection) {
            console.log(`创建新的到货检验记录: 订单 ${request.requestNumber}, SKU ${item.sku.code}, 类型 ${allocation.type}`);
            // 创建新的检验记录
            const productType = allocation.type === 'external' ? 'finished' : 'semi_finished';
            
            const newInspection: ArrivalInspection = {
              id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              purchaseRequestId: request.id,
              skuId: item.skuId,
              sku: item.sku,
              purchaseRequestNumber: request.requestNumber,
              purchaseQuantity: item.quantity,
              isArrived: false,
              inspectionStatus: 'pending',
              inspectionPhotos: [],
              productType,
              procurementProgress: this.getProcurementProgress(request.id),
              cardProgress: this.getCardProgress(request.id),
              accessoryProgress: this.getAccessoryProgress(request.id),
              createdAt: new Date(),
              updatedAt: new Date()
            };

            this.arrivalInspections.push(newInspection);
          } else {
            // 更新现有记录的进度信息
            const index = this.arrivalInspections.findIndex(ai => ai.id === existingInspection.id);
            if (index !== -1) {
              this.arrivalInspections[index] = {
                ...this.arrivalInspections[index],
                procurementProgress: this.getProcurementProgress(request.id),
                cardProgress: this.getCardProgress(request.id),
                accessoryProgress: this.getAccessoryProgress(request.id),
                updatedAt: new Date()
              };
            }
          }
        });
      });

      console.log(`到货检验数据同步完成，当前记录数: ${this.arrivalInspections.length}`);
      this.notify();
    } catch (error) {
      console.error('同步采购进度数据失败:', error);
    }
  }

  // 获取采购进度百分比
  private getProcurementProgress(requestId: string): number {
    const progress = procurementStore.getProcurementProgressByRequestId(requestId);
    return progress ? progress.overallProgress : 0;
  }

  // 获取纸卡进度百分比
  private getCardProgress(requestId: string): number {
    const cardProgress = procurementStore.getCardProgressByRequestId(requestId);
    if (!cardProgress || cardProgress.length === 0) return 0;
    
    const totalProgress = cardProgress.reduce((sum, cp) => sum + cp.overallProgress, 0);
    return Math.round(totalProgress / cardProgress.length);
  }

  // 获取辅料进度百分比
  private getAccessoryProgress(requestId: string): number {
    const accessoryProgress = procurementStore.getAccessoryProgressByRequestId(requestId);
    if (!accessoryProgress || accessoryProgress.length === 0) return 0;
    
    const totalProgress = accessoryProgress.reduce((sum, ap) => sum + ap.overallProgress, 0);
    return Math.round(totalProgress / accessoryProgress.length);
  }

  // 获取所有到货检验记录
  getArrivalInspections(): ArrivalInspection[] {
    return [...this.arrivalInspections];
  }

  // 根据产品类型和状态获取检验记录
  getArrivalInspectionsByType(
    productType: 'semi_finished' | 'finished',
    status: ArrivalInspectionStatus
  ): ArrivalInspection[] {
    return this.arrivalInspections.filter(
      ai => ai.productType === productType && ai.inspectionStatus === status
    );
  }

  // 获取单个检验记录
  getArrivalInspectionById(id: string): ArrivalInspection | undefined {
    return this.arrivalInspections.find(ai => ai.id === id);
  }

  // 更新到货状态
  updateArrivalStatus(id: string, isArrived: boolean, arrivalDate?: Date): ArrivalInspection | null {
    const index = this.arrivalInspections.findIndex(ai => ai.id === id);
    if (index === -1) return null;

    this.arrivalInspections[index] = {
      ...this.arrivalInspections[index],
      isArrived,
      arrivalDate: isArrived ? (arrivalDate || new Date()) : undefined,
      updatedAt: new Date()
    };

    this.notify();
    return this.arrivalInspections[index];
  }

  // 批量更新到货状态
  batchUpdateArrivalStatus(
    requestIds: string[], 
    productType: 'semi_finished' | 'finished',
    isArrived: boolean
  ): ArrivalInspection[] {
    const updatedInspections: ArrivalInspection[] = [];

    requestIds.forEach(requestId => {
      const inspections = this.arrivalInspections.filter(
        ai => ai.purchaseRequestId === requestId && ai.productType === productType
      );

      inspections.forEach(inspection => {
        const index = this.arrivalInspections.findIndex(ai => ai.id === inspection.id);
        if (index !== -1) {
          this.arrivalInspections[index] = {
            ...this.arrivalInspections[index],
            isArrived,
            arrivalDate: isArrived ? new Date() : undefined,
            updatedAt: new Date()
          };
          updatedInspections.push(this.arrivalInspections[index]);
        }
      });
    });

    if (updatedInspections.length > 0) {
      this.notify();
    }

    return updatedInspections;
  }

  // 更新检验记录
  updateArrivalInspection(id: string, updates: Partial<ArrivalInspection>): ArrivalInspection | null {
    const index = this.arrivalInspections.findIndex(ai => ai.id === id);
    if (index === -1) return null;

    this.arrivalInspections[index] = {
      ...this.arrivalInspections[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notify();
    return this.arrivalInspections[index];
  }

  // 完成检验
  completeInspection(
    id: string, 
    inspectorId: string,
    arrivalQuantity: number,
    photos: InspectionPhoto[],
    qualityResult: 'passed' | 'failed',
    inspectionNotes?: string
  ): ArrivalInspection | null {
    const index = this.arrivalInspections.findIndex(ai => ai.id === id);
    if (index === -1) return null;

    const inspector = authStore.getAllUsers().find(u => u.id === inspectorId);

    this.arrivalInspections[index] = {
      ...this.arrivalInspections[index],
      inspectionStatus: 'completed',
      inspectionDate: new Date(),
      inspectorId,
      inspector,
      arrivalQuantity,
      inspectionPhotos: photos,
      qualityResult,
      inspectionNotes,
      updatedAt: new Date()
    };

    // 🎯 自动流转逻辑
    if (qualityResult === 'passed') {
      this.handleInspectionPassedFlow(this.arrivalInspections[index]);
    }

    this.notify();
    return this.arrivalInspections[index];
  }

  // 🎯 处理验收通过后的自动流转
  private handleInspectionPassedFlow(inspection: ArrivalInspection) {
    try {
      if (inspection.productType === 'semi_finished') {
        // 半成品验收通过 → 自动同步至生产排单的待排单
        console.log(`自动流转：半成品SKU ${inspection.sku.code} 验收通过，已同步至生产排单`);
        // 调用生产排单的创建方法
        this.createProductionScheduleFromInspection(inspection);
      } else if (inspection.productType === 'finished') {
        // 成品验收通过 → 自动同步至统计入库的待验收
        console.log(`自动流转：成品SKU ${inspection.sku.code} 验收通过，已同步至统计入库`);
        // 调用统计入库的创建方法
        this.createQualityControlFromInspection(inspection);
      }
    } catch (error) {
      console.error('自动流转处理失败:', error);
    }
  }

  // 🎯 创建生产排单记录
  private createProductionScheduleFromInspection(inspection: ArrivalInspection) {
    try {
      console.log(`开始创建生产排单：SKU ${inspection.sku.code}`);
      
      // 使用异步导入避免循环依赖
      import('./production').then(({ productionStore }) => {
        const existingSchedules = productionStore.getProductionSchedules().filter(
          s => s.purchaseRequestId === inspection.purchaseRequestId && s.skuId === inspection.skuId
        );

        if (existingSchedules.length === 0) {
          const newSchedule = productionStore.createProductionSchedule({
            skuId: inspection.skuId,
            sku: inspection.sku,
            purchaseRequestId: inspection.purchaseRequestId,
            purchaseRequestNumber: inspection.purchaseRequestNumber,
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            plannedQuantity: inspection.arrivalQuantity || inspection.purchaseQuantity,
            packagingMethod: '标准包装',
            machine: '包装机A',
            status: 'pending'
          });
          
          console.log(`半成品验收通过 -> 生产排单创建成功`);
          console.log(`新排单ID: ${newSchedule.id}, SKU: ${inspection.sku.code}`);
        } else {
          console.log(`SKU ${inspection.sku.code} 已存在生产排单，跳过创建`);
        }
      }).catch(error => {
        console.error('导入生产排单Store失败:', error);
      });
    } catch (error) {
      console.error('创建生产排单失败:', error);
    }
  }

  // 🎯 创建统计入库记录
  private createQualityControlFromInspection(inspection: ArrivalInspection) {
    try {
      console.log(`开始创建统计入库记录：SKU ${inspection.sku.code}`);
      
      // 创建统计入库记录，直接添加到质检模块的数据中
      // 由于质检模块使用独立的模拟数据，我们需要通过全局方式添加
      const qualityControlRecord = {
        id: `qc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purchaseRequestNumber: inspection.purchaseRequestNumber,
        skuId: inspection.skuId,
        sku: inspection.sku,
        expectedQuantity: inspection.purchaseQuantity,
        receivedQuantity: inspection.arrivalQuantity || inspection.purchaseQuantity,
        inspectionStatus: 'pending',
        inspectionDate: null,
        inspectorId: null,
        inspector: null,
        packageCount: 0,
        totalPieces: 0,
        piecesPerUnit: 0,
        boxLength: 0,
        boxWidth: 0,
        boxHeight: 0,
        unitWeight: 0,
        totalQuantity: null,
        boxVolume: null,
        totalVolume: null,
        totalWeight: null,
        remarks: `从到货检验自动流转 - 原验收人员: ${inspection.inspector?.name || '未知'}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 通过全局事件或直接操作质检模块数据
      if (typeof window !== 'undefined') {
        // 在浏览器环境中，通过自定义事件通知质检模块
        const event = new CustomEvent('addQualityControlRecord', {
          detail: qualityControlRecord
        });
        window.dispatchEvent(event);
      }
      
      console.log(`成品验收通过 -> 统计入库创建成功`);
      console.log(`新记录ID: ${qualityControlRecord.id}, SKU: ${inspection.sku.code}`);
      
    } catch (error) {
      console.error('创建统计入库记录失败:', error);
    }
  }

  // 获取统计数据
  getInspectionStats() {
    const semiFinishedPending = this.getArrivalInspectionsByType('semi_finished', 'pending').length;
    const semiFinishedCompleted = this.getArrivalInspectionsByType('semi_finished', 'completed').length;
    const finishedPending = this.getArrivalInspectionsByType('finished', 'pending').length;
    const finishedCompleted = this.getArrivalInspectionsByType('finished', 'completed').length;

    const totalPending = semiFinishedPending + finishedPending;
    const totalCompleted = semiFinishedCompleted + finishedCompleted;
    const total = totalPending + totalCompleted;

    return {
      semiFinishedPending,
      semiFinishedCompleted,
      finishedPending,
      finishedCompleted,
      totalPending,
      totalCompleted,
      total,
      completionRate: total > 0 ? (totalCompleted / total) * 100 : 0
    };
  }

  // 🎯 处理采购进度中"到货通知"节点的批量完成联动
  handleArrivalNotificationBatchComplete(requestIds: string[], productType: 'semi_finished' | 'finished') {
    console.log(`🎯 到货检验联动：收到${productType === 'semi_finished' ? '自己包装' : '厂家包装'}订单的到货通知`);
    
    // 批量更新对应订单的到货状态
    const updatedInspections = this.batchUpdateArrivalStatus(requestIds, productType, true);
    
    console.log(`✅ 已更新 ${updatedInspections.length} 个SKU的到货状态为"已到货"`);
    
    return updatedInspections;
  }

  // 🎯 获取生产排单Store的引用方法
  getProductionStore() {
    try {
      return import("./production").then((module) => module.productionStore);
    } catch (error) {
      console.error('获取生产排单Store失败:', error);
      return null;
    }
  }
}

export const arrivalInspectionStore = new ArrivalInspectionStore();