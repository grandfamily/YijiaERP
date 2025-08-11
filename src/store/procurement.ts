import { 
  PurchaseRequest, 
  PurchaseRequestItem, 
  SKU, 
  Supplier, 
  InventoryItem,
  OrderAllocation,
  SKUFinalization,
  QualityCheck, 
  Shipment, 
  CardProgress, 
  CardProgressStage,
  AccessoryProgress,
  DashboardStats,
  FilterOptions,
  SortOptions,
  PaginationOptions,
  ProcurementProgress,
  ProcurementProgressStage,
  AccessoryItem
} from '../types';

// Mock data for demonstration
const mockSKUs: SKU[] = [
  {
    id: 'sku-001',
    code: 'KIT-001',
    name: '厨房用品A',
    englishName: 'Kitchen Product A',
    category: '厨房用品',
    identificationCode: 'ID001',
    imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'
  },
  {
    id: 'sku-002',
    code: 'HAR-001',
    name: '五金用品B',
    englishName: 'Hardware Product B',
    category: '五金用品',
    identificationCode: 'ID002',
    imageUrl: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg'
  },
  {
    id: 'sku-003',
    code: 'FRA-001',
    name: '相框C',
    englishName: 'Photo Frame C',
    category: '相框',
    identificationCode: 'ID003',
    imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'
  }
];

const mockSuppliers: Supplier[] = [
  {
    id: 'sup-001',
    name: '深圳电子有限公司',
    code: 'SZ-ELE-001',
    contactPerson: '陈经理',
    phone: '+86-755-12345678',
    email: 'chen@sz-electronics.com',
    address: '深圳市南山区科技园',
    country: '中国',
    city: '深圳',
    paymentTerms: '30天付款',
    leadTime: 15,
    rating: 4.5,
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'sup-002',
    name: '广州玩具制造厂',
    code: 'GZ-TOY-001',
    contactPerson: '刘总',
    phone: '+86-020-87654321',
    email: 'liu@gz-toys.com',
    address: '广州市天河区工业园',
    country: '中国',
    city: '广州',
    paymentTerms: '45天付款',
    leadTime: 20,
    rating: 4.2,
    isActive: true,
    createdAt: new Date('2024-01-01')
  }
];

const mockInventory: InventoryItem[] = [
  {
    id: 'inv-001',
    skuId: 'sku-001',
    sku: mockSKUs[0],
    inTransitQuantity: 50,
    inStockQuantity: 150,
    totalQuantity: 200,
    replenishmentCycle: 30,
    replenishmentPoint: 100,
    targetCoveragePeriod: 45,
    forecastMonthlySales: 80,
    estimatedSalesDays: 75,
    suggestedReplenishment: 120,
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'inv-002',
    skuId: 'sku-002',
    sku: mockSKUs[1],
    inTransitQuantity: 30,
    inStockQuantity: 70,
    totalQuantity: 100,
    replenishmentCycle: 25,
    replenishmentPoint: 120,
    targetCoveragePeriod: 40,
    forecastMonthlySales: 60,
    estimatedSalesDays: 50,
    suggestedReplenishment: 150,
    updatedAt: new Date('2024-01-18')
  },
  {
    id: 'inv-003',
    skuId: 'sku-003',
    sku: mockSKUs[2],
    inTransitQuantity: 0,
    inStockQuantity: 80,
    totalQuantity: 80,
    replenishmentCycle: 20,
    replenishmentPoint: 90,
    targetCoveragePeriod: 35,
    forecastMonthlySales: 45,
    estimatedSalesDays: 53,
    suggestedReplenishment: 100,
    updatedAt: new Date('2024-01-15')
  }
];

