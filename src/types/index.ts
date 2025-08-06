export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  createdAt: Date;
}

export type UserRole = 
  | 'purchasing_officer'    // 采购专员
  | 'department_manager'    // 部门主管
  | 'general_manager'       // 总经理
  | 'card_designer'         // 纸卡设计人员
  | 'production_staff'      // 生产排单人员
  | 'warehouse_staff'      // 仓管人员
  | 'logistics_staff'      // 物流专员
  | 'finance_personnel'     // 财务人员
  | 'accessory_staff'      // 辅料人员
  | 'qc_officer'          // 质检专员
  | 'production_staff';    // 生产人员

export interface SKU {
  id: string;
  code: string;
  name: string;
  englishName: string;
  category: string;
  identificationCode: string;
  imageUrl?: string;
}

export interface PurchaseRequestItem {
  id: string;
  skuId: string;
  sku: SKU;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  remarks?: string;
  status: ItemStatus;
  material?: string;
  packagingMethod?: string;
  // 分配阶段添加的字段
  supplierId?: string;
  supplier?: Supplier;
  deadline?: Date;
  paymentTerms?: string;
}

export type ItemStatus = 
  | 'pending'           // 待定
  | 'approved'          // 已批准
  | 'rejected'          // 已拒绝
  | 'in_progress'       // 进行中
  | 'completed'         // 已完成
  | 'shipped';          // 已出货

export type PurchaseType = 'external' | 'in_house'; // 厂家包装 | 自己包装

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requesterId: string;
  requester: User;
  items: PurchaseRequestItem[];
  totalAmount: number;
  status: OrderStatus;
  approvalStatus: ApprovalStatus;
  // 通用字段
  material?: string;
  packagingMethod?: string;
  // 审批后添加的字段
  deadline: Date;
  firstApproverId?: string;
  firstApprover?: User;
  firstApprovalDate?: Date;
  firstApprovalRemarks?: string;
  finalApproverId?: string;
  finalApprover?: User;
  finalApprovalDate?: Date;
  finalApprovalRemarks?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'draft'             // 草稿
  | 'submitted'         // 已提交
  | 'first_approved'    // 一级审批通过
  | 'approved'          // 已批准
  | 'allocated'         // 已分配
  | 'rejected'          // 已拒绝
  | 'in_production'     // 生产中
  | 'quality_check'     // 质检中
  | 'ready_to_ship'     // 待发货
  | 'shipped'           // 已发货
  | 'completed';        // 已完成

export type ApprovalStatus = 
  | 'pending'               // 待审批
  | 'first_approved'        // 一级审批通过
  | 'approved'              // 最终审批通过
  | 'rejected';             // 已拒绝

