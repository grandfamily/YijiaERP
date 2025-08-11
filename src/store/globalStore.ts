import { create } from 'zustand';
import type {
  User, PurchaseRequest, ProductionSchedule, ArrivalInspection, InboundRegisterRecord, Shipment, InventoryItem, RejectedOrder
} from '../types';

import type { QualityControlRecord } from './qualityControl';

interface GlobalStoreState {
  // 用户信息
  user: User | null;
  setUser: (user: User | null) => void;

  // 采购申请/进度/分配
  purchaseRequests: PurchaseRequest[];
  setPurchaseRequests: (list: PurchaseRequest[]) => void;
  updatePurchaseRequest: (id: string, updates: Partial<PurchaseRequest>) => void;

  // 生产排单
  productionSchedules: ProductionSchedule[];
  setProductionSchedules: (list: ProductionSchedule[]) => void;
  addProductionSchedule: (schedule: ProductionSchedule) => void;
  updateProductionSchedule: (id: string, updates: Partial<ProductionSchedule>) => void;

  // 到货检验
  arrivalInspections: ArrivalInspection[];
  setArrivalInspections: (list: ArrivalInspection[]) => void;
  updateArrivalInspection: (id: string, updates: Partial<ArrivalInspection>) => void;

  // 入库登记
  inboundRegisters: InboundRegisterRecord[];
  setInboundRegisters: (list: InboundRegisterRecord[]) => void;
  addInboundRegister: (record: InboundRegisterRecord) => void;
  updateInboundRegister: (id: string, updates: Partial<InboundRegisterRecord>) => void;

  // 质检（统计入库）
  qualityControlRecords: QualityControlRecord[];
  setQualityControlRecords: (records: QualityControlRecord[]) => void;
  addQualityControlRecord: (record: QualityControlRecord) => void;
  updateQualityControlRecord: (id: string, updates: Partial<QualityControlRecord>) => void;
  // 发货出柜
  shipments: Shipment[];
  setShipments: (list: Shipment[]) => void;
  updateShipment: (id: string, updates: Partial<Shipment>) => void;

  // 库存
  inventory: InventoryItem[];
  setInventory: (list: InventoryItem[]) => void;
  updateInventory: (id: string, updates: Partial<InventoryItem>) => void;

  // 不合格订单
  rejectedOrders: RejectedOrder[];
  setRejectedOrders: (list: RejectedOrder[]) => void;
  addRejectedOrder: (order: RejectedOrder) => void;
  updateRejectedOrder: (id: string, updates: Partial<RejectedOrder>) => void;
}

export const useGlobalStore = create<GlobalStoreState>((set) => ({
  qualityControlRecords: [],
  setQualityControlRecords: (records) => set({ qualityControlRecords: records }),
  addQualityControlRecord: (record) => set(state => {
    if (state.qualityControlRecords.some(r => r.purchaseRequestNumber === record.purchaseRequestNumber && r.skuId === record.skuId)) {
      return {};
    }
    return { qualityControlRecords: [...state.qualityControlRecords, record] };
  }),
  updateQualityControlRecord: (id, updates) => set(state => ({
    qualityControlRecords: state.qualityControlRecords.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r)
  })),
  user: null,
  setUser: (user) => set({ user }),

  purchaseRequests: [],
  setPurchaseRequests: (list) => set({ purchaseRequests: list }),
  updatePurchaseRequest: (id, updates) => set(state => ({
    purchaseRequests: state.purchaseRequests.map(pr => pr.id === id ? { ...pr, ...updates } : pr)
  })),

  productionSchedules: [
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
      createdAt: new Date('2024-07-23'),
      updatedAt: new Date('2024-07-25')
    }
  ],
  setProductionSchedules: (list) => set({ productionSchedules: list }),
  addProductionSchedule: (schedule) => set(state => {
    // 检查是否已存在相同的记录，避免重复添加
    if (state.productionSchedules.some(s => s.purchaseRequestNumber === schedule.purchaseRequestNumber && s.skuId === schedule.skuId)) {
      return state;
    }
    return { productionSchedules: [...state.productionSchedules, schedule] };
  }),
  updateProductionSchedule: (id, updates) => set(state => ({
    productionSchedules: state.productionSchedules.map(ps => ps.id === id ? { ...ps, ...updates } : ps)
  })),

  arrivalInspections: [
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
  inspector: undefined,
      inspectionPhotos: [],
      productType: 'finished',
      procurementProgress: 100,
      cardProgress: 100,
      accessoryProgress: 100,
      createdAt: new Date('2024-01-24'),
      updatedAt: new Date('2024-01-26')
    }
  ],
  setArrivalInspections: (list) => set({ arrivalInspections: list }),
  updateArrivalInspection: (id, updates) => set(state => ({
    arrivalInspections: state.arrivalInspections.map(ai => ai.id === id ? { ...ai, ...updates } : ai)
  })),

  inboundRegisters: [],
  setInboundRegisters: (list) => set({ inboundRegisters: list }),
  addInboundRegister: (record) => set(state => {
    // 检查是否已存在相同的记录，避免重复添加
    if (state.inboundRegisters.some(r => r.purchaseRequestNumber === record.purchaseRequestNumber && r.skuId === record.skuId)) {
      return state;
    }
    return { inboundRegisters: [...state.inboundRegisters, record] };
  }),
  updateInboundRegister: (id, updates) => set(state => ({
    inboundRegisters: state.inboundRegisters.map(ir => ir.id === id ? { ...ir, ...updates } : ir)
  })),

  shipments: [],
  setShipments: (list) => set({ shipments: list }),
  updateShipment: (id, updates) => set(state => ({
    shipments: state.shipments.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  inventory: [],
  setInventory: (list) => set({ inventory: list }),
  updateInventory: (id, updates) => set(state => ({
    inventory: state.inventory.map(i => i.id === id ? { ...i, ...updates } : i)
  })),

  // 不合格订单实现（带持久化）
  rejectedOrders: (() => {
    try {
      const stored = localStorage.getItem('rejectedOrders');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  
  setRejectedOrders: (list) => {
    try {
      localStorage.setItem('rejectedOrders', JSON.stringify(list));
    } catch (e) {
      console.error('保存不合格订单到localStorage失败:', e);
    }
    set({ rejectedOrders: list });
  },
  
  addRejectedOrder: (order) => set(state => {
    console.log('🏪 添加不合格订单到全局存储:', order);
    const newOrders = [...state.rejectedOrders, order];
    try {
      localStorage.setItem('rejectedOrders', JSON.stringify(newOrders));
      console.log('🏪 不合格订单已保存到localStorage');
    } catch (e) {
      console.error('保存不合格订单到localStorage失败:', e);
    }
    return { rejectedOrders: newOrders };
  }),
  
  updateRejectedOrder: (id, updates) => set(state => {
    const newOrders = state.rejectedOrders.map(o => o.id === id ? { ...o, ...updates } : o);
    try {
      localStorage.setItem('rejectedOrders', JSON.stringify(newOrders));
    } catch (e) {
      console.error('更新不合格订单到localStorage失败:', e);
    }
    return { rejectedOrders: newOrders };
  }),
}));
