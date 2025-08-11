// import { create } from 'zustand';

export interface QualityControlRecord {
  id: string;
  purchaseRequestNumber: string;
  skuId: string;
  sku: any;
  expectedQuantity: number;
  receivedQuantity: number;
  inspectionStatus: 'pending' | 'completed';
  inspectionDate: Date | null;
  inspectorId: string | null;
  inspector: any;
  packageCount: number;
  totalPieces: number;
  piecesPerUnit: number;
  boxLength: number;
  boxWidth: number;
  boxHeight: number;
  unitWeight: number;
  totalQuantity: number | null;
  boxVolume: number | null;
  totalVolume: number | null;
  totalWeight: number | null;
  remarks: string;
  createdAt: Date;
  updatedAt: Date;
  // 发货相关字段
  status?: 'pending_shipment' | 'pre_shipment' | 'shipped';
  shipmentQuantity?: number;
  shipmentTotalQuantity?: number;
  shipmentTotalVolume?: number;
  shipmentTotalWeight?: number;
}
// ...existing code...

// 已废弃，全部迁移到全局store