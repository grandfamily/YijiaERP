import { create } from 'zustand';
import type {
  User, PurchaseRequest, ProductionSchedule, ArrivalInspection, InboundRegisterRecord, Shipment, InventoryItem, RejectedOrder
} from '../types';
import { mockProductionSchedules } from './mockData';
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

  // 入库登记
  inboundRegisters: InboundRegisterRecord[];
  setInboundRegisters: (list: InboundRegisterRecord[]) => void;
  addInboundRegister: (record: InboundRegisterRecord) => void;
  updateInboundRegister: (id: string, updates: Partial<InboundRegisterRecord>) => void;

  // 不合格订单
  rejectedOrders: RejectedOrder[];
  setRejectedOrders: (list: RejectedOrder[]) => void;
  addRejectedOrder: (order: RejectedOrder) => void;
  updateRejectedOrder: (id: string, updates: Partial<RejectedOrder>) => void;
}

// 持久化存储函数
const getPersisted = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage:`, e);
    return defaultValue;
  }
};

const setPersisted = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
};

export const useGlobalStore = create<GlobalStoreState>((set, get) => ({
  // 用户信息
  user: null,
  setUser: (user) => set({ user }),

  // 采购申请（持久化）
  purchaseRequests: getPersisted('purchaseRequests', []),
  setPurchaseRequests: (list) => {
    setPersisted('purchaseRequests', list);
    set({ purchaseRequests: list });
  },
  updatePurchaseRequest: (id, updates) => set(state => {
    const newList = state.purchaseRequests.map(pr => pr.id === id ? { ...pr, ...updates } : pr);
    setPersisted('purchaseRequests', newList);
    return { purchaseRequests: newList };
  }),

  // 生产排单（持久化）
  productionSchedules: (() => {
    const stored = getPersisted('productionSchedules', []);
    return stored.length > 0 ? stored : mockProductionSchedules;
  })(),
  setProductionSchedules: (list) => {
    setPersisted('productionSchedules', list);
    set({ productionSchedules: list });
  },
  addProductionSchedule: (schedule) => set(state => {
    // 检查是否已存在相同的记录，避免重复添加
    if (state.productionSchedules.some(s => s.purchaseRequestNumber === schedule.purchaseRequestNumber && s.skuId === schedule.skuId)) {
      console.log('🔄 生产排单记录已存在，跳过添加:', schedule.purchaseRequestNumber);
      return state;
    }
    const newList = [...state.productionSchedules, schedule];
    setPersisted('productionSchedules', newList);
    console.log('🏭 已保存生产排单到localStorage:', schedule);
    return { productionSchedules: newList };
  }),
  updateProductionSchedule: (id, updates) => set(state => {
    const newList = state.productionSchedules.map(ps => ps.id === id ? { ...ps, ...updates } : ps);
    setPersisted('productionSchedules', newList);
    return { productionSchedules: newList };
  }),

  // 入库登记（持久化）
  inboundRegisters: getPersisted('inboundRegisters', []),
  setInboundRegisters: (list) => {
    setPersisted('inboundRegisters', list);
    set({ inboundRegisters: list });
  },
  addInboundRegister: (record) => set(state => {
    // 检查是否已存在相同的记录，避免重复添加
    if (state.inboundRegisters.some(r => r.purchaseRequestNumber === record.purchaseRequestNumber && r.skuId === record.skuId)) {
      console.log('🔄 入库登记记录已存在，跳过添加:', record.purchaseRequestNumber);
      return state;
    }
    const newList = [...state.inboundRegisters, record];
    setPersisted('inboundRegisters', newList);
    console.log('📦 已保存入库登记到localStorage:', record);
    return { inboundRegisters: newList };
  }),
  updateInboundRegister: (id, updates) => set(state => {
    const newList = state.inboundRegisters.map(ir => ir.id === id ? { ...ir, ...updates } : ir);
    setPersisted('inboundRegisters', newList);
    return { inboundRegisters: newList };
  }),

  // 不合格订单（持久化）
  rejectedOrders: getPersisted('rejectedOrders', []),
  setRejectedOrders: (list) => {
    setPersisted('rejectedOrders', list);
    set({ rejectedOrders: list });
  },
  addRejectedOrder: (order) => set(state => {
    console.log('🏪 添加不合格订单到全局存储:', order);
    const newOrders = [...state.rejectedOrders, order];
    setPersisted('rejectedOrders', newOrders);
    console.log('🏪 不合格订单已保存到localStorage');
    return { rejectedOrders: newOrders };
  }),
  updateRejectedOrder: (id, updates) => set(state => {
    const newOrders = state.rejectedOrders.map(o => o.id === id ? { ...o, ...updates } : o);
    setPersisted('rejectedOrders', newOrders);
    return { rejectedOrders: newOrders };
  }),
}));
