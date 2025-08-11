import type { ProductionSchedule, ArrivalInspection, PurchaseRequest, OrderAllocation } from '../types';

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'pr-001',
    requestNumber: 'CF-20240001',
    requesterId: '1',
    requester: {
      id: '1',
      name: '张三',
      email: 'zhang.san@company.com',
      role: 'purchasing_officer',
      isActive: true,
      createdAt: new Date('2024-01-01')
    },
    status: 'allocated',
    approvalStatus: 'approved',
    totalAmount: 15000,
    deadline: new Date('2024-08-15'),
    items: [
      {
        id: 'item-001',
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
        quantity: 100,
        unitPrice: 50,
        totalPrice: 5000,
        remarks: '',
        status: 'approved'
      },
      {
        id: 'item-002',
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
        quantity: 50,
        unitPrice: 200,
        totalPrice: 10000,
        remarks: '',
        status: 'approved'
      }
    ],
    createdAt: new Date('2024-07-20'),
    updatedAt: new Date('2024-07-25')
  }
];

export const mockOrderAllocations: OrderAllocation[] = [
  {
    id: 'oa-001',
    purchaseRequestId: 'pr-001',
    type: 'external',
    paymentMethod: 'payment_on_delivery',
    productionDate: new Date('2024-08-01'),
    deliveryDate: new Date('2024-08-15'),
    allocationStatus: 'allocated',
    allocatedBy: '3',
    allocatedAt: new Date('2024-07-25'),
    remarks: '厂家直接包装',
    createdAt: new Date('2024-07-25'),
    updatedAt: new Date('2024-07-25')
  }
];

export const mockProductionSchedules: ProductionSchedule[] = [
  {
    id: 'ps-001',    skuId: 'sku-001',    sku: {      id: 'sku-001',      code: 'KIT-001',      name: '厨房用品A',      englishName: 'Kitchen Product A',      category: '厨房用品',      identificationCode: 'ID001',      imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'    },    purchaseRequestId: 'pr-001',    purchaseRequestNumber: 'CF-20240001',    scheduledDate: new Date('2024-08-01'),    plannedQuantity: 100,    material: '304不锈钢',    packagingMethod: '纸盒包装',    machine: '包装机A',    status: 'pending' as const,    createdAt: new Date('2024-07-20'),    updatedAt: new Date('2024-07-20')  },  {    id: 'ps-002',    skuId: 'sku-002',    sku: {      id: 'sku-002',      code: 'HAR-001',      name: '五金用品B',      englishName: 'Hardware Product B',      category: '五金用品',      identificationCode: 'ID002',      imageUrl: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg'    },    purchaseRequestId: 'pr-001',    purchaseRequestNumber: 'CF-20240001',    scheduledDate: new Date('2024-08-02'),    plannedQuantity: 50,    material: '铝合金',    packagingMethod: '塑料包装',    machine: '包装机B',    status: 'scheduled' as const,    startDate: new Date('2024-08-02'),    operator: {      id: '4',      name: '赵六',      email: 'zhao.liu@company.com',      role: 'production_staff',      isActive: true,      createdAt: new Date('2024-01-01')    },    createdAt: new Date('2024-07-21'),    updatedAt: new Date('2024-07-25')  }];export const mockArrivalInspections: ArrivalInspection[] = [  {    id: 'ai-001',    purchaseRequestId: 'pr-001',    skuId: 'sku-001',    sku: {      id: 'sku-001',      code: 'KIT-001',      name: '厨房用品A',      englishName: 'Kitchen Product A',      category: '厨房用品',      identificationCode: 'ID001',      imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'    },    purchaseRequestNumber: 'WJ-20250118001',    purchaseQuantity: 100,    arrivalQuantity: 0,    isArrived: false,    arrivalDate: new Date('2024-07-25'),    inspectionStatus: 'pending',    inspectionPhotos: [],    qualityResult: undefined,    productType: 'semi_finished',    procurementProgress: 50,    cardProgress: 30,    accessoryProgress: 40,    createdAt: new Date('2024-07-25'),    updatedAt: new Date('2024-07-25')  },  {    id: 'ai-002',    purchaseRequestId: 'pr-001',    skuId: 'sku-002',    sku: {      id: 'sku-002',      code: 'HAR-001',      name: '五金用品B',      englishName: 'Hardware Product B',      category: '五金用品',      identificationCode: 'ID002',      imageUrl: 'https://images.pexels.com/photos/163036/mario-luigi-yoschi-figures-163036.jpeg'    },    purchaseRequestNumber: 'WJ-20250118001',    purchaseQuantity: 50,    arrivalQuantity: 0,    isArrived: false,    arrivalDate: new Date('2024-07-25'),    inspectionStatus: 'pending',    inspectionPhotos: [],    qualityResult: undefined,    productType: 'semi_finished',    procurementProgress: 60,    cardProgress: 45,    accessoryProgress: 55,    createdAt: new Date('2024-07-25'),    updatedAt: new Date('2024-07-25')  },  {    id: 'ai-003',    purchaseRequestId: 'pr-001',    skuId: 'sku-003',    sku: {      id: 'sku-003',      code: 'FRA-001',      name: '相框C',      englishName: 'Photo Frame C',      category: '相框',      identificationCode: 'ID003',      imageUrl: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'    },    purchaseRequestNumber: 'WJ-20250118002',    purchaseQuantity: 200,    arrivalQuantity: 0,    isArrived: false,    arrivalDate: new Date('2024-07-26'),    inspectionStatus: 'pending',    inspectionPhotos: [],    qualityResult: undefined,    productType: 'finished',    procurementProgress: 80,    cardProgress: 70,    accessoryProgress: 75,    createdAt: new Date('2024-07-26'),    updatedAt: new Date('2024-07-26')  }];