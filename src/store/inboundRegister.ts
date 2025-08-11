import { create } from 'zustand';

export interface InboundRegisterRecord {
  id: string;
  purchaseRequestNumber: string;
  skuId: string;
  sku: any;
  productName: string;
  identifier: string;
  image?: string;
  expectedQuantity: number;
  receivedQuantity: number;
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
  status: 'pending' | 'completed';
  registerDate: Date | null;
  registerUserId: string | null;
  registerUser: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface InboundRegisterState {
  records: InboundRegisterRecord[];
  addRecord: (record: InboundRegisterRecord) => void;
  updateRecord: (id: string, updates: Partial<InboundRegisterRecord>) => void;
  setRecords: (records: InboundRegisterRecord[]) => void;
  clear: () => void;
}

export const useInboundRegisterStore = create<InboundRegisterState>((set) => ({
  records: [],
  addRecord: (record: InboundRegisterRecord) =>
    set((state) => {
      if (
        state.records.some(
          (r) =>
            r.purchaseRequestNumber === record.purchaseRequestNumber &&
            r.skuId === record.skuId
        )
      ) {
        return state;
      }
      return { records: [...state.records, record] };
    }),
  updateRecord: (id: string, updates: Partial<InboundRegisterRecord>) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
      ),
    })),
  setRecords: (records: InboundRegisterRecord[]) => set(() => ({ records })),
  clear: () => set(() => ({ records: [] })),
}));
