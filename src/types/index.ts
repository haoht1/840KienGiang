export type DocumentType = 'DELIVERY_NOTE' | 'PURCHASE_TABLE';

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface StoreProfile {
  id: string;
  name: string;
  address: string;
  phone: string;
  businessField: string;
  logoUrl?: string;
  bankName?: string;
  bankAccount?: string;
  bankOwner?: string;
  taxId?: string;
  representative?: string;
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  cccd?: string;
  type: 'buyer' | 'seller' | 'both';
  businessField?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string; // e.g., 'Vật tư nông nghiệp', 'Phân bón', 'Tổ yến', etc.
  type: 'SALES' | 'PURCHASE'; // SALES for Phiếu giao hàng, PURCHASE for Bảng kê thu mua
  defaultUnit: string;
  defaultPrice: number;
  minPrice?: number;
  maxPrice?: number;
  note?: string;
  isCustom?: boolean;
}

export interface DeliveryItemRow {
  id: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  note?: string;
}

export interface DeliveryNote {
  id: string;
  code: string;
  date: string; // YYYY-MM-DD
  store: StoreProfile;
  customer: {
    id?: string;
    name: string;
    address: string;
    phone: string;
    notes?: string;
  };
  businessCategory: string;
  items: DeliveryItemRow[];
  desiredTotal?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  totalInWords: string;
  generalNotes?: string;
  isDraft: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItemRow {
  id: string;
  date: string; // YYYY-MM-DD
  sellerName: string;
  sellerAddress: string;
  sellerCccd: string;
  sellerPhone?: string;
  productName: string;
  quantityKg: number;
  unitPrice: number;
  totalAmount: number;
  isPaidReceived: boolean; // BÊN BÁN KÝ XÁC NHẬN ĐÃ NHẬN ĐỦ TIỀN
  note?: string;
}

export interface PurchaseTableDoc {
  id: string;
  code: string;
  date: string; // YYYY-MM-DD
  buyerName: string; // Tên người thu mua
  buyerAddress: string; // Địa chỉ người thu mua
  purchaseLocation: string; // Địa chỉ nơi tổ chức thu mua
  buyerOfficer: string; // Người phụ trách thu mua
  businessCategory: string; // e.g., 'Thu mua tổ yến', 'Thu mua hải sản', 'Thu mua lúa'
  items: PurchaseItemRow[];
  declaredTotal?: number; // TỔNG GIÁ TRỊ THU MUA THEO CHỨNG TỪ
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  totalInWords: string;
  generalNotes?: string;
  isDraft: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  stores: StoreProfile[];
  customers: Customer[];
  products: ProductItem[];
  deliveryNotes: DeliveryNote[];
  purchaseTables: PurchaseTableDoc[];
  settings?: {
    isDemoMode: boolean;
    defaultStoreId?: string;
    autoPrintPrompt: boolean;
  };
}
