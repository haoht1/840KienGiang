import { StoreProfile, Customer, ProductItem, DeliveryNote, PurchaseTableDoc, BackupData } from '../types';
import { INITIAL_PRODUCTS, INITIAL_STORE, INITIAL_CUSTOMERS } from '../data/defaultCatalog';
import { generateDocCode } from './formatters';
import { numberToVietnameseWords } from './numberToVietnameseWords';

const DB_NAME = 'TroLyChungTuDB_v2';
const DB_VERSION = 2;

const STORES = {
  STORES: 'stores',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  DELIVERY_NOTES: 'deliveryNotes',
  PURCHASE_TABLES: 'purchaseTables',
  SETTINGS: 'settings',
};

// Open IndexedDB safely with a 600ms timeout to prevent iframe hangs
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let settled = false;

    // Timeout guard: if IndexedDB hangs in an iframe, fall back to localStorage
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 600);

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORES.STORES)) {
            db.createObjectStore(STORES.STORES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
            db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
            db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.DELIVERY_NOTES)) {
            db.createObjectStore(STORES.DELIVERY_NOTES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.PURCHASE_TABLES)) {
            db.createObjectStore(STORES.PURCHASE_TABLES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
            db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
          }
        } catch (e) {
          console.warn('IDB upgrade error', e);
        }
      };

      request.onsuccess = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(request.result);
        }
      };

      request.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(null);
        }
      };

      request.onblocked = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(null);
        }
      };
    } catch (e) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      }
    }
  });
}

// LocalStorage Helper
function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
    const item = localStorage.getItem(`troly_${key}`);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    return Array.isArray(defaultValue) && !Array.isArray(parsed) ? defaultValue : parsed;
  } catch (e) {
    return defaultValue;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(`troly_${key}`, JSON.stringify(value));
    }
  } catch (e) {
    console.warn('LocalStorage write error', e);
  }
}

// Generic get all from object store with synchronous LS fast-path & IDB sync
async function getAllFromStore<T>(storeName: string, fallbackLsKey: string, initialData: T[]): Promise<T[]> {
  const cached = getLocalStorage<T[]>(fallbackLsKey, []);
  if (cached && cached.length > 0) {
    return cached;
  }

  try {
    const db = await openDB();
    if (!db) {
      setLocalStorage(fallbackLsKey, initialData);
      return initialData;
    }

    return new Promise((resolve) => {
      try {
        if (!db.objectStoreNames.contains(storeName)) {
          setLocalStorage(fallbackLsKey, initialData);
          resolve(initialData);
          return;
        }

        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          let results = request.result as T[];
          if (!results || results.length === 0) {
            results = initialData;
            saveAllToStore(storeName, fallbackLsKey, initialData);
          }
          setLocalStorage(fallbackLsKey, results);
          resolve(results);
        };
        request.onerror = () => {
          setLocalStorage(fallbackLsKey, initialData);
          resolve(initialData);
        };
      } catch (err) {
        setLocalStorage(fallbackLsKey, initialData);
        resolve(initialData);
      }
    });
  } catch (e) {
    setLocalStorage(fallbackLsKey, initialData);
    return initialData;
  }
}

// Generic put into store
async function putIntoStore<T extends { id?: string; key?: string }>(storeName: string, fallbackLsKey: string, item: T): Promise<void> {
  // Always update localStorage first for instantaneous sync
  const list = getLocalStorage<T[]>(fallbackLsKey, []);
  const idx = list.findIndex((x) => (x.id && x.id === item.id) || (x.key && x.key === item.key));
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.unshift(item);
  }
  setLocalStorage(fallbackLsKey, list);

  // Background IDB sync
  try {
    const db = await openDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.put(item);
    }
  } catch (e) {
    // ignore
  }
}

// Generic delete from store
async function deleteFromStore(storeName: string, fallbackLsKey: string, id: string): Promise<void> {
  const list = getLocalStorage<{ id: string }[]>(fallbackLsKey, []);
  const filtered = list.filter((x) => x.id !== id);
  setLocalStorage(fallbackLsKey, filtered);

  try {
    const db = await openDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.delete(id);
    }
  } catch (e) {
    // ignore
  }
}

