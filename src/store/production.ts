import { 
  ProductionSchedule,
  ProductionStatus,
  SKU,
  User
} from '../types';
import { authStore } from './auth';
import { procurementStore } from './procurement';

// 模拟生产排单数据
const mockProductionSchedules: ProductionSchedule[] = [
  {
    id: 'ps-001',
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
    purchaseRequestId: 'pr-001',
    scheduledDate: new Date('2024-08-01'),
    plannedQuantity: 100,
    packagingMethod: '纸盒包装',
    machine: '包装机A',
    status: 'pending',
    createdAt: new Date('2024-07-20'),
    updatedAt: new Date('2024-07-20')
  },
  {
    id: 'ps-002',
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
    purchaseRequestId: 'pr-001',
    scheduledDate: new Date('2024-08-02'),
    plannedQuantity: 50,
    packagingMethod: '塑料包装',
    machine: '包装机B',
    status: 'scheduled',
    startDate: new Date('2024-08-02'),
    operatorId: '4',
    operator: {
      id: '4',
      name: '赵六',
      email: 'zhao.liu@company.com',
      role: 'production_staff',
      department: '生产部',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    remarks: '优先生产',
    createdAt: new Date('2024-07-21'),
    updatedAt: new Date('2024-07-25')
  },
  {
    id: 'ps-003',
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
    purchaseRequestId: 'pr-002',
    scheduledDate: new Date('2024-07-25'),
    plannedQuantity: 200,
    packagingMethod: '气泡膜包装',
    machine: '包装机C',
    status: 'in_production',
    startDate: new Date('2024-07-25'),
    completedQuantity: 120,
    operatorId: '4',
    operator: {
      id: '4',
      name: '赵六',
      email: 'zhao.liu@company.com',
      role: 'production_staff',
      department: '生产部',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    createdAt: new Date('2024-07-22'),
    updatedAt: new Date('2024-07-25')
  },
  {
    id: 'ps-004',
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
    purchaseRequestId: 'pr-003',
    scheduledDate: new Date('2024-07-15'),
    plannedQuantity: 150,
    packagingMethod: '纸盒包装',
    machine: '包装机A',
    status: 'completed',
    startDate: new Date('2024-07-15'),
    endDate: new Date('2024-07-18'),
    completedQuantity: 150,
    operatorId: '4',
    operator: {
      id: '4',
      name: '赵六',
      email: 'zhao.liu@company.com',
      role: 'production_staff',
      department: '生产部',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    remarks: '按时完成',
    createdAt: new Date('2024-07-10'),
    updatedAt: new Date('2024-07-18')
  }
];

// 可用的机器列表
const availableMachines = [
  '包装机A',
  '包装机B',
  '包装机C',
  '包装机D',
  '组装线1',
  '组装线2',
  '测试台1',
  '测试台2'
];

class ProductionStore {
  private productionSchedules: ProductionSchedule[] = mockProductionSchedules;
  private listeners: Array<() => void> = [];

  constructor() {
    this.initializeListeners();
    this.initializeAutoFlowListeners();
    this.initializeArrivalInspectionFlowListeners();
  }

  private initializeListeners() {
    // 在实际应用中，这里会监听采购进度的变化
    // 目前使用模拟数据，所以不需要实际实现
  }

  // 🎯 新增：监听从到货检验流转过来的生产排单
  private initializeArrivalInspectionFlowListeners() {
    if (typeof window !== 'undefined') {
      const handleProductionScheduleCreated = (event: CustomEvent) => {
        const { schedule, source } = event.detail;
        
        if (source === 'arrival_inspection') {
          console.log(`📋 生产排单：接收到从到货检验流转的排单记录 SKU ${schedule.sku.code}`);
          
          // 检查是否已存在相同的记录
          const exists = this.productionSchedules.some(s => 
            s.purchaseRequestId === schedule.purchaseRequestId && 
            s.skuId === schedule.skuId
          );
          
          if (!exists) {
            this.productionSchedules.push(schedule);
            this.notify();
            console.log(`✅ 生产排单：新增待排单记录 SKU ${schedule.sku.code}`);
          } else {
            console.log(`⚠️ 生产排单：记录已存在，跳过添加 SKU ${schedule.sku.code}`);
          }
        }
      };
      
      window.addEventListener('productionScheduleCreated', handleProductionScheduleCreated as EventListener);
    }
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

  // 获取所有生产排单
  getProductionSchedules(status?: ProductionStatus | ProductionStatus[]): ProductionSchedule[] {
    if (!status) {
      return [...this.productionSchedules];
    }

    const statusArray = Array.isArray(status) ? status : [status];
    return this.productionSchedules.filter(schedule => statusArray.includes(schedule.status));
  }

  // 获取待排单的SKU
  getPendingSchedules(): ProductionSchedule[] {
    return this.productionSchedules.filter(schedule => schedule.status === 'pending');
  }

  // 获取生产中的SKU
  getInProductionSchedules(): ProductionSchedule[] {
    return this.productionSchedules.filter(schedule => schedule.status === 'in_production' || schedule.status === 'scheduled');
  }

  // 获取已完成的SKU
  getCompletedSchedules(): ProductionSchedule[] {
    return this.productionSchedules.filter(schedule => schedule.status === 'completed');
  }

  // 获取单个生产排单
  getProductionScheduleById(id: string): ProductionSchedule | undefined {
    return this.productionSchedules.find(schedule => schedule.id === id);
  }

  // 创建生产排单
  createProductionSchedule(schedule: Omit<ProductionSchedule, 'id' | 'createdAt' | 'updatedAt'>): ProductionSchedule {
    const newSchedule: ProductionSchedule = {
      ...schedule,
      id: `ps-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.productionSchedules.push(newSchedule);
    this.notify();
    return newSchedule;
  }

  // 批量创建生产排单
  bulkCreateProductionSchedules(schedules: Omit<ProductionSchedule, 'id' | 'createdAt' | 'updatedAt'>[]): ProductionSchedule[] {
    const newSchedules = schedules.map(schedule => ({
      ...schedule,
      id: `ps-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    this.productionSchedules.push(...newSchedules);
    this.notify();
    return newSchedules;
  }

  // 更新生产排单
  updateProductionSchedule(id: string, updates: Partial<ProductionSchedule>): ProductionSchedule | null {
    const index = this.productionSchedules.findIndex(schedule => schedule.id === id);
    if (index === -1) return null;

    this.productionSchedules[index] = {
      ...this.productionSchedules[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notify();
    return this.productionSchedules[index];
  }

  // 批量更新生产排单状态
  bulkUpdateProductionStatus(ids: string[], status: ProductionStatus, operatorId?: string): ProductionSchedule[] {
    const updatedSchedules: ProductionSchedule[] = [];

    ids.forEach(id => {
      const index = this.productionSchedules.findIndex(schedule => schedule.id === id);
      if (index !== -1) {
        const updates: Partial<ProductionSchedule> = { status };

        // 根据状态变更添加额外信息
        if (status === 'scheduled' || status === 'in_production') {
          updates.startDate = new Date();
          updates.operatorId = operatorId;
          updates.operator = operatorId ? authStore.getAllUsers().find(u => u.id === operatorId) : undefined;
        } else if (status === 'completed') {
          updates.endDate = new Date();
          updates.completedQuantity = this.productionSchedules[index].plannedQuantity;
        }

        this.productionSchedules[index] = {
          ...this.productionSchedules[index],
          ...updates,
          updatedAt: new Date()
        };

        updatedSchedules.push(this.productionSchedules[index]);
      }
    });

    if (updatedSchedules.length > 0) {
      this.notify();
    }

    return updatedSchedules;
  }

  // 删除生产排单
  deleteProductionSchedule(id: string): boolean {
    const index = this.productionSchedules.findIndex(schedule => schedule.id === id);
    if (index === -1) return false;

    this.productionSchedules.splice(index, 1);
    this.notify();
    return true;
  }

  // 获取可用机器列表
  getAvailableMachines(): string[] {
    return [...availableMachines];
  }

  // 从自己包装订单创建生产排单
  createSchedulesFromInHouseProduction(purchaseRequestId: string): ProductionSchedule[] {
    // 获取采购申请
    const request = procurementStore.getPurchaseRequestById(purchaseRequestId);
    if (!request || request.type !== 'in_house') {
      return [];
    }

    // 为每个SKU创建生产排单
    const newSchedules = request.items.map(item => {
      // 检查是否已存在该SKU的生产排单
      const existingSchedule = this.productionSchedules.find(
        s => s.purchaseRequestId === purchaseRequestId && s.skuId === item.skuId
      );

      if (existingSchedule) {
        return existingSchedule;
      }

      // 创建新的生产排单
      return this.createProductionSchedule({
        skuId: item.skuId,
        sku: item.sku,
        purchaseRequestId,
        purchaseRequestNumber: request.requestNumber,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 默认排期一周后
        plannedQuantity: item.quantity,
        packagingMethod: item.packagingMethod || '标准包装',
        machine: availableMachines[0], // 默认使用第一个可用机器
        status: 'pending'
      });
    });

    return newSchedules;
  }

  // 🎯 新增：自动流转监听器 - 监听自己包装订单完成验收
  private initializeAutoFlowListeners() {
    // 监听采购订单状态变化
    procurementStore.subscribe(() => {
      this.handleInHouseOrderCompletion();
    });
  }

  // 🎯 处理自己包装订单完成验收的自动流转
  private handleInHouseOrderCompletion() {
    try {
      // 获取所有已验收完成的自己包装订单
      const completedInHouseOrders = procurementStore.getPurchaseRequests(
        { type: ['in_house'], status: ['completed'] }
      ).data;

      completedInHouseOrders.forEach(order => {
        // 检查是否已经创建了生产排单
        const existingSchedules = this.productionSchedules.filter(
          s => s.purchaseRequestId === order.id
        );

        if (existingSchedules.length === 0) {
          // 自动创建生产排单
          const newSchedules = this.createSchedulesFromInHouseProduction(order.id);
          console.log(`🔄 自动流转：订单 ${order.requestNumber} 已完成验收，自动创建 ${newSchedules.length} 个SKU的生产排单`);
        }
      });
    } catch (error) {
      console.error('自动流转处理失败:', error);
    }
  }

  // 获取生产统计数据
  getProductionStats() {
    const pending = this.getPendingSchedules().length;
    const inProduction = this.getInProductionSchedules().length;
    const completed = this.getCompletedSchedules().length;
    const total = this.productionSchedules.length;

    const pendingQuantity = this.getPendingSchedules().reduce((sum, s) => sum + s.plannedQuantity, 0);
    const inProductionQuantity = this.getInProductionSchedules().reduce((sum, s) => sum + s.plannedQuantity, 0);
    const completedQuantity = this.getCompletedSchedules().reduce((sum, s) => sum + (s.completedQuantity || 0), 0);
    const totalQuantity = pendingQuantity + inProductionQuantity + completedQuantity;

    return {
      pending,
      inProduction,
      completed,
      total,
      pendingQuantity,
      inProductionQuantity,
      completedQuantity,
      totalQuantity,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }
}

export const productionStore = new ProductionStore();