const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'pr-001',
    requestNumber: 'PR-2024-001',
    requesterId: '1',
    requester: {
      id: '1',
      name: '张三',
      email: 'zhang.san@company.com',
      role: 'purchasing_officer',
      department: '采购部',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    type: 'external',
    items: [
      {
        id: 'pri-001',
        skuId: 'sku-001',
        sku: mockSKUs[0],
        quantity: 100,
        unitPrice: 50,
        totalPrice: 5000,
        status: 'approved',
        supplierId: 'sup-001',
        supplier: mockSuppliers[0],
        material: '塑料',
        packagingMethod: '纸盒包装'
      }
    ],
    totalAmount: 5000,
    deadline: new Date('2024-02-15'),
    status: 'in_production',
    approvalStatus: 'approved',
    firstApproverId: '2',
    firstApprover: {
      id: '2',
      name: '李四',
      email: 'li.si@company.com',
      role: 'department_manager',
      department: '采购部',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    firstApprovalDate: new Date('2024-01-18'),
    finalApproverId: '6',
    finalApprover: {
      id: '6',
      name: '钱八',
      email: 'qian.ba@company.com',
      role: 'general_manager',
      department: '管理层',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    finalApprovalDate: new Date('2024-01-20'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'pr-002',
    requestNumber: 'PR-2025-002',
    requesterId: '1',
    requester: {
      id: '1',
      name: '张三',
      email: 'zhang.san@company.com',
      role: 'purchasing_officer',
      department: '采购部',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    type: 'external',
    items: [
      {
        id: 'pri-002',
        skuId: 'sku-001',
        sku: mockSKUs[0],
        quantity: 2000,
        unitPrice: 15.50,
        totalPrice: 31000,
        status: 'pending',
        material: '订单',
        packagingMethod: '订单'
      }
    ],
    totalAmount: 31000,
    deadline: new Date('2024-02-28'),
    status: 'submitted',
    approvalStatus: 'pending',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10')
  }
];

// Mock SKU Finalization data
const mockSKUFinalizations: SKUFinalization[] = [
  {
    id: 'fin-001',
    skuId: 'sku-001',
    sku: mockSKUs[0],
    isFinalized: true,
    finalizedDate: new Date('2024-01-10'),
    finalizedBy: {
      id: '3',
      name: '王五',
      email: 'wang.wu@company.com',
      role: 'card_designer',
      department: '设计部',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    designVersion: 'v2.1',
    remarks: '设计已确认，可直接生产',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'fin-002',
    skuId: 'sku-002',
    sku: mockSKUs[1],
    isFinalized: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
];

// Mock Card Progress data
const mockCardProgress: CardProgress[] = [
  {
    id: 'cp-001',
    purchaseRequestId: 'pr-001',
    skuId: 'sku-001',
    sku: mockSKUs[0],
    isFinalized: true,
    stages: [
      {
        id: 'stage-001-1',
        name: '刀线设计',
        status: 'completed',
        assignee: {
          id: '3',
          name: '王五',
          email: 'wang.wu@company.com',
          role: 'card_designer',
          department: '设计部',
          isActive: true,
          createdAt: new Date('2024-01-01')
        },
        startDate: new Date('2024-01-16'),
        completedDate: new Date('2024-01-18'),
        estimatedDuration: 2,
        actualDuration: 2,
        order: 1
      },
      {
        id: 'stage-001-2',
        name: '文字翻译',
        status: 'completed',
        startDate: new Date('2024-01-18'),
        completedDate: new Date('2024-01-19'),
        estimatedDuration: 1,
        actualDuration: 1,
        order: 2
      },
      {
        id: 'stage-001-3',
        name: '国外版面设计',
        status: 'in_progress',
        startDate: new Date('2024-01-19'),
        estimatedDuration: 3,
        order: 3
      },
      {
        id: 'stage-001-4',
        name: '国内设计确认',
        status: 'not_started',
        estimatedDuration: 1,
        order: 4
      },
      {
        id: 'stage-001-5',
        name: '打样',
        status: 'not_started',
        estimatedDuration: 2,
        order: 5
      },
      {
        id: 'stage-001-6',
        name: '生产',
        status: 'not_started',
        estimatedDuration: 7,
        order: 6
      },
      {
        id: 'stage-001-7',
        name: '包装配送',
        status: 'not_started',
        estimatedDuration: 2,
        order: 7
      }
    ],
    currentStage: 2, // 当前在国外版面设计阶段
    overallProgress: 35,
    productionQuantity: 100,
    productionAmount: 5000,
    estimatedCompletionDate: new Date('2024-02-05'),
    isOverdue: false,
    packagingType: 'external',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-19')
  }
];

// Mock Accessory Progress data
const mockAccessoryProgress: AccessoryProgress[] = [
  {
    id: 'ap-001',
    purchaseRequestId: 'pr-001',
    skuId: 'sku-001',
    sku: mockSKUs[0],
    accessories: [
      {
        id: 'acc-001-1',
        name: '泡壳',
        type: 'blister',
        cycle: 'long',
        status: 'completed',
        startDate: new Date('2024-01-16'),
        completedDate: new Date('2024-01-20'),
        estimatedDuration: 5,
        actualDuration: 4
      },
      {
        id: 'acc-001-2',
        name: '中托',
        type: 'tray',
        cycle: 'long',
        status: 'completed',
        startDate: new Date('2024-01-16'),
        completedDate: new Date('2024-01-19'),
        estimatedDuration: 4,
        actualDuration: 3
      },
      {
        id: 'acc-001-3',
        name: '纸箱',
        type: 'carton',
        cycle: 'short',
        status: 'in_progress',
        startDate: new Date('2024-01-18'),
        estimatedDuration: 2
      },
      {
        id: 'acc-001-4',
        name: '条码',
        type: 'barcode',
        cycle: 'short',
        status: 'not_started',
        estimatedDuration: 1
      },
      {
        id: 'acc-001-5',
        name: '唛头',
        type: 'label',
        cycle: 'short',
        status: 'not_started',
        estimatedDuration: 1
      }
    ],
    overallProgress: 40, // 2/5 completed
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-20')
  }
];

class ProcurementStore {
  private purchaseRequests: PurchaseRequest[] = mockPurchaseRequests;
  private skus: SKU[] = mockSKUs;
  private suppliers: Supplier[] = mockSuppliers;
  private inventory: InventoryItem[] = mockInventory;
  private orderAllocations: OrderAllocation[] = [];
  private skuFinalizations: SKUFinalization[] = mockSKUFinalizations;
  private qualityChecks: QualityCheck[] = [];
  private shipments: Shipment[] = [];
  private cardProgress: CardProgress[] = mockCardProgress;
  private accessoryProgress: AccessoryProgress[] = mockAccessoryProgress;
  private procurementProgress: ProcurementProgress[] = [];
  private paymentReminders: { [key: string]: Date } = {}; // 催付记录
  private paymentStatus: { [key: string]: { deposit?: boolean, final?: boolean } } = {}; // 付款状态记录
  private paymentReminderDetails: { [key: string]: { deposit?: Date, final?: Date } } = {}; // 详细催付记录
  private cardDeliveryReminders: { [key: string]: Date } = {}; // 纸卡催付记录
  private listeners: Array<() => void> = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  // Purchase Requests
  getPurchaseRequests(
    filters?: FilterOptions,
    sort?: SortOptions,
    pagination?: PaginationOptions
  ): { data: PurchaseRequest[]; total: number } {

    let filtered = [...this.purchaseRequests];

    // Apply filters
    if (filters) {
      if (filters.status?.length) {
        filtered = filtered.filter(pr => filters.status!.includes(pr.status));
      }
      if (filters.type?.length) {
        filtered = filtered.filter(pr => filters.type!.includes(pr.type));
      }
      if (filters.dateRange) {
        filtered = filtered.filter(pr => 
          pr.createdAt >= filters.dateRange!.start && 
          pr.createdAt <= filters.dateRange!.end
        );
      }
      if (filters.supplierId) {
        filtered = filtered.filter(pr => 
          pr.items.some(item => item.supplierId === filters.supplierId)
        );
      }
    }

    // Apply sorting
    if (sort) {
      filtered.sort((a, b) => {
        const aValue = this.getNestedValue(a, sort.field);
        const bValue = this.getNestedValue(b, sort.field);
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return sort.direction === 'asc' ? comparison : -comparison;
      });
    }

    const total = filtered.length;

    // Apply pagination
    if (pagination) {
      const start = (pagination.page - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      filtered = filtered.slice(start, end);
    }

    return { data: filtered, total };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  getPurchaseRequestById(id: string): PurchaseRequest | undefined {
    return this.purchaseRequests.find(pr => pr.id === id);
  }

  createPurchaseRequest(request: Omit<PurchaseRequest, 'id' | 'requestNumber' | 'createdAt' | 'updatedAt'>): PurchaseRequest {

    // 使用新的订单编号生成逻辑
    const requestNumber = generateOrderNumber(request.items);

    const newRequest: PurchaseRequest = {
      ...request,
      id: `pr-${Date.now()}`,
      requestNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('创建新采购申请:', newRequest);

    this.purchaseRequests.push(newRequest);

    this.notify();

    return newRequest;
  }

  updatePurchaseRequest(id: string, updates: Partial<PurchaseRequest>): PurchaseRequest | null {
    const index = this.purchaseRequests.findIndex(pr => pr.id === id);
    if (index === -1) return null;

    const oldStatus = this.purchaseRequests[index].status;
    this.purchaseRequests[index] = {
      ...this.purchaseRequests[index],
      ...updates,
      updatedAt: new Date()
    };

    console.log(`订单 ${id} 状态变更: ${oldStatus} → ${updates.status || oldStatus}`);
    console.log('更新后的订单:', this.purchaseRequests[index]);

    this.notify();
    return this.purchaseRequests[index];
  }

  approvePurchaseRequest(id: string, approverId: string, remarks?: string): boolean {
    const request = this.getPurchaseRequestById(id);
    if (!request) return false;

    // Check if this is first level approval (department manager) or final approval (general manager)
    const approver = this.getCurrentUser();
    if (!approver) return false;

    if (approver.role === 'department_manager') {
      // First level approval
      this.updatePurchaseRequest(id, {
        approvalStatus: 'first_approved',
        status: 'first_approved',
        firstApproverId: approverId,
        firstApprover: approver,
        firstApprovalDate: new Date(),
        firstApprovalRemarks: remarks
      });
    } else if (approver.role === 'general_manager') {
      // Final approval
      this.updatePurchaseRequest(id, {
        approvalStatus: 'approved',
        status: 'approved',
        finalApproverId: approverId,
        finalApprover: approver,
        finalApprovalDate: new Date(),
        finalApprovalRemarks: remarks
      });
    }

    this.notify();
    return true;
  }

  rejectPurchaseRequest(id: string, approverId: string, remarks?: string): boolean {
    const request = this.getPurchaseRequestById(id);
    if (!request) return false;

    const approver = this.getCurrentUser();
    if (!approver) return false;

    if (approver.role === 'department_manager') {
      this.updatePurchaseRequest(id, {
        approvalStatus: 'rejected',
        status: 'rejected',
        firstApproverId: approverId,
        firstApprover: approver,
        firstApprovalDate: new Date(),
        firstApprovalRemarks: remarks
      });
    } else if (approver.role === 'general_manager') {
      this.updatePurchaseRequest(id, {
        approvalStatus: 'rejected',
        status: 'rejected',
        finalApproverId: approverId,
        finalApprover: approver,
        finalApprovalDate: new Date(),
        finalApprovalRemarks: remarks
      });
    }

    // Mark all items as pending
    if (request.items) {
      request.items.forEach(item => {
        item.status = 'pending';
      });
    }

    this.notify();
    return true;
  }

  deletePurchaseRequest(id: string): boolean {
    const index = this.purchaseRequests.findIndex(pr => pr.id === id);
    if (index === -1) return false;

    this.purchaseRequests.splice(index, 1);
    this.notify();
    return true;
  }

  // Order Allocations
  getOrderAllocations(): OrderAllocation[] {
    return [...this.orderAllocations];
  }

  getOrderAllocationById(id: string): OrderAllocation | undefined {
    return this.orderAllocations.find(oa => oa.id === id);
  }

  getOrderAllocationByRequestId(requestId: string): OrderAllocation | undefined {
    return this.orderAllocations.find(oa => oa.purchaseRequestId === requestId);
  }

  createOrderAllocation(allocation: Omit<OrderAllocation, 'id' | 'createdAt' | 'updatedAt'>): OrderAllocation {
    const newAllocation: OrderAllocation = {
      ...allocation,
      id: `oa-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.orderAllocations.push(newAllocation);
    this.notify();
    return newAllocation;
  }

  updateOrderAllocation(id: string, updates: Partial<OrderAllocation>): OrderAllocation | null {
    const index = this.orderAllocations.findIndex(oa => oa.id === id);
    if (index === -1) return null;

    this.orderAllocations[index] = {
      ...this.orderAllocations[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notify();
    return this.orderAllocations[index];
  }

  // 为采购申请创建纸卡进度记录
  createCardProgressForRequest(request: PurchaseRequest): CardProgress[] {
    const newProgressRecords: CardProgress[] = [];

    // 获取订单分配信息以确定采购类型
    const allocation = this.getOrderAllocationByRequestId(request.id);
    const purchaseType = allocation?.type || 'external'; // 默认为厂家包装

    // 为每个SKU创建纸卡进度记录
    request.items.forEach(item => {
      // 检查是否已存在该SKU的纸卡进度记录
      const existingProgress = this.cardProgress.find(cp => 
        cp.purchaseRequestId === request.id && cp.skuId === item.skuId
      );

      if (!existingProgress) {
        // 检查SKU是否已定稿
        const finalization = this.skuFinalizations.find(f => f.skuId === item.skuId);
        const isFinalized = finalization?.isFinalized || false;

        // 获取订单分配信息以确定纸卡类型
        const allocation = this.getOrderAllocationByRequestId(request.id);
        const cardType = allocation?.cardType || 'finished'; // 默认为纸卡成品

        // 根据纸卡类型创建不同的阶段
        const stages = this.createCardStagesByType(cardType, isFinalized);

        // 计算整体进度
        const completedStages = stages.filter(s => s.status === 'completed').length;
        const overallProgress = Math.round((completedStages / stages.length) * 100);
        
        // 确定当前阶段
        const currentStageIndex = stages.findIndex(s => s.status === 'in_progress');
        const currentStage = currentStageIndex !== -1 ? currentStageIndex : completedStages;

        const newProgress: CardProgress = {
          id: `cp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          purchaseRequestId: request.id,
          skuId: item.skuId,
          sku: item.sku,
          isFinalized,
          stages,
          currentStage,
          overallProgress,
          productionQuantity: item.quantity,
          productionAmount: item.totalPrice || 0,
          purchaseQuantity: item.quantity,
          estimatedCompletionDate: this.calculateEstimatedCompletionDate(stages),
          isOverdue: false,
          packagingType: purchaseType,
          cardType: cardType, // 添加纸卡类型字段
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.cardProgress.push(newProgress);
        newProgressRecords.push(newProgress);
      }
    });

    if (newProgressRecords.length > 0) {
      this.notify();
    }

    return newProgressRecords;
  }

  // 根据纸卡类型创建对应的阶段
  private createCardStagesByType(cardType: string, isFinalized: boolean): CardProgressStage[] {
    const baseId = Date.now();
    let stageConfigs: Array<{name: string, duration: number, description?: string, assignee?: string}> = [];

    switch (cardType) {
      case 'finished': // 纸卡成品 - 完整流程
        stageConfigs = [
          { name: '刀线设计', duration: 2, description: '设计产品刀线图纸', assignee: 'card_designer' },
          { name: '文字翻译', duration: 1, description: '翻译产品相关文字内容', assignee: 'card_designer' },
          { name: '国外设计', duration: 3, description: '完成国外版面设计', assignee: 'card_designer' },
          { name: '汇总确认', duration: 1, description: '汇总设计内容并确认', assignee: 'card_designer' },
          { name: '安排打样', duration: 2, description: '安排纸卡打样制作', assignee: 'card_designer' },
          { name: '安排生产', duration: 7, description: '安排纸卡批量生产', assignee: 'card_designer' },
          { name: '寄到公司', duration: 2, description: '纸卡成品寄送到公司', assignee: 'logistics_staff' },
          { name: '寄到工厂', duration: 1, description: '纸卡成品寄送到工厂', assignee: 'logistics_staff' }
        ];
        break;
      case 'design': // 设计稿 - 简化流程
        stageConfigs = [
          { name: '刀线设计', duration: 2, description: '设计产品刀线图纸', assignee: 'card_designer' },
          { name: '文字翻译', duration: 1, description: '翻译产品相关文字内容', assignee: 'card_designer' },
          { name: '国外版面设计', duration: 3, description: '完成国外版面设计', assignee: 'card_designer' },
          { name: '国内设计确认', duration: 1, description: '国内团队确认设计方案', assignee: 'card_designer' },
          { name: '发给工厂', duration: 1, description: '设计稿发送给工厂', assignee: 'card_designer' }
        ];
        break;
      case 'none': // 不需要 - 内部流程
        stageConfigs = [
          { name: '刀线设计', duration: 2, description: '设计产品刀线图纸', assignee: 'card_designer' },
          { name: '文字翻译', duration: 1, description: '翻译产品相关文字内容', assignee: 'card_designer' },
          { name: '国外设计', duration: 3, description: '完成国外版面设计', assignee: 'card_designer' },
          { name: '汇总确认', duration: 1, description: '汇总设计内容并确认', assignee: 'card_designer' },
          { name: '安排打样', duration: 2, description: '安排纸卡打样制作', assignee: 'card_designer' },
          { name: '安排生产', duration: 7, description: '安排纸卡批量生产', assignee: 'card_designer' },
          { name: '寄到公司', duration: 2, description: '纸卡成品寄送到公司', assignee: 'logistics_staff' }
        ];
        break;
      default: // 默认使用纸卡成品流程（向后兼容）
        stageConfigs = [
          { name: '刀线设计', duration: 2, description: '设计产品刀线图纸', assignee: 'card_designer' },
          { name: '文字翻译', duration: 1, description: '翻译产品相关文字内容', assignee: 'card_designer' },
          { name: '国外设计', duration: 3, description: '完成国外版面设计', assignee: 'card_designer' },
          { name: '汇总确认', duration: 1, description: '汇总设计内容并确认', assignee: 'card_designer' },
          { name: '安排打样', duration: 2, description: '安排纸卡打样制作', assignee: 'card_designer' },
          { name: '安排生产', duration: 7, description: '安排纸卡批量生产', assignee: 'card_designer' },
          { name: '寄到公司', duration: 2, description: '纸卡成品寄送到公司', assignee: 'logistics_staff' },
          { name: '寄到工厂', duration: 1, description: '纸卡成品寄送到工厂', assignee: 'logistics_staff' }
        ];
    }

    return stageConfigs.map((config, index) => ({
      id: `stage-${baseId}-${index + 1}`,
      name: config.name,
      description: config.description,
      assigneeRole: config.assignee,
      status: isFinalized && index < 4 ? 'completed' : (index === 0 ? 'in_progress' : 'not_started'),
      estimatedDuration: config.duration,
      order: index + 1,
      completedDate: isFinalized && index < 4 ? new Date() : undefined,
      startDate: index === 0 ? new Date() : undefined
    }));
  }

  // 计算辅料进度的新逻辑
  private calculateAccessoryProgress(accessories: AccessoryItem[]): number {
    let progress = 0;
    
    accessories.forEach(accessory => {
      if (accessory.status === 'completed') {
        switch (accessory.type) {
          case 'blister':  // 泡壳
            progress += 41;
            break;
          case 'tray':     // 中托
            progress += 41;
            break;
          case 'carton':   // 纸箱
            progress += 6;
            break;
          case 'barcode':  // 条码
            progress += 6;
            break;
          case 'label':    // 唛头
            progress += 6;
            break;
        }
      }
    });
    
    return Math.min(progress, 100); // 确保不超过100%
  }

  // 🎯 新增：全局辅料进度计算函数，供组件使用
  calculateAccessoryProgressGlobal(accessories: AccessoryItem[]): number {
    let progress = 0;
    
    accessories.forEach(accessory => {
      if (accessory.status === 'completed') {
        switch (accessory.type) {
          case 'blister':  // 泡壳
            progress += 41;
            break;
          case 'tray':     // 中托
            progress += 41;
            break;
          case 'carton':   // 纸箱
          case 'barcode':  // 条码
          case 'label':    // 唛头
            progress += 6;
            break;
        }
      }
    });
    
    return Math.min(progress, 100); // 确保不超过100%
  }

  // 🎯 新增：为采购申请创建辅料进度记录
  createAccessoryProgressForRequest(request: PurchaseRequest): AccessoryProgress[] {
    // 获取订单分配信息以确定采购类型
    const allocation = this.getOrderAllocationByRequestId(request.id);
    const purchaseType = allocation?.type || 'external';
    
    if (purchaseType !== 'in_house') {
      return [];
    }

    const newProgressRecords: AccessoryProgress[] = [];

    // 为每个SKU创建辅料进度记录
    request.items.forEach(item => {
      // 检查是否已存在该SKU的辅料进度记录
      const existingProgress = this.accessoryProgress.find(ap => 
        ap.purchaseRequestId === request.id && ap.skuId === item.skuId
      );

      if (!existingProgress) {
        // 创建5种标准辅料项目
        const accessories: AccessoryItem[] = [
          {
            id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: '泡壳',
            type: 'blister',
            cycle: 'long',
            status: 'in_progress', // 长周期辅料立即开始
            startDate: new Date(),
            estimatedDuration: 5,
            cost: 0,
            updatedAt: new Date()
          },
          {
            id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: '中托',
            type: 'tray',
            cycle: 'long',
            status: 'in_progress', // 长周期辅料立即开始
            startDate: new Date(),
            estimatedDuration: 4,
            cost: 0,
            updatedAt: new Date()
          },
          {
            id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: '纸箱',
            type: 'carton',
            cycle: 'short',
            status: 'not_started', // 短周期辅料等待开始
            estimatedDuration: 2,
            cost: 0,
            updatedAt: new Date()
          },
          {
            id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: '条码',
            type: 'barcode',
            cycle: 'short',
            status: 'not_started', // 短周期辅料等待开始
            estimatedDuration: 1,
            cost: 0,
            updatedAt: new Date()
          },
          {
            id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: '唛头',
            type: 'label',
            cycle: 'short',
            status: 'not_started', // 短周期辅料等待开始
            estimatedDuration: 1,
            cost: 0,
            updatedAt: new Date()
          }
        ];

        // 计算初始进度：按照新的规则计算
        const overallProgress = this.calculateAccessoryProgress(accessories);

        const newProgress: AccessoryProgress = {
          id: `ap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          purchaseRequestId: request.id,
          skuId: item.skuId,
          sku: item.sku,
          accessories,
          overallProgress,
          purchaseQuantity: item.quantity, // 添加采购数量字段
          totalCost: 0,
          moldCost: 0,
          dieCost: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.accessoryProgress.push(newProgress);
        newProgressRecords.push(newProgress);
      }
    });

    if (newProgressRecords.length > 0) {
      this.notify();
    }

    return newProgressRecords;
  }

  // 🎯 新增：为采购申请创建到货检验记录
  createArrivalInspectionForRequest(request: PurchaseRequest): any[] {
    // 获取订单分配信息以确定采购类型
    const allocation = this.getOrderAllocationByRequestId(request.id);
    const purchaseType = allocation?.type || 'external';
    
    const newInspectionRecords: any[] = [];

    // 为每个SKU创建到货检验记录
    request.items.forEach(item => {
      // 根据采购类型确定产品类型
      const productType = purchaseType === 'in_house' ? 'semi_finished' : 'finished';
      
      const newInspection = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        purchaseRequestId: request.id,
        skuId: item.skuId,
        sku: item.sku,
        purchaseRequestNumber: request.requestNumber,
        purchaseQuantity: item.quantity,
        arrivalQuantity: undefined,
        isArrived: false,
        arrivalDate: undefined,
        inspectionStatus: 'pending' as const,
        inspectionDate: undefined,
        inspectorId: undefined,
        inspector: undefined,
        inspectionPhotos: [],
        inspectionNotes: undefined,
        qualityResult: undefined,
        productType: productType as 'semi_finished' | 'finished',
        procurementProgress: 0,
        cardProgress: 0,
        accessoryProgress: 0,
        remarks: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        item: item
      };

      newInspectionRecords.push(newInspection);
    });

    // 这里我们返回记录，具体的添加到store的逻辑在调用方处理
    return newInspectionRecords;
  }

  // 🎯 新增：自动检查纸卡进度完成状态并联动采购进度
  checkAndUpdateCardProgressCompletion(): void {
    console.log('🔄 开始检查纸卡进度完成状态...');
    
    // 获取所有纸卡进度记录
    const allCardProgress = this.getCardProgress();
    
    // 按订单分组
    const progressByRequest: { [key: string]: CardProgress[] } = {};
    allCardProgress.forEach(progress => {
      if (!progressByRequest[progress.purchaseRequestId]) {
        progressByRequest[progress.purchaseRequestId] = [];
      }
      progressByRequest[progress.purchaseRequestId].push(progress);
    });

    // 检查每个订单的纸卡进度
    Object.entries(progressByRequest).forEach(([requestId, progressList]) => {
      const isAllCompleted = progressList.every(progress => 
        progress.stages.every(stage => stage.status === 'completed')
      );

      if (isAllCompleted) {
        console.log(`✅ 订单 ${requestId} 的纸卡进度已全部完成，触发自动联动`);
        
        // 自动确认纸卡到货，联动采购进度
        this.confirmCardDelivery(requestId);
        
        // 记录自动操作日志
        console.log(`📋 系统自动操作记录:`);
        console.log(`   - 订单ID: ${requestId}`);
        console.log(`   - 操作类型: 自动确认纸卡到货`);
        console.log(`   - 触发条件: 所有纸卡制作流程节点已完成`);
        console.log(`   - 联动结果: 采购进度"纸卡提供"节点已完成`);
        console.log(`   - 操作时间: ${new Date().toLocaleString('zh-CN')}`);
      }
    });
  }

  // 🎯 新增：获取流程节点的责任人角色显示名称
  getStageAssigneeRoleName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'card_designer': '纸卡设计',
      'logistics_staff': '物流专员',
      'production_staff': '生产人员',
      'qc_officer': '质检专员'
    };
    return roleNames[role] || role;
  }

  // 🎯 新增：验证流程节点状态流转规则
  validateStageTransition(progressId: string, stageId: string, newStatus: string): { valid: boolean, message?: string } {
    const progress = this.cardProgress.find(cp => cp.id === progressId);
    if (!progress) {
      return { valid: false, message: '未找到纸卡进度记录' };
    }

    const stage = progress.stages.find(s => s.id === stageId);
    if (!stage) {
      return { valid: false, message: '未找到指定的流程节点' };
    }

    // 检查前置节点是否已完成
    const currentStageIndex = progress.stages.findIndex(s => s.id === stageId);
    if (currentStageIndex > 0 && newStatus === 'completed') {
      for (let i = 0; i < currentStageIndex; i++) {
        const prevStage = progress.stages[i];
        if (prevStage.status !== 'completed') {
          return { 
            valid: false, 
            message: `请先完成前置节点："${prevStage.name}"` 
          };
        }
      }
    }

    return { valid: true };
  }

  // 计算预计完成时间
  private calculateEstimatedCompletionDate(stages: CardProgressStage[]): Date {
    const totalDuration = stages.reduce((sum, stage) => sum + stage.estimatedDuration, 0);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + totalDuration);
    return completionDate;
  }

  // Inventory Management
  getInventory(): InventoryItem[] {
    return [...this.inventory];
  }

  getInventoryBySKU(skuId: string): InventoryItem | undefined {
    return this.inventory.find(inv => inv.skuId === skuId);
  }

  updateInventory(id: string, updates: Partial<InventoryItem>): InventoryItem | null {
    const index = this.inventory.findIndex(inv => inv.id === id);
    if (index === -1) return null;

    this.inventory[index] = {
      ...this.inventory[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notify();
    return this.inventory[index];
  }

  bulkUpdateInventory(inventoryData: Omit<InventoryItem, 'id' | 'updatedAt'>[]): InventoryItem[] {
    const updatedItems: InventoryItem[] = [];

    inventoryData.forEach(data => {
      // Check if inventory item already exists for this SKU
      const existingIndex = this.inventory.findIndex(inv => inv.skuId === data.skuId);
      
      if (existingIndex !== -1) {
        // Update existing item
        this.inventory[existingIndex] = {
          ...this.inventory[existingIndex],
          ...data,
          updatedAt: new Date()
        };
        updatedItems.push(this.inventory[existingIndex]);
      } else {
        // Create new item
        const newItem: InventoryItem = {
          ...data,
          id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          updatedAt: new Date()
        };
        this.inventory.push(newItem);
        updatedItems.push(newItem);
      }
    });

    this.notify();
    return updatedItems;
  }

  deleteInventory(id: string): boolean {
    const index = this.inventory.findIndex(inv => inv.id === id);
    if (index === -1) return false;

    this.inventory.splice(index, 1);
    this.notify();
    return true;
  }

  // SKUs
  getSKUs(): SKU[] {
    return [...this.skus];
  }

  getSKUById(id: string): SKU | undefined {
    return this.skus.find(sku => sku.id === id);
  }

  createSKU(sku: Omit<SKU, 'id'>): SKU {
    const newSKU: SKU = {
      ...sku,
      id: `sku-${Date.now()}`
    };

    this.skus.push(newSKU);
    this.notify();
    return newSKU;
  }

  bulkCreateSKUs(skus: Omit<SKU, 'id'>[]): SKU[] {
    const newSKUs = skus.map(sku => ({
      ...sku,
      id: `sku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    this.skus.push(...newSKUs);
    this.notify();
    return newSKUs;
  }

  updateSKU(id: string, updates: Partial<SKU>): SKU | null {
    const index = this.skus.findIndex(sku => sku.id === id);
    if (index === -1) return null;

    this.skus[index] = {
      ...this.skus[index],
      ...updates
    };

    this.notify();
    return this.skus[index];
  }

  deleteSKU(id: string): boolean {
    const index = this.skus.findIndex(sku => sku.id === id);
    if (index === -1) return false;

    this.skus.splice(index, 1);
    this.notify();
    return true;
  }

  // Suppliers
  getSuppliers(): Supplier[] {
    return [...this.suppliers];
  }

  getSupplierById(id: string): Supplier | undefined {
    return this.suppliers.find(sup => sup.id === id);
  }

  createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
    const newSupplier: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.suppliers.push(newSupplier);
    this.notify();
    return newSupplier;
  }

  updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
    const index = this.suppliers.findIndex(sup => sup.id === id);
    if (index === -1) return null;

    this.suppliers[index] = {
      ...this.suppliers[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notify();
    return this.suppliers[index];
  }

  // Dashboard Stats
  getDashboardStats(): DashboardStats {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalPurchaseRequests: this.purchaseRequests.length,
      pendingApprovals: this.purchaseRequests.filter(pr => pr.approvalStatus === 'pending').length,
      inProgress: this.purchaseRequests.filter(pr => 
        ['approved', 'in_production', 'quality_check'].includes(pr.status)
      ).length,
      completedThisMonth: this.purchaseRequests.filter(pr => 
        pr.status === 'completed' && pr.updatedAt >= thisMonth
      ).length,
      overdueItems: this.purchaseRequests.filter(pr => 
        pr.deadline < now && !['completed', 'shipped'].includes(pr.status)
      ).length,
      qualityIssues: this.qualityChecks.filter(qc => qc.qualityStatus === 'fail').length,
      totalSuppliers: this.suppliers.filter(sup => sup.isActive).length,
      activeShipments: this.shipments.filter(ship => ship.status === 'in_transit').length
    };
  }

  // Quality Checks
  getQualityChecks(): QualityCheck[] {
    return [...this.qualityChecks];
  }

  createQualityCheck(check: Omit<QualityCheck, 'id'>): QualityCheck {
    const newCheck: QualityCheck = {
      ...check,
      id: `qc-${Date.now()}`
    };

    this.qualityChecks.push(newCheck);
    this.notify();
    return newCheck;
  }

  // Shipments
  getShipments(): Shipment[] {
    return [...this.shipments];
  }

  createShipment(shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>): Shipment {
    const newShipment: Shipment = {
      ...shipment,
      id: `ship-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.shipments.push(newShipment);
    this.notify();
    return newShipment;
  }

  // Card Progress
  getCardProgress(): CardProgress[] {
    return this.cardProgress.map(cp => ({
      ...cp,
      stages: [...cp.stages].sort((a, b) => a.order - b.order)
    }));
  }

  getCardProgressByRequestId(requestId: string): CardProgress[] {
    return this.cardProgress.filter(cp => cp.purchaseRequestId === requestId);
  }

  getCardProgressBySKU(skuId: string): CardProgress | undefined {
    return this.cardProgress.find(cp => cp.skuId === skuId);
  }

  createCardProgress(progress: Omit<CardProgress, 'id' | 'createdAt' | 'updatedAt'>): CardProgress {
    const newProgress: CardProgress = {
      ...progress,
      id: `cp-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.cardProgress.push(newProgress);
    this.notify();
    return newProgress;
  }

  updateCardProgress(id: string, updates: Partial<CardProgress>): CardProgress | null {
    const index = this.cardProgress.findIndex(cp => cp.id === id);
    if (index === -1) return null;

    this.cardProgress[index] = {
      ...this.cardProgress[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notify();
    return this.cardProgress[index];
  }

  updateCardProgressStage(progressId: string, stageId: string, updates: Partial<CardProgressStage>): CardProgress | null {
    const progressIndex = this.cardProgress.findIndex(cp => cp.id === progressId);
    if (progressIndex === -1) return null;

    const stageIndex = this.cardProgress[progressIndex].stages.findIndex(s => s.id === stageId);
    if (stageIndex === -1) return null;

    this.cardProgress[progressIndex].stages[stageIndex] = {
      ...this.cardProgress[progressIndex].stages[stageIndex],
      ...updates
    };

    // 如果当前阶段被标记为完成，自动开始下一个阶段
    if (updates.status === 'completed') {
      const nextStageIndex = stageIndex + 1;
      if (nextStageIndex < this.cardProgress[progressIndex].stages.length) {
        const nextStage = this.cardProgress[progressIndex].stages[nextStageIndex];
        if (nextStage.status === 'not_started') {
          this.cardProgress[progressIndex].stages[nextStageIndex] = {
            ...nextStage,
            status: 'in_progress',
            startDate: new Date()
          };
        }
      }
    }

    // 重新计算整体进度
    const completedStages = this.cardProgress[progressIndex].stages.filter(s => s.status === 'completed').length;
    const totalStages = this.cardProgress[progressIndex].stages.length;
    const overallProgress = Math.round((completedStages / totalStages) * 100);

    // 更新当前阶段
    const currentStageIndex = this.cardProgress[progressIndex].stages.findIndex(s => s.status === 'in_progress');
    const currentStage = currentStageIndex !== -1 ? currentStageIndex : completedStages;

    this.cardProgress[progressIndex] = {
      ...this.cardProgress[progressIndex],
      overallProgress,
      currentStage,
      updatedAt: new Date()
    };

    this.notify();
    return this.cardProgress[progressIndex];
  }

  // SKU Finalization
  getSKUFinalizations(): SKUFinalization[] {
    return [...this.skuFinalizations];
  }

  getSKUFinalizationBySKU(skuId: string): SKUFinalization | undefined {
    return this.skuFinalizations.find(f => f.skuId === skuId);
  }

  createSKUFinalization(finalization: Omit<SKUFinalization, 'id' | 'createdAt' | 'updatedAt'>): SKUFinalization {
    const newFinalization: SKUFinalization = {
      ...finalization,
      id: `fin-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.skuFinalizations.push(newFinalization);
    this.notify();
    return newFinalization;
  }

  updateSKUFinalization(id: string, updates: Partial<SKUFinalization>): SKUFinalization | null {
    const index = this.skuFinalizations.findIndex(f => f.id === id);
    if (index === -1) return null;

    this.skuFinalizations[index] = {
      ...this.skuFinalizations[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notify();
    return this.skuFinalizations[index];
  }

  bulkUpdateSKUFinalizations(finalizations: Omit<SKUFinalization, 'id' | 'createdAt' | 'updatedAt'>[]): SKUFinalization[] {
    const updatedFinalizations: SKUFinalization[] = [];

    finalizations.forEach(data => {
      const existingIndex = this.skuFinalizations.findIndex(f => f.skuId === data.skuId);
      
      if (existingIndex !== -1) {
        // Update existing
        this.skuFinalizations[existingIndex] = {
          ...this.skuFinalizations[existingIndex],
          ...data,
          updatedAt: new Date()
        };
        updatedFinalizations.push(this.skuFinalizations[existingIndex]);
      } else {
        // Create new
        const newFinalization: SKUFinalization = {
          ...data,
          id: `fin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.skuFinalizations.push(newFinalization);
        updatedFinalizations.push(newFinalization);
      }
    });

    this.notify();
    return updatedFinalizations;
  }

  // Accessory Progress
  getAccessoryProgress(): AccessoryProgress[] {
    return [...this.accessoryProgress];
  }

  getAccessoryProgressByRequestId(requestId: string): AccessoryProgress[] {
    return this.accessoryProgress.filter(ap => ap.purchaseRequestId === requestId);
  }

  updateAccessoryProgress(id: string, updates: Partial<AccessoryProgress>): AccessoryProgress | null {
    const index = this.accessoryProgress.findIndex(ap => ap.id === id);
    if (index === -1) return null;

    this.accessoryProgress[index] = {
      ...this.accessoryProgress[index],
      ...updates,
      updatedAt: new Date()
    };

    this.notify();
    return this.accessoryProgress[index];
  }

  // Procurement Progress
  getProcurementProgress(): ProcurementProgress[] {
    return [...this.procurementProgress];
  }

  getProcurementProgressByRequestId(requestId: string): ProcurementProgress | undefined {
    return this.procurementProgress.find(pp => pp.purchaseRequestId === requestId);
  }

  createProcurementProgress(requestId: string): ProcurementProgress {
    const existingProgress = this.getProcurementProgressByRequestId(requestId);
    if (existingProgress) {
      return existingProgress;
    }

    // 获取订单分配信息以判断付款方式
    const allocation = this.getOrderAllocationByRequestId(requestId);
    
    const shouldSkipDeposit = this.shouldSkipDepositPayment(requestId);
    const isCreditTerms = allocation?.paymentMethod === 'credit_terms';
    
    // Create standard procurement progress stages
    const stages: ProcurementProgressStage[] = [
      {
        id: `stage-${Date.now()}-1`,
        name: '定金支付',
        status: shouldSkipDeposit ? 'skipped' : 
                (allocation && (allocation.prepaymentAmount || 0) > 0 && allocation.paymentMethod !== 'credit_terms') ? 'in_progress' : 'not_started',
        order: 1,
        completedDate: shouldSkipDeposit ? new Date() : undefined,
        remarks: shouldSkipDeposit ? '账期付款或无需定金，自动跳过' : 
                 (allocation && (allocation.prepaymentAmount || 0) > 0 && allocation.paymentMethod !== 'credit_terms') ? '定金金额>0，进行中' : undefined
      },
      {
        id: `stage-${Date.now()}-2`,
        name: '安排生产',
        status: shouldSkipDeposit ? 'in_progress' : 'not_started',
        order: 2
      },
      {
        id: `stage-${Date.now()}-3`,
        name: '纸卡提供',
        status: 'not_started',
        order: 3
      },
      {
        id: `stage-${Date.now()}-4`,
        name: '包装生产',
        status: 'not_started',
        order: 4
      },
      {
        id: `stage-${Date.now()}-5`,
        name: '尾款支付', 
        status: isCreditTerms ? 'completed' : 'not_started',
        order: 5,
        completedDate: isCreditTerms ? new Date() : undefined,
        remarks: isCreditTerms ? '账期付款，系统自动完成' : undefined
      },
      {
        id: `stage-${Date.now()}-6`,
        name: '安排发货',
        status: 'not_started',
        order: 6
      },
      {
        id: `stage-${Date.now()}-7`,
        name: '收货确认',
        status: 'not_started',
        order: 7
      }
    ];

    // 计算初始进度
    const completedStages = stages.filter(s => s.status === 'completed' || s.status === 'skipped').length;
    const totalStages = stages.length;
    const overallProgress = Math.round((completedStages / totalStages) * 100);

    const newProgress: ProcurementProgress = {
      id: `pp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      purchaseRequestId: requestId,
      stages,
      currentStage: shouldSkipDeposit ? 1 : 0, // 如果跳过定金支付，当前阶段为"安排生产"
      overallProgress,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.procurementProgress.push(newProgress);
    this.notify();
    // 记录操作日志
    if (isCreditTerms) {
      console.log(`✅ 系统自动完成: 订单 ${requestId} 为账期付款，"尾款支付"节点已自动设置为完成状态`);
    }
    
    return newProgress;
  }

  // 判断是否应该跳过定金支付
  private shouldSkipDepositPayment(requestId: string): boolean {
    const allocation = this.getOrderAllocationByRequestId(requestId);
    if (!allocation) return false;

    // 条件1：付款方式为账期
    const isCreditTerms = allocation.paymentMethod === 'credit_terms';
    
    // 条件2：定金金额为0
    const isZeroDeposit = (allocation.prepaymentAmount || 0) === 0;

    console.log(`🔍 定金支付判断 - 订单: ${requestId}`);
    console.log(`   付款方式: ${allocation.paymentMethod} (是否账期: ${isCreditTerms})`);
    console.log(`   定金金额: ${allocation.prepaymentAmount || 0} (是否为0: ${isZeroDeposit})`);
    console.log(`   结果: ${isCreditTerms || isZeroDeposit ? '跳过定金支付' : '需要定金支付'}`);

    return isCreditTerms || isZeroDeposit;
  }

  updateProcurementProgressStage(progressId: string, stageName: string, updates: Partial<ProcurementProgressStage>): ProcurementProgress | null {
    const progressIndex = this.procurementProgress.findIndex(pp => pp.id === progressId);
    if (progressIndex === -1) return null;

    const stageIndex = this.procurementProgress[progressIndex].stages.findIndex(s => s.name === stageName);
    if (stageIndex === -1) return null;

    // Update the stage
    this.procurementProgress[progressIndex].stages[stageIndex] = {
      ...this.procurementProgress[progressIndex].stages[stageIndex],
      ...updates
    };

    // 特殊处理：纸卡提供节点可以独立完成，不触发后续节点
    if (updates.status === 'completed' && stageName !== '纸卡提供') {
      // 找到下一个未完成的节点，将其状态设为"进行中"
      for (let i = stageIndex + 1; i < this.procurementProgress[progressIndex].stages.length; i++) {
        const nextStage = this.procurementProgress[progressIndex].stages[i];
        if (nextStage.status === 'not_started') {
          this.procurementProgress[progressIndex].stages[i] = {
            ...nextStage,
            status: 'in_progress'
          };
          break; // 只激活下一个节点
        }
      }
    } else if (updates.status === 'completed' && stageName === '纸卡提供') {
      console.log(`🎯 纸卡提供节点独立完成，不触发后续节点自动开始`);
    }

    // Recalculate overall progress
    const stages = this.procurementProgress[progressIndex].stages;
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const totalStages = stages.filter(s => s.status !== 'skipped').length;
    const overallProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

    // Update current stage
    const currentStageIndex = stages.findIndex(s => s.status === 'in_progress');
    const currentStage = currentStageIndex !== -1 ? currentStageIndex : completedStages;

    this.procurementProgress[progressIndex] = {
      ...this.procurementProgress[progressIndex],
      overallProgress,
      currentStage,
      updatedAt: new Date()
    };

    this.notify();
    return this.procurementProgress[progressIndex];
  }

  // Auto-create procurement progress when order is allocated
  createProcurementProgressForRequest(request: PurchaseRequest): ProcurementProgress {
    return this.createProcurementProgress(request.id);
  }

  // 催付定金
  addPaymentReminder(requestId: string, paymentType: 'deposit' | 'final' = 'deposit'): void {
    // 记录通用催付时间（保持向后兼容）
    this.paymentReminders[requestId] = new Date();
    
    // 记录详细催付时间
    if (!this.paymentReminderDetails[requestId]) {
      this.paymentReminderDetails[requestId] = {};
    }
    this.paymentReminderDetails[requestId][paymentType] = new Date();
    
    console.log(`📢 催付记录已创建: 订单 ${requestId}, 类型: ${paymentType}, 时间: ${new Date().toLocaleString('zh-CN')}`);
    this.notify();
  }

  // 获取催付记录
  getPaymentReminders(): { [key: string]: Date } {
    return { ...this.paymentReminders };
  }

  // 获取详细催付记录
  getPaymentReminderDetails(): { [key: string]: { deposit?: Date, final?: Date } } {
    return { ...this.paymentReminderDetails };
  }

  // 获取特定类型的催付时间
  getPaymentReminderTime(requestId: string, paymentType: 'deposit' | 'final'): Date | undefined {
    return this.paymentReminderDetails[requestId]?.[paymentType];
  }

  // 确认付款
  confirmPayment(requestId: string, paymentType: 'deposit' | 'final'): void {
    console.log(`💰 开始确认付款: 订单 ${requestId}, 类型: ${paymentType}`);
    
    // 记录付款状态
    if (!this.paymentStatus[requestId]) {
      this.paymentStatus[requestId] = {};
    }
    this.paymentStatus[requestId][paymentType] = true;

    // 联动更新采购进度（账期付款不联动，定金和尾款联动）
    if (paymentType === 'deposit' || paymentType === 'final') {
      const stageName = paymentType === 'deposit' ? '定金支付' : '尾款支付';
      
      // 查找采购进度记录
      const procurementProgress = this.procurementProgress.find(p => p.purchaseRequestId === requestId);
      if (!procurementProgress) {
        console.warn(`未找到订单 ${requestId} 的采购进度记录`);
        return;
      }
      
      // 更新采购进度阶段
      this.updateProcurementProgressStage(procurementProgress.id, stageName, {
        status: 'completed',
        completedDate: new Date()
      });
      
      console.log(`✅ 联动更新采购进度: ${stageName} 节点已完成`);
    }

    // 清除对应的催付记录
    if (this.paymentReminderDetails[requestId]?.[paymentType]) {
      delete this.paymentReminderDetails[requestId][paymentType];
      console.log(`🗑️ 已清除催付记录: 订单 ${requestId}, 类型: ${paymentType}`);
      
      // 如果所有催付记录都已清除，删除整个记录
      if (!this.paymentReminderDetails[requestId]?.deposit && !this.paymentReminderDetails[requestId]?.final) {
        delete this.paymentReminderDetails[requestId];
        delete this.paymentReminders[requestId]; // 同时清除通用催付记录
      }
    }

    console.log(`✅ 付款确认完成: 订单 ${requestId}, ${paymentType === 'deposit' ? '定金' : '尾款'}已确认`);
    this.notify();
  }

  // 确认纸卡到货
  confirmCardDelivery(requestId: string): void {
    console.log(`🎯 开始确认纸卡到货: 订单 ${requestId}`);
    
    const progress = this.getProcurementProgressByRequestId(requestId);
    if (progress) {
      // 特殊处理：纸卡提供节点可以独立完成，无需等待前序节点
      console.log(`📋 找到采购进度记录，准备更新"纸卡提供"节点`);
      
      this.updateProcurementProgressStage(progress.id, '纸卡提供', {
        status: 'completed',
        completedDate: new Date(),
        remarks: `纸卡进度全部完成，系统自动确认纸卡提供 - ${new Date().toLocaleString('zh-CN')}`
      });
      
      console.log(`✅ "纸卡提供"节点已更新为已完成状态`);
    }
    
    // 确认到货后，移除催付记录
    if (this.cardDeliveryReminders[requestId]) {
      delete this.cardDeliveryReminders[requestId];
      console.log(`🗑️ 已清除纸卡催要记录: 订单 ${requestId}`);
    }
    
    this.notify();
  }

  // 催要纸卡
  requestCardDelivery(requestId: string): void {
    console.log(`🔔 采购进度: 催要纸卡 - 订单: ${requestId}`);
    
    // 记录催要时间
    this.cardDeliveryReminders[requestId] = new Date();
    
    console.log(`✅ 纸卡催付记录已保存 - 订单: ${requestId}, 时间: ${this.cardDeliveryReminders[requestId].toLocaleString('zh-CN')}`);
    
    this.notify();
  }

  // 获取纸卡催付记录
  getCardDeliveryReminders(): { [requestId: string]: Date } {
    return { ...this.cardDeliveryReminders };
  }

  // 获取特定订单的纸卡催付时间
  getCardDeliveryReminderTime(requestId: string): Date | undefined {
    return this.cardDeliveryReminders[requestId];
  }

  // 清除纸卡催付记录（当纸卡完成时）
  clearCardDeliveryReminder(requestId: string): void {
    delete this.cardDeliveryReminders[requestId];
    this.notify();
  }

  // 获取付款状态
  getPaymentStatus(): { [key: string]: { deposit?: boolean, final?: boolean } } {
    return { ...this.paymentStatus };
  }

  // 检查是否已付款
  isPaymentConfirmed(requestId: string, paymentType: 'deposit' | 'final' | 'credit_terms'): boolean {
    return this.paymentStatus[requestId]?.[paymentType] || false;
  }

  private getCurrentUser() {
    return authStore.getCurrentUser();
  }
}

// Import authStore to check user roles
import { authStore } from './auth';

// 产品类别前缀映射
const CATEGORY_PREFIX_MAP: { [key: string]: string } = {
  '厨房用品': 'CF',
  '五金用品': 'WJ',
  '相框': 'XK',
  '钟表': 'ZB',
  '镜子': 'JZ',
  '老外货': 'LW',
  '其他': 'QT'
};

// 订单编号计数器（按类别和年份分组）
const orderCounters: { [key: string]: number } = {};

// 生成订单编号的函数
const generateOrderNumber = (items: PurchaseRequestItem[]): string => {
  // 获取主要产品类别（取第一个SKU的类别）
  const primaryCategory = items.length > 0 ? items[0].sku.category : '其他';
  
  // 获取类别前缀
  const prefix = CATEGORY_PREFIX_MAP[primaryCategory] || 'QT';
  
  // 获取当前年份
  const currentYear = new Date().getFullYear();
  
  // 生成计数器键值（类别前缀 + 年份）
  const counterKey = `${prefix}-${currentYear}`;
  
  // 获取或初始化计数器
  if (!orderCounters[counterKey]) {
    orderCounters[counterKey] = 0;
  }
  
  // 递增计数器
  orderCounters[counterKey]++;
  
  // 生成4位数序号
  const sequence = orderCounters[counterKey].toString().padStart(4, '0');
  
  // 返回完整的订单编号
  return `${prefix}-${currentYear}${sequence}`;
};

export const procurementStore = new ProcurementStore();