// Save all array to store
async function saveAllToStore<T>(storeName: string, fallbackLsKey: string, items: T[]): Promise<void> {
  setLocalStorage(fallbackLsKey, items);
  try {
    const db = await openDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();
      items.forEach((item) => {
        try {
          store.put(item);
        } catch (e) {
          // ignore
        }
      });
    }
  } catch (e) {
    // ignore
  }
}

// ================= API METHODS =================

// Stores
export async function getStores(): Promise<StoreProfile[]> {
  const stores = await getAllFromStore<StoreProfile>(STORES.STORES, 'stores', [INITIAL_STORE]);
  return stores && stores.length > 0 ? stores : [INITIAL_STORE];
}

export async function saveStore(store: StoreProfile): Promise<void> {
  await putIntoStore<StoreProfile>(STORES.STORES, 'stores', store);
}

export async function getDefaultStore(): Promise<StoreProfile> {
  const stores = await getStores();
  return stores.find((s) => s.isDefault) || stores[0] || INITIAL_STORE;
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
  const list = await getAllFromStore<Customer>(STORES.CUSTOMERS, 'customers', INITIAL_CUSTOMERS);
  return list && list.length > 0 ? list : INITIAL_CUSTOMERS;
}

export async function saveCustomer(customer: Customer): Promise<void> {
  await putIntoStore<Customer>(STORES.CUSTOMERS, 'customers', customer);
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteFromStore(STORES.CUSTOMERS, 'customers', id);
}

// Products
export async function getProducts(): Promise<ProductItem[]> {
  const list = await getAllFromStore<ProductItem>(STORES.PRODUCTS, 'products', INITIAL_PRODUCTS);
  return list && list.length > 0 ? list : INITIAL_PRODUCTS;
}

export async function saveProduct(product: ProductItem): Promise<void> {
  await putIntoStore<ProductItem>(STORES.PRODUCTS, 'products', product);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteFromStore(STORES.PRODUCTS, 'products', id);
}

// Delivery Notes
export async function getDeliveryNotes(): Promise<DeliveryNote[]> {
  const list = await getAllFromStore<DeliveryNote>(STORES.DELIVERY_NOTES, 'delivery_notes', getSampleDeliveryNotes());
  return list && list.length > 0 ? list : getSampleDeliveryNotes();
}

export async function saveDeliveryNote(note: DeliveryNote): Promise<void> {
  await putIntoStore<DeliveryNote>(STORES.DELIVERY_NOTES, 'delivery_notes', note);
}

export async function deleteDeliveryNote(id: string): Promise<void> {
  await deleteFromStore(STORES.DELIVERY_NOTES, 'delivery_notes', id);
}

// Purchase Tables
export async function getPurchaseTables(): Promise<PurchaseTableDoc[]> {
  const list = await getAllFromStore<PurchaseTableDoc>(STORES.PURCHASE_TABLES, 'purchase_tables', getSamplePurchaseTables());
  return list && list.length > 0 ? list : getSamplePurchaseTables();
}

export async function savePurchaseTable(table: PurchaseTableDoc): Promise<void> {
  await putIntoStore<PurchaseTableDoc>(STORES.PURCHASE_TABLES, 'purchase_tables', table);
}

export async function deletePurchaseTable(id: string): Promise<void> {
  await deleteFromStore(STORES.PURCHASE_TABLES, 'purchase_tables', id);
}

// Settings
export interface AppSettings {
  isDemoMode: boolean;
  defaultStoreId?: string;
  autoPrintPrompt: boolean;
}

export async function getSettings(): Promise<AppSettings> {
  const def: AppSettings = { isDemoMode: false, autoPrintPrompt: false };
  return getLocalStorage<AppSettings>('settings_app', def);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  setLocalStorage('settings_app', settings);
}

// Export All JSON
export async function exportAllJSON(): Promise<BackupData> {
  const [stores, customers, products, deliveryNotes, purchaseTables, settings] = await Promise.all([
    getStores(),
    getCustomers(),
    getProducts(),
    getDeliveryNotes(),
    getPurchaseTables(),
    getSettings(),
  ]);

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    stores: stores || [],
    customers: customers || [],
    products: products || [],
    deliveryNotes: deliveryNotes || [],
    purchaseTables: purchaseTables || [],
    settings,
  };
}