export interface ProductionSchedule {
  id: string;
  skuId: string;
  sku: SKU;
  purchaseRequestId: string;
  purchaseRequestNumber?: string; // 新增：订单编号，用于追溯原始订单
  scheduledDate: Date;
  plannedQuantity: number;
  packagingMethod: string;
  machine: string;
  status: ProductionStatus;
  completedQuantity?: number;
  startDate?: Date;
  endDate?: Date;
  operator?: User;
  operatorId?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductionStatus = 
  | 'pending'           // 待排单
  | 'scheduled'         // 已排单
  | 'in_production'     // 生产中
  | 'completed'         // 已完成
  | 'cancelled';        // 已取消

export type AllocationStatus = 
  | 'pending'           // 待分配
  | 'allocated'         // 已分配
  | 'in_production'     // 待生产
  | 'production_scheduled' // 已排产
  | 'pending_receipt'   // 待收货
  | 'received'          // 已收货
  | 'pending_shipment'  // 待发货
  | 'shipped';          // 已发货

export type PaymentMethod = 
  | 'payment_on_delivery'  // 付款发货
  | 'cash_on_delivery'     // 货到付款
  | 'credit_terms';        // 账期

export type CardType =
  | 'finished'           // 纸卡成品
  | 'design'             // 设计稿
  | 'none';              // 不需要

export interface OrderAllocation {
  id: string;
  purchaseRequestId: string;
  type: PurchaseType;
  paymentMethod: PaymentMethod;
  prepaymentAmount?: number;  // 预付定金金额（付款发货和货到付款时需要）
  creditDate?: Date;          // 账期日期（账期付款时需要）
  productionDate: Date;       // 生产日期
  deliveryDate: Date;         // 交货日期
  allocationStatus: AllocationStatus;
  allocatedBy: string;        // 分配人ID
  allocatedAt: Date;          // 分配时间
  cardType?: CardType;        // 纸卡类型
  remarks?: string;           // 分配备注
  createdAt: Date;
  updatedAt: Date;
}

export interface CardProgress {
  id: string;
  purchaseRequestId: string;
  skuId: string;
  sku: SKU;
  isFinalized: boolean; // 是否已定稿
  stages: CardProgressStage[];
  currentStage: number; // 当前所处阶段索引
  overallProgress: number; // 整体完成进度百分比
  productionQuantity?: number; // 生产数量
  productionAmount?: number; // 生产金额
  purchaseQuantity?: number; // 采购数量
  estimatedCompletionDate?: Date; // 预计完成时间
  actualCompletionDate?: Date; // 实际完成时间
  isOverdue: boolean; // 是否延误
  packagingType: 'external' | 'in_house'; // 包装类型
  cardType?: string; // 纸卡类型
  isManuallyConfirmed?: boolean; // 是否已手动确认收货
  confirmedDate?: Date; // 确认收货时间
  createdAt: Date;
  updatedAt: Date;
}

export interface CardProgressStage {
  id: string;
  name: string;
  status: TaskStatus;
  assignee?: User; // 负责人
  startDate?: Date;
  completedDate?: Date;
  estimatedDuration: number; // 预计耗时（天）
  actualDuration?: number; // 实际耗时（天）
  remarks?: string;
  order: number; // 阶段顺序
}

export interface SKUFinalization {
  id: string;
  skuId: string;
  sku: SKU;
  isFinalized: boolean;
  finalizedDate?: Date;
  finalizedBy?: User;
  designVersion?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 
  | 'not_started'       // 未开始
  | 'in_progress'       // 进行中
  | 'completed'         // 已完成
  | 'delayed';          // 延期

export interface AccessoryProgress {
  id: string;
  purchaseRequestId: string;
  skuId: string;
  sku: SKU;
  accessories: AccessoryItem[];
  overallProgress: number;
  purchaseQuantity?: number; // 采购数量
  totalCost?: number; // 辅料总成本
  moldCost?: number; // 模具成本
  dieCost?: number; // 刀版成本
  createdAt: Date;
  updatedAt: Date;
}

export type AccessoryType = 
  | 'blister'      // 泡壳
  | 'tray'         // 中托
  | 'carton'       // 纸箱
  | 'barcode'      // 条码
  | 'label';       // 唛头

export type AccessoryCycle = 
  | 'long'         // 长周期
  | 'short';       // 短周期

export interface AccessoryItem {
  id: string;
  name: string;
  type: AccessoryType;
  cycle: AccessoryCycle;
  status: TaskStatus;
  startDate?: Date;
  completedDate?: Date;
  estimatedDuration: number;
  actualDuration?: number;
  remarks?: string;
  updatedAt: Date;
  cost?: number; // 辅料项目成本
}

export interface QualityCheck {
  id: string;
  purchaseRequestId: string;
  itemId: string;
  receivedQuantity: number;
  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  qualityStatus: QualityStatus;
  inspectionDate: Date;
  inspectorId: string;
  inspector: User;
  remarks?: string;
  defectReasons?: string[];
}

export type QualityStatus = 
  | 'pending'           // 待检
  | 'pass'              // 合格
  | 'fail'              // 不合格
  | 'partial_pass';     // 部分合格

export interface Shipment {
  id: string;
  containerNumber: string;
  purchaseRequestIds: string[];
  items: ShipmentItem[];
  destination: string;
  shippingDate: Date;
  estimatedArrival?: Date;
  actualArrival?: Date;
  status: ShipmentStatus;
  logisticsStaffId: string;
  logisticsStaff: User;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipmentItem {
  itemId: string;
  item: PurchaseRequestItem;
  shippedQuantity: number;
  status: 'shipped' | 'not_shipped';
}

export type ShipmentStatus = 
  | 'preparing'         // 准备中
  | 'shipped'           // 已发货
  | 'in_transit'        // 运输中
  | 'delivered';        // 已送达

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  city: string;
  paymentTerms: string;
  leadTime: number; // days
  rating: number; // 1-5
  isActive: boolean;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierPerformance {
  supplierId: string;
  supplier: Supplier;
  totalOrders: number;
  onTimeDeliveries: number;
  qualityScore: number;
  averageLeadTime: number;
  lastOrderDate?: Date;
}

export interface DashboardStats {
  totalPurchaseRequests: number;
  pendingApprovals: number;
  inProgress: number;
  completedThisMonth: number;
  overdueItems: number;
  qualityIssues: number;
  totalSuppliers: number;
  activeShipments: number;
}

export interface BulkUploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errors: BulkUploadError[];
}

export interface InventoryItem {
  id: string;
  skuId: string;
  sku: SKU;
  inTransitQuantity: number;  // 在途数
  inStockQuantity: number;    // 在库数
  totalQuantity: number;      // 总库存
  replenishmentCycle: number; // 补货周期（天）
  replenishmentPoint: number; // 补货点
  targetCoveragePeriod: number; // 目标覆盖期（天）
  forecastMonthlySales: number; // 预测月销量
  estimatedSalesDays: number; // 预计可售时间（天）
  suggestedReplenishment: number; // 建议补货量
  updatedAt: Date;
}

export interface BulkUploadError {
  row: number;
  field: string;
  message: string;
  value: string;
}

export interface ProcurementProgressStage {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  completedDate?: Date;
  remarks?: string;
  order: number;
}

export interface ProcurementProgress {
  id: string;
  purchaseRequestId: string;
  stages: ProcurementProgressStage[];
  currentStage: number;
  overallProgress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterOptions {
  status?: OrderStatus[];
  type?: PurchaseType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  supplierId?: string;
  requesterId?: string;
  approverId?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
}

// 到货检验相关类型
export interface ArrivalInspection {
  id: string;
  purchaseRequestId: string;
  skuId: string;
  sku: SKU;
  purchaseRequestNumber: string;
  purchaseQuantity: number;
  arrivalQuantity?: number;
  isArrived: boolean;              // 是否到货
  arrivalDate?: Date;              // 到货日期
  inspectionStatus: ArrivalInspectionStatus;
  inspectionDate?: Date;
  inspectorId?: string;
  inspector?: User;
  inspectionPhotos: InspectionPhoto[];
  inspectionNotes?: string;
  qualityResult?: 'passed' | 'failed';
  productType: 'semi_finished' | 'finished'; // 半成品 | 成品
  procurementProgress: number;     // 采购进度
  cardProgress: number;            // 纸卡进度
  accessoryProgress: number;       // 辅料进度
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ArrivalInspectionStatus = 
  | 'pending'           // 待验收
  | 'completed';        // 已验收

export interface InspectionPhoto {
  id: string;
  file: File;
  preview: string;
  description?: string;
  uploadDate: Date;
}