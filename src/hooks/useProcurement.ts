import { useState, useEffect } from 'react';
import { procurementStore } from '../store/procurement';
import { 
  PurchaseRequest, 
  SKU, 
  Supplier, 
  InventoryItem,
  OrderAllocation,
  SKUFinalization,
  CardProgress,
  CardProgressStage,
  DashboardStats,
  FilterOptions,
  SortOptions,
  PaginationOptions
} from '../types';

export const useProcurement = () => {
  const [accessoryProgress, setAccessoryProgress] = useState(procurementStore.getAccessoryProgress());
  const [purchaseRequests, setPurchaseRequests] = useState(procurementStore.getPurchaseRequests().data);
  const [products, setProducts] = useState(procurementStore.getSKUs());

  useEffect(() => {
    const unsubscribe = procurementStore.subscribe(() => {
      setAccessoryProgress(procurementStore.getAccessoryProgress());
      setPurchaseRequests(procurementStore.getPurchaseRequests().data);
      setProducts(procurementStore.getSKUs());
    });
    return unsubscribe;
  }, []);

  return {
    // Reactive state data
    accessoryProgress,
    purchaseRequests,
    products,

    // Purchase Requests
    getPurchaseRequests: (
      filters?: FilterOptions,
      sort?: SortOptions,
      pagination?: PaginationOptions
    ) => procurementStore.getPurchaseRequests(filters, sort, pagination),
    
    getPurchaseRequestById: (id: string) => procurementStore.getPurchaseRequestById(id),
    
    createPurchaseRequest: (request: Omit<PurchaseRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>) => 
      procurementStore.createPurchaseRequest(request),
    
    updatePurchaseRequest: (id: string, updates: Partial<PurchaseRequest>) => 
      procurementStore.updatePurchaseRequest(id, updates),
    
    deletePurchaseRequest: (id: string) => 
      procurementStore.deletePurchaseRequest(id),
    
    approvePurchaseRequest: (id: string, approverId: string, remarks?: string) => 
      procurementStore.approvePurchaseRequest(id, approverId, remarks),
    
    rejectPurchaseRequest: (id: string, approverId: string, remarks?: string) => 
      procurementStore.rejectPurchaseRequest(id, approverId, remarks),

    // Order Allocations
    getOrderAllocations: () => procurementStore.getOrderAllocations(),
    getOrderAllocationById: (id: string) => procurementStore.getOrderAllocationById(id),
    getOrderAllocationByRequestId: (requestId: string) => procurementStore.getOrderAllocationByRequestId(requestId),
    createOrderAllocation: (allocation: Omit<OrderAllocation, 'id' | 'createdAt' | 'updatedAt'>) => 
      procurementStore.createOrderAllocation(allocation),
    updateOrderAllocation: (id: string, updates: Partial<OrderAllocation>) => 
      procurementStore.updateOrderAllocation(id, updates),

    // 自动创建纸卡进度
    createCardProgressForRequest: (request: PurchaseRequest) => 
      procurementStore.createCardProgressForRequest(request),
    
    // 自动创建辅料进度
    createAccessoryProgressForRequest: (request: PurchaseRequest) => 
      procurementStore.createAccessoryProgressForRequest(request),
    // SKU Finalizations
    getSKUFinalizations: () => procurementStore.getSKUFinalizations(),
    getSKUFinalizationBySKU: (skuId: string) => procurementStore.getSKUFinalizationBySKU(skuId),
    createSKUFinalization: (finalization: Omit<SKUFinalization, 'id' | 'createdAt' | 'updatedAt'>) => 
      procurementStore.createSKUFinalization(finalization),
    updateSKUFinalization: (id: string, updates: Partial<SKUFinalization>) => 
      procurementStore.updateSKUFinalization(id, updates),
    bulkUpdateSKUFinalizations: (finalizations: Omit<SKUFinalization, 'id' | 'createdAt' | 'updatedAt'>[]) => 
      procurementStore.bulkUpdateSKUFinalizations(finalizations),

    // SKUs
    getSKUs: () => procurementStore.getSKUs(),
    getSKUById: (id: string) => procurementStore.getSKUById(id),
    createSKU: (sku: Omit<SKU, 'id'>) => procurementStore.createSKU(sku),
    bulkCreateSKUs: (skus: Omit<SKU, 'id'>[]) => procurementStore.bulkCreateSKUs(skus),
    updateSKU: (id: string, updates: Partial<SKU>) => procurementStore.updateSKU(id, updates),
    deleteSKU: (id: string) => procurementStore.deleteSKU(id),

    // Suppliers
    getSuppliers: () => procurementStore.getSuppliers(),
    getSupplierById: (id: string) => procurementStore.getSupplierById(id),
    createSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => 
      procurementStore.createSupplier(supplier),
    updateSupplier: (id: string, updates: Partial<Supplier>) => 
      procurementStore.updateSupplier(id, updates),

    // Dashboard
    getDashboardStats: () => procurementStore.getDashboardStats(),

    // Quality Checks
    getQualityChecks: () => procurementStore.getQualityChecks(),
    createQualityCheck: (check: any) => procurementStore.createQualityCheck(check),

    // Shipments
    getShipments: () => procurementStore.getShipments(),
    createShipment: (shipment: any) => procurementStore.createShipment(shipment),

    // Progress Tracking
    getCardProgress: () => procurementStore.getCardProgress(),
    getCardProgressByRequestId: (requestId: string) => procurementStore.getCardProgressByRequestId(requestId),
    getCardProgressBySKU: (skuId: string) => procurementStore.getCardProgressBySKU(skuId),
    createCardProgress: (progress: Omit<CardProgress, 'id' | 'createdAt' | 'updatedAt'>) => 
      procurementStore.createCardProgress(progress),
    updateCardProgress: (id: string, updates: any) => procurementStore.updateCardProgress(id, updates),
    updateCardProgressStage: (progressId: string, stageId: string, updates: Partial<CardProgressStage>) => 
      procurementStore.updateCardProgressStage(progressId, stageId, updates),
    updateCardProgress: (id: string, updates: Partial<CardProgress>) => procurementStore.updateCardProgress(id, updates),

    getAccessoryProgress: () => procurementStore.getAccessoryProgress(),
   getAccessoryProgressByRequestId: (requestId: string) => procurementStore.getAccessoryProgressByRequestId(requestId),
    updateAccessoryProgress: (id: string, updates: any) => procurementStore.updateAccessoryProgress(id, updates),
    calculateAccessoryProgressGlobal: (accessories: any[]) => procurementStore.calculateAccessoryProgressGlobal(accessories),

    // Procurement Progress
    getProcurementProgress: () => procurementStore.getProcurementProgress(),
    getProcurementProgressByRequestId: (requestId: string) => procurementStore.getProcurementProgressByRequestId(requestId),
    createProcurementProgress: (requestId: string) => procurementStore.createProcurementProgress(requestId),
    updateProcurementProgressStage: (progressId: string, stageName: string, updates: any) => 
      procurementStore.updateProcurementProgressStage(progressId, stageName, updates),
    createProcurementProgressForRequest: (request: PurchaseRequest) => 
      procurementStore.createProcurementProgressForRequest(request),

    // Payment Reminders
    addPaymentReminder: (requestId: string, paymentType?: 'deposit' | 'final') => 
      procurementStore.addPaymentReminder(requestId, paymentType),
    getPaymentReminders: () => procurementStore.getPaymentReminders(),
    getPaymentReminderDetails: () => procurementStore.getPaymentReminderDetails(),
    getPaymentReminderTime: (requestId: string, paymentType: 'deposit' | 'final') => 
      procurementStore.getPaymentReminderTime(requestId, paymentType),
    confirmPayment: (requestId: string, paymentType: 'deposit' | 'final') => 
      procurementStore.confirmPayment(requestId, paymentType),
    getPaymentStatus: () => procurementStore.getPaymentStatus(),
    isPaymentConfirmed: (requestId: string, paymentType: 'deposit' | 'final' | 'credit_terms') => 
      procurementStore.isPaymentConfirmed(requestId, paymentType),

    // 订单备注
    getOrderNote: (requestId: string) => procurementStore.getOrderNote(requestId),
    updateOrderNote: (requestId: string, note: string) => procurementStore.updateOrderNote(requestId, note),

    // SKU完成状态
    isSKUCompleted: (requestId: string, skuId: string) => procurementStore.isSKUCompleted(requestId, skuId),
    completeSKU: (requestId: string, skuId: string) => procurementStore.completeSKU(requestId, skuId),
    isOrderAllSKUsCompleted: (requestId: string) => procurementStore.isOrderAllSKUsCompleted(requestId),

    // Card Delivery Management
    confirmCardDelivery: (requestId: string) => procurementStore.confirmCardDelivery(requestId),
    requestCardDelivery: (requestId: string) => procurementStore.requestCardDelivery(requestId),

    // 获取纸卡催付记录
    getCardDeliveryReminders: () => procurementStore.getCardDeliveryReminders(),
    getCardDeliveryReminderTime: (requestId: string) => procurementStore.getCardDeliveryReminderTime(requestId),

    // 自动检查纸卡进度完成状态
    checkAndUpdateCardProgressCompletion: () => procurementStore.checkAndUpdateCardProgressCompletion(),

    // Inventory
    getInventory: () => procurementStore.getInventory(),
    getInventoryBySKU: (skuId: string) => procurementStore.getInventoryBySKU(skuId),
    updateInventory: (id: string, updates: Partial<InventoryItem>) => procurementStore.updateInventory(id, updates),
    bulkUpdateInventory: (inventoryData: Omit<InventoryItem, 'id' | 'updatedAt'>[]) => procurementStore.bulkUpdateInventory(inventoryData),
    deleteInventory: (id: string) => procurementStore.deleteInventory(id)
  };
};