// Import JSON
export async function importJSON(data: BackupData, mode: 'merge' | 'replace'): Promise<{ success: boolean; message: string }> {
  if (!data || typeof data !== 'object') {
    throw new Error('Định dạng tệp sao lưu không hợp lệ.');
  }

  if (mode === 'replace') {
    if (data.stores) await saveAllToStore(STORES.STORES, 'stores', data.stores);
    if (data.customers) await saveAllToStore(STORES.CUSTOMERS, 'customers', data.customers);
    if (data.products) await saveAllToStore(STORES.PRODUCTS, 'products', data.products);
    if (data.deliveryNotes) await saveAllToStore(STORES.DELIVERY_NOTES, 'delivery_notes', data.deliveryNotes);
    if (data.purchaseTables) await saveAllToStore(STORES.PURCHASE_TABLES, 'purchase_tables', data.purchaseTables);
    if (data.settings) await saveSettings(data.settings);
    return { success: true, message: 'Đã khôi phục và thay thế toàn bộ dữ liệu thành công.' };
  } else {
    const [curStores, curCustomers, curProducts, curDelivery, curPurchase] = await Promise.all([
      getStores(),
      getCustomers(),
      getProducts(),
      getDeliveryNotes(),
      getPurchaseTables(),
    ]);

    const mergeById = <T extends { id: string }>(current: T[] = [], incoming: T[] = []) => {
      const map = new Map<string, T>();
      current.forEach((item) => map.set(item.id, item));
      incoming.forEach((item) => map.set(item.id, item));
      return Array.from(map.values());
    };

    if (data.stores) await saveAllToStore(STORES.STORES, 'stores', mergeById(curStores, data.stores));
    if (data.customers) await saveAllToStore(STORES.CUSTOMERS, 'customers', mergeById(curCustomers, data.customers));
    if (data.products) await saveAllToStore(STORES.PRODUCTS, 'products', mergeById(curProducts, data.products));
    if (data.deliveryNotes) await saveAllToStore(STORES.DELIVERY_NOTES, 'delivery_notes', mergeById(curDelivery, data.deliveryNotes));
    if (data.purchaseTables) await saveAllToStore(STORES.PURCHASE_TABLES, 'purchase_tables', mergeById(curPurchase, data.purchaseTables));

    return { success: true, message: 'Đã nhập bổ sung dữ liệu thành công không mất dữ liệu cũ.' };
  }
}

// Reset Database to Initial
export async function resetDatabaseToDefault(): Promise<void> {
  await saveAllToStore(STORES.STORES, 'stores', [INITIAL_STORE]);
  await saveAllToStore(STORES.CUSTOMERS, 'customers', INITIAL_CUSTOMERS);
  await saveAllToStore(STORES.PRODUCTS, 'products', INITIAL_PRODUCTS);
  await saveAllToStore(STORES.DELIVERY_NOTES, 'delivery_notes', getSampleDeliveryNotes());
  await saveAllToStore(STORES.PURCHASE_TABLES, 'purchase_tables', getSamplePurchaseTables());
  await saveSettings({ isDemoMode: false, autoPrintPrompt: false });
}

// Sample Seed Delivery Notes
function getSampleDeliveryNotes(): DeliveryNote[] {
  const total = 922665000;
  const paid = 922665000;
  return [
    {
      id: 'demo-pgh-1',
      code: 'PGH-20261112-001',
      date: '2026-11-12',
      store: INITIAL_STORE,
      customer: {
        id: 'cust-1',
        name: 'Nguyễn Thị Thu Hà',
        address: 'Ấp Vĩnh Hòa, Xã Hòa Thuận, Huyện Giồng Riềng, Kiên Giang',
        phone: '0908 123 456',
        notes: 'Giao tận kho ruộng mẫu lớn',
      },
      businessCategory: 'Vật tư nông nghiệp',
      items: [
        { id: 'item-1', productName: 'Phân Ure', unit: 'Bao 50kg', quantity: 350, unitPrice: 580000, amount: 203000000 },
        { id: 'item-2', productName: 'Phân DAP', unit: 'Bao 50kg', quantity: 280, unitPrice: 950000, amount: 266000000 },
        { id: 'item-3', productName: 'Phân NPK 20-20-15', unit: 'Bao 50kg', quantity: 250, unitPrice: 890000, amount: 222500000 },
        { id: 'item-4', productName: 'Phân bón lá', unit: 'Can 5L', quantity: 150, unitPrice: 320000, amount: 48000000 },
        { id: 'item-5', productName: 'Thuốc trừ sâu', unit: 'Chai', quantity: 420, unitPrice: 125000, amount: 52500000 },
        { id: 'item-6', productName: 'Thuốc diệt ốc', unit: 'Gói 1kg', quantity: 380, unitPrice: 75000, amount: 28500000 },
        { id: 'item-7', productName: 'Hạt giống lúa', unit: 'Bao 20kg', quantity: 243, unitPrice: 420000, amount: 102060000 },
        { id: 'item-8', productName: 'Dây tưới nhỏ giọt', unit: 'Cuộn 500m', quantity: 1, unitPrice: 105000, amount: 105000 },
      ],
      desiredTotal: total,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: 0,
      paymentStatus: 'PAID',
      totalInWords: numberToVietnameseWords(total),
      generalNotes: 'Đã kiểm đếm đủ số lượng bao bì, đóng gói nguyên đai nguyên kiện.',
      isDraft: false,
      isDemo: true,
      createdAt: '2026-11-12T08:30:00.000Z',
      updatedAt: '2026-11-12T08:30:00.000Z',
    },
    {
      id: 'demo-pgh-2',
      code: 'PGH-20261111-002',
      date: '2026-11-11',
      store: INITIAL_STORE,
      customer: {
        id: 'cust-2',
        name: 'Lê Văn Sang',
        address: 'Khu phố 3, Phường Vĩnh Lạc, TP. Rạch Giá, Kiên Giang',
        phone: '0919 765 432',
        notes: 'Công trình nhà phố Lô B15',
      },
      businessCategory: 'Vật liệu xây dựng',
      items: [
        { id: 'item-vl-1', productName: 'Xi măng Hà Tiên', unit: 'Bao 50kg', quantity: 200, unitPrice: 92000, amount: 18400000 },
        { id: 'item-vl-2', productName: 'Sắt thép xây dựng', unit: 'Cây (11.7m)', quantity: 80, unitPrice: 165000, amount: 13200000 },
        { id: 'item-vl-3', productName: 'Cát xây dựng', unit: 'Khối (m³)', quantity: 15, unitPrice: 320000, amount: 4800000 },
        { id: 'item-vl-4', productName: 'Đá 1x2', unit: 'Khối (m³)', quantity: 20, unitPrice: 380000, amount: 7600000 },
      ],
      desiredTotal: 44000000,
      totalAmount: 44000000,
      paidAmount: 25000000,
      remainingAmount: 19000000,
      paymentStatus: 'PARTIAL',
      totalInWords: numberToVietnameseWords(44000000),
      generalNotes: 'Bên mua đã ứng trước 25 triệu đồng, phần còn lại thanh toán sau khi đổ sàn.',
      isDraft: false,
      isDemo: true,
      createdAt: '2026-11-11T14:15:00.000Z',
      updatedAt: '2026-11-11T14:15:00.000Z',
    },
  ];
}

// Sample Seed Purchase Tables
function getSamplePurchaseTables(): PurchaseTableDoc[] {
  const total = 1450000000;
  return [
    {
      id: 'demo-bkm-1',
      code: 'BKM-20261112-001',
      date: '2026-11-12',
      buyerName: 'Cơ sở Thu Mua & Chế Biến Thủy Nông Sản Kiên Giang',
      buyerAddress: 'Khu công nghiệp Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang',
      purchaseLocation: 'Trạm Cân Thu Mua Tân Hiệp, Quốc Lộ 80, Kiên Giang',
      buyerOfficer: 'Nguyễn Văn An (Giám đốc)',
      businessCategory: 'Thu mua lúa',
      items: [
        {
          id: 'row-lua-1',
          date: '2026-11-12',
          sellerName: 'Phạm Hồng Thái',
          sellerAddress: 'Ấp Kênh 7, Xã Thạnh Đông A, Huyện Tân Hiệp, Kiên Giang',
          sellerCccd: '091080003322',
          sellerPhone: '0939 666 999',
          productName: 'Lúa tươi ST25',
          quantityKg: 65000,
          unitPrice: 9400,
          totalAmount: 611000000,
          isPaidReceived: true,
        },
        {
          id: 'row-lua-2',
          date: '2026-11-12',
          sellerName: 'Phạm Hồng Thái',
          sellerAddress: 'Ấp Kênh 7, Xã Thạnh Đông A, Huyện Tân Hiệp, Kiên Giang',
          sellerCccd: '091080003322',
          sellerPhone: '0939 666 999',
          productName: 'Lúa tươi Đài Thơm 8',
          quantityKg: 50000,
          unitPrice: 8200,
          totalAmount: 410000000,
          isPaidReceived: true,
        },
        {
          id: 'row-lua-3',
          date: '2026-11-12',
          sellerName: 'Nguyễn Văn Điền',
          sellerAddress: 'Ấp Tân Hưng, Xã Mỹ Lâm, Huyện Hòn Đất, Kiên Giang',
          sellerCccd: '091079001155',
          sellerPhone: '0912 333 444',
          productName: 'Lúa tươi OM18',
          quantityKg: 53000,
          unitPrice: 8100,
          totalAmount: 429000000,
          isPaidReceived: true,
        },
      ],
      declaredTotal: total,
      totalAmount: total,
      paidAmount: total,
      remainingAmount: 0,
      paymentStatus: 'PAID',
      totalInWords: numberToVietnameseWords(total),
      generalNotes: 'Bảng kê mua lúa trực tiếp của nông dân sản xuất không có hóa đơn.',
      isDraft: false,
      isDemo: true,
      createdAt: '2026-11-12T10:00:00.000Z',
      updatedAt: '2026-11-12T10:00:00.000Z',
    },
    {
      id: 'demo-bkm-2',
      code: 'BKM-20261110-002',
      date: '2026-11-10',
      buyerName: 'Công Ty TNHH Yến Sào Nam Bộ',
      buyerAddress: 'Số 45 Trần Phú, TP. Rạch Giá, Tỉnh Kiên Giang',
      purchaseLocation: 'Tại nhà yến xã Thổ Sơn, Hòn Đất, Kiên Giang',
      buyerOfficer: 'Trần Thanh Phong',
      businessCategory: 'Thu mua tổ yến',
      items: [
        {
          id: 'row-yen-1',
          date: '2026-11-10',
          sellerName: 'Trần Minh Trí',
          sellerAddress: 'Xã Thổ Sơn, Huyện Hòn Đất, Tỉnh Kiên Giang',
          sellerCccd: '091085002468',
          sellerPhone: '0977 444 888',
          productName: 'Tổ yến thô loại 1',
          quantityKg: 8.5,
          unitPrice: 28000000,
          totalAmount: 238000000,
          isPaidReceived: true,
        },
        {
          id: 'row-yen-2',
          date: '2026-11-10',
          sellerName: 'Trần Minh Trí',
          sellerAddress: 'Xã Thổ Sơn, Huyện Hòn Đất, Tỉnh Kiên Giang',
          sellerCccd: '091085002468',
          sellerPhone: '0977 444 888',
          productName: 'Tổ yến thô chân yến',
          quantityKg: 3.2,
          unitPrice: 18000000,
          totalAmount: 57600000,
          isPaidReceived: true,
        },
      ],
      declaredTotal: 295600000,
      totalAmount: 295600000,
      paidAmount: 295600000,
      remainingAmount: 0,
      paymentStatus: 'PAID',
      totalInWords: numberToVietnameseWords(295600000),
      generalNotes: 'Yến thu hái vụ cuối mùa mưa, độ ẩm tiêu chuẩn.',
      isDraft: false,
      isDemo: true,
      createdAt: '2026-11-10T16:20:00.000Z',
      updatedAt: '2026-11-10T16:20:00.000Z',
    },
  ];
}
