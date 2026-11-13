import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Save,
  Check,
  Building,
  User,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ListPlus,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { DeliveryNote, DeliveryItemRow, StoreProfile, Customer, ProductItem } from '../types';
import { DEFAULT_SALES_CATEGORIES } from '../data/defaultCatalog';
import {
  formatCurrency,
  formatNumber,
  digitsOnly,
  formatThousands,
  parseVndInput,
  parseFormattedNumber,
  generateDocCode,
} from '../utils/formatters';
import { numberToVietnameseWords } from '../utils/numberToVietnameseWords';
import { getStores, getCustomers, getProducts, saveDeliveryNote, saveCustomer } from '../utils/storage';
import { exportElementToPdf, exportElementToPng, getDeliveryFilename } from '../utils/exportUtils';
import { A4PrintDeliveryNote } from './A4PrintDeliveryNote';

interface Props {
  initialNote?: DeliveryNote | null;
  onPreview: (note: DeliveryNote) => void;
  onSaveSuccess: () => void;
}

export const DeliveryNoteEditor: React.FC<Props> = ({
  initialNote,
  onPreview,
  onSaveSuccess,
}) => {
  // Store & Customer databases
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);

  // Selected Store
  const [selectedStore, setSelectedStore] = useState<StoreProfile | null>(null);

  // Form Fields
  const [docCode] = useState<string>(initialNote?.code || generateDocCode('PGH'));
  const [docDate, setDocDate] = useState<string>(
    initialNote?.date || new Date().toISOString().split('T')[0]
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialNote?.businessCategory || DEFAULT_SALES_CATEGORIES[0]
  );

  // Customer Fields
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(initialNote?.customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(initialNote?.customer?.phone || '');
  const [customerAddress, setCustomerAddress] = useState<string>(initialNote?.customer?.address || '');
  const [customerNotes, setCustomerNotes] = useState<string>(initialNote?.customer?.notes || '');
  const [saveCustomerPrompt, setSaveCustomerPrompt] = useState<boolean>(false);

  // Items
  const [items, setItems] = useState<DeliveryItemRow[]>(
    initialNote?.items && initialNote.items.length > 0
      ? initialNote.items
      : [
          {
            id: 'item-1',
            productName: '',
            unit: 'Chai',
            quantity: 1,
            unitPrice: 0,
            amount: 0,
          },
        ]
  );

  // Store raw digit strings for VNĐ inputs so typing never jumps or clears
  const [desiredTotalDigits, setDesiredTotalDigits] = useState<string>(
    initialNote?.desiredTotal ? digitsOnly(Math.round(initialNote.desiredTotal)) : ''
  );
  const [paidAmountDigits, setPaidAmountDigits] = useState<string>(
    initialNote?.paidAmount !== undefined ? digitsOnly(Math.round(initialNote.paidAmount)) : ''
  );
  const [generalNotes, setGeneralNotes] = useState<string>(initialNote?.generalNotes || '');

  // Quick Multi-Item Modal
  const [isMultiItemModalOpen, setIsMultiItemModalOpen] = useState<boolean>(false);
  const [multiSelectedProductIds, setMultiSelectedProductIds] = useState<string[]>([]);
  const [multiSearchTerm, setMultiSearchTerm] = useState<string>('');

  // Status message & direct export
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const directPrintRef = useRef<HTMLDivElement>(null);

  // Load initial store, customer, products
  useEffect(() => {
    async function loadData() {
      const [sList, cList, pList] = await Promise.all([getStores(), getCustomers(), getProducts()]);
      setStores(sList);
      setCustomers(cList);
      setAllProducts(pList);

      if (initialNote?.store) {
        setSelectedStore(initialNote.store);
      } else {
        const def = sList.find((s) => s.isDefault) || sList[0];
        setSelectedStore(def || null);
      }
    }
    loadData();
  }, [initialNote]);

  // STRICTLY filter products by selected category ONLY
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => p.category === selectedCategory);
  }, [allProducts, selectedCategory]);

  // Filter customer search suggestions
  const customerSuggestions = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const term = customerSearch.toLowerCase();
    return customers.filter(
      (c) => (c.name || '').toLowerCase().includes(term) || (c.phone || '').includes(term)
    );
  }, [customers, customerSearch]);

  // Calculate Subtotals
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [items]);

  const desiredTotal = parseVndInput(desiredTotalDigits);
  const diffDesired = desiredTotal > 0 ? desiredTotal - totalAmount : 0;

  const paidAmount = paidAmountDigits === '' ? totalAmount : parseVndInput(paidAmountDigits);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const paymentStatus = useMemo<'PAID' | 'PARTIAL' | 'UNPAID'>(() => {
    if (paidAmount >= totalAmount && totalAmount > 0) return 'PAID';
    if (paidAmount > 0 && paidAmount < totalAmount) return 'PARTIAL';
    return 'UNPAID';
  }, [paidAmount, totalAmount]);

  const totalInWords = useMemo(() => {
    return numberToVietnameseWords(totalAmount);
  }, [totalAmount]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Row update handlers
  const handleItemChange = (
    index: number,
    field: keyof DeliveryItemRow,
    value: string | number
  ) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'quantity') {
      const q = typeof value === 'number' ? value : parseFormattedNumber(String(value));
      item.quantity = Math.max(0, q);
      item.amount = Math.round(item.quantity * item.unitPrice);
    } else if (field === 'unitPrice') {
      const p = typeof value === 'number' ? value : parseVndInput(String(value));
      item.unitPrice = Math.max(0, p);
      item.amount = Math.round(item.quantity * item.unitPrice);
    } else if (field === 'productName') {
      item.productName = String(value);
      const found = filteredProducts.find(
        (p) => p.name.toLowerCase() === String(value).trim().toLowerCase()
      );
      if (found) {
        item.unit = found.defaultUnit;
        item.unitPrice = found.defaultPrice;
        item.amount = Math.round(item.quantity * found.defaultPrice);
      }
    } else {
      (item as any)[field] = value;
    }

    updated[index] = item;
    setItems(updated);
  };

  // Quick click product chip to fill empty row or append a new row
  const handleQuickPickProduct = (product: ProductItem) => {
    const emptyIdx = items.findIndex((it) => it.productName.trim() === '');
    if (emptyIdx >= 0) {
      const updated = [...items];
      const q = updated[emptyIdx].quantity || 1;
      updated[emptyIdx] = {
        ...updated[emptyIdx],
        productName: product.name,
        unit: product.defaultUnit,
        quantity: q,
        unitPrice: product.defaultPrice,
        amount: Math.round(q * product.defaultPrice),
      };
      setItems(updated);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${prev.length + 1}`,
          productName: product.name,
          unit: product.defaultUnit,
          quantity: 1,
          unitPrice: product.defaultPrice,
          amount: product.defaultPrice,
        },
      ]);
    }
    showToast(`Đã thêm "${product.name}"`);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        productName: '',
        unit: 'Cái',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  const handleDuplicateItem = (index: number) => {
    const target = items[index];
    const newItem: DeliveryItemRow = {
      ...target,
      id: `item-${Date.now()}-${Math.random()}`,
    };
    const updated = [...items];
    updated.splice(index + 1, 0, newItem);
    setItems(updated);
    showToast('Đã nhân bản dòng hàng hóa');
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      setItems([
        {
          id: `item-${Date.now()}`,
          productName: '',
          unit: 'Cái',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ]);
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Quick Multi Item Insertion
  const handleOpenMultiItemModal = () => {
    setMultiSelectedProductIds([]);
    setMultiSearchTerm('');
    setIsMultiItemModalOpen(true);
  };

  const handleApplyMultiItems = () => {
    const selected = filteredProducts.filter((p) => multiSelectedProductIds.includes(p.id));
    if (selected.length === 0) {
      setIsMultiItemModalOpen(false);
      return;
    }

    const validExisting = items.filter((it) => it.productName.trim() !== '');
    const newRows: DeliveryItemRow[] = selected.map((p, idx) => ({
      id: `multi-${Date.now()}-${idx}`,
      productName: p.name,
      unit: p.defaultUnit,
      quantity: 1,
      unitPrice: p.defaultPrice,
      amount: p.defaultPrice,
    }));

    setItems([...validExisting, ...newRows]);
    setIsMultiItemModalOpen(false);
    showToast(`Đã thêm nhanh ${selected.length} mặt hàng vào phiếu!`);
  };

  // Select existing customer
  const handleSelectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerAddress(c.address);
    if (c.notes) setCustomerNotes(c.notes);
    setCustomerSearch('');
    showToast(`Đã điền thông tin khách hàng: ${c.name}`);
  };

  // Save new customer to database
  const handleSaveCustomerToDb = async () => {
    if (!customerName.trim()) return;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: customerName.trim(),
      phone: customerPhone.trim(),
      address: customerAddress.trim(),
      type: 'buyer',
      businessField: selectedCategory,
      notes: customerNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveCustomer(newCust);
    setCustomers((prev) => [newCust, ...prev]);
    setSaveCustomerPrompt(false);
    showToast(`Đã lưu khách hàng mới "${newCust.name}" vào danh bạ.`);
  };

  // Build Document Object
  const buildCurrentDoc = (isDraft: boolean): DeliveryNote => {
    return {
      id: initialNote?.id || `pgh-${Date.now()}`,
      code: docCode,
      date: docDate,
      store: selectedStore || {
        id: 'temp-store',
        name: 'Cửa Hàng Kinh Doanh',
        address: 'Địa chỉ cửa hàng',
        phone: '0900000000',
        businessField: selectedCategory,
      },
      customer: {
        name: customerName.trim() || 'Khách hàng vãng lai',
        phone: customerPhone.trim(),
        address: customerAddress.trim() || 'Tại cửa hàng',
        notes: customerNotes.trim(),
      },
      businessCategory: selectedCategory,
      items: items.filter((it) => it.productName.trim() !== ''),
      desiredTotal: desiredTotal > 0 ? desiredTotal : undefined,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentStatus,
      totalInWords,
      generalNotes,
      isDraft,
      isDemo: false,
      createdAt: initialNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Save Draft
  const handleSaveDraft = async () => {
    const doc = buildCurrentDoc(true);
    await saveDeliveryNote(doc);
    showToast('Đã lưu bản nháp phiếu giao hàng thành công!');
    onSaveSuccess();
  };

  // Preview A4 (Always opens smoothly without blocking)
  const handlePreview = () => {
    const doc = buildCurrentDoc(false);
    onPreview(doc);
  };

  // Direct Export PNG from editor
  const handleDirectExportPng = async () => {
    if (!directPrintRef.current) return;
    setIsExporting(true);
    const filename = getDeliveryFilename(customerName.trim() || 'KhachHang', docDate, 'png');
    try {
      const ok = await exportElementToPng(directPrintRef.current, filename, 'portrait');
      if (ok) {
        showToast(`Đã tải ảnh PNG thành công: ${filename}`);
      } else {
        showToast('Không thể xuất ảnh PNG, thử mở Xem trước để xuất');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Direct Export PDF from editor
  const handleDirectExportPdf = async () => {
    if (!directPrintRef.current) return;
    setIsExporting(true);
    const filename = getDeliveryFilename(customerName.trim() || 'KhachHang', docDate, 'pdf');
    try {
      const ok = await exportElementToPdf(directPrintRef.current, filename, 'portrait');
      if (ok) {
        showToast(`Đã tải PDF thành công: ${filename}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Save & Issue
  const handleSaveAndIssue = async () => {
    if (items.filter((it) => it.productName.trim() !== '').length === 0) {
      showToast('Vui lòng thêm ít nhất một mặt hàng hợp lệ vào phiếu giao hàng!');
      return;
    }
    if (desiredTotal > 0 && Math.abs(diffDesired) > 100) {
      const confirmContinue = window.confirm(
        `Chú ý: Tổng chi tiết (${formatCurrency(
          totalAmount
        )}) chưa khớp với tổng mong muốn (${formatCurrency(
          desiredTotal
        )}). Bạn có muốn tiếp tục lưu không?`
      );
      if (!confirmContinue) return;
    }

    const doc = buildCurrentDoc(false);
    await saveDeliveryNote(doc);
    showToast('Đã lưu và phát hành Phiếu giao hàng thành công!');
    onSaveSuccess();
  };

  // Suggestions for matching desired total
  const renderDesiredTotalHelper = () => {
    if (!desiredTotal || desiredTotal <= 0 || Math.abs(diffDesired) === 0) return null;

    const isDeficit = diffDesired > 0;
    const activeItems = items.filter((it) => it.productName && it.quantity > 0);

    return (
      <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs space-y-2">
        <div className="flex items-start gap-2 text-amber-900 font-semibold">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p>
              Chênh lệch giữa tổng chi tiết và tổng mong muốn:{' '}
              <strong className={isDeficit ? 'text-red-700' : 'text-blue-800'}>
                {isDeficit ? `Thiếu ${formatCurrency(diffDesired)}` : `Thừa ${formatCurrency(Math.abs(diffDesired))}`}
              </strong>
            </p>
            <p className="text-[11px] font-normal text-amber-800 mt-0.5">
              Hệ thống không tự ý sửa số liệu giao dịch để ép khớp. Dưới đây là phương án điều chỉnh gợi ý để bạn xem xét:
            </p>
          </div>
        </div>

        {activeItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="bg-white p-2.5 rounded border border-amber-200">
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-600" />
                Gợi ý 1: Điều chỉnh đơn giá tham khảo (±10%)
              </span>
              <p className="text-slate-600 mt-1">
                Áp dụng đơn giá thực tế cho mặt hàng{' '}
                <span className="font-bold text-slate-900">"{activeItems[0].productName}"</span>:
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-slate-500 line-through">
                  {formatCurrency(activeItems[0].unitPrice)}
                </span>
                <ArrowRight size={12} className="text-slate-400" />
                <span className="font-bold text-blue-900">
                  {formatCurrency(
                    Math.round(
                      (activeItems[0].amount + diffDesired) / (activeItems[0].quantity || 1)
                    )
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const targetIdx = items.findIndex((it) => it.id === activeItems[0].id);
                    const newPrice = Math.max(
                      0,
                      Math.round(
                        (activeItems[0].amount + diffDesired) / (activeItems[0].quantity || 1)
                      )
                    );
                    handleItemChange(targetIdx >= 0 ? targetIdx : 0, 'unitPrice', newPrice);
                    showToast('Đã áp dụng đơn giá gợi ý sau khi bạn xác nhận');
                  }}
                  className="ml-auto px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-[10px]"
                >
                  Xác nhận đổi giá
                </button>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-amber-200">
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-600" />
                Gợi ý 2: Cân đối số lượng mặt hàng
              </span>
              <p className="text-slate-600 mt-1">
                Điều chỉnh số lượng của <span className="font-bold text-slate-900">"{activeItems[0].productName}"</span>{' '}
                để khớp tròn số tiền:
              </p>
              {activeItems[0].unitPrice > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-slate-600">
                    SL hiện tại: <strong>{activeItems[0].quantity}</strong>
                  </span>
                  <ArrowRight size={12} className="text-slate-400" />
                  <span className="font-bold text-emerald-800">
                    {Math.round((activeItems[0].amount + diffDesired) / activeItems[0].unitPrice)}{' '}
                    {activeItems[0].unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const targetIdx = items.findIndex((it) => it.id === activeItems[0].id);
                      const newQ = Math.max(
                        0,
                        Math.round(
                          (activeItems[0].amount + diffDesired) / activeItems[0].unitPrice
                        )
                      );
                      handleItemChange(targetIdx >= 0 ? targetIdx : 0, 'quantity', newQ);
                      showToast('Đã điều chỉnh số lượng sau khi bạn xác nhận');
                    }}
                    className="ml-auto px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium text-[10px]"
                  >
                    Xác nhận đổi SL
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentDocSnapshot = useMemo(
    () => buildCurrentDoc(false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docDate, selectedStore, customerName, customerPhone, customerAddress, customerNotes, selectedCategory, items, desiredTotalDigits, paidAmountDigits, generalNotes]
  );

  return (
    <div className="space-y-6 pb-28">
      {/* Hidden off-screen render for 1-click direct PDF/PNG export */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', left: '-100000px', top: 0, width: '794px', pointerEvents: 'none' }}
      >
        <div ref={directPrintRef}>
          <A4PrintDeliveryNote note={currentDocSnapshot} />
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2">
          <Check size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-blue-50 text-blue-800 border border-blue-200">
              Phiếu giao hàng
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Tạo Phiếu Giao Hàng Mới
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Điền nhanh thông tin khách hàng, chọn ngành nghề kinh doanh và các mặt hàng xuất kho.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Save size={15} />
            <span>Lưu nháp</span>
          </button>

          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Eye size={15} />
            <span>Xem trước A4</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDirectExportPng}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <ImageIcon size={15} />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất ảnh PNG'}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDirectExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Download size={15} />
            <span>Xuất PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndIssue}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <CheckCircle2 size={16} />
            <span>Lưu phiếu</span>
          </button>
        </div>
      </div>

      {/* 2-Column Grid: Store Profile & Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Thông tin Cửa Hàng (Bên Bán) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <Building size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">1. Thông tin Cửa Hàng (Bên Bán)</h3>
                <p className="text-[11px] text-slate-500">Chọn cửa hàng đã lưu hoặc sử dụng mặc định</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tên cơ sở / Cửa hàng kinh doanh
              </label>
              {stores.length > 1 ? (
                <select
                  value={selectedStore?.id || ''}
                  onChange={(e) => {
                    const st = stores.find((s) => s.id === e.target.value);
                    if (st) setSelectedStore(st);
                  }}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {stores.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} {st.isDefault ? '(Mặc định)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedStore?.name || ''}
                  onChange={(e) =>
                    setSelectedStore((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="text"
                  value={selectedStore?.phone || ''}
                  onChange={(e) =>
                    setSelectedStore((prev) =>
                      prev ? { ...prev, phone: e.target.value } : null
                    )
                  }
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5"
                  placeholder="0918 234 567"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ngày lập phiếu
                </label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Địa chỉ cửa hàng
              </label>
              <input
                type="text"
                value={selectedStore?.address || ''}
                onChange={(e) =>
                  setSelectedStore((prev) =>
                    prev ? { ...prev, address: e.target.value } : null
                  )
                }
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5"
                placeholder="Số nhà, tên đường, phường/xã..."
              />
            </div>
          </div>
        </div>

        {/* Card 2: Thông tin Khách Hàng (Bên Mua) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <User size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase">2. Thông tin Khách Hàng (Bên Mua)</h3>
                <p className="text-[11px] text-slate-500">Tìm kiếm nhanh để tự động điền hoặc nhập trực tiếp</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {/* Search customer auto complete */}
            <div className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm khách hàng đã lưu theo tên hoặc SĐT..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-2.5 bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {customerSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {customerSuggestions.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="px-3 py-2 text-xs hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-none flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="text-slate-500 text-[11px] ml-2">({c.phone || 'Không SĐT'})</span>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{c.address}</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        Chọn
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Họ tên người mua <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (e.target.value.trim().length > 2) setSaveCustomerPrompt(true);
                  }}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Nguyễn Văn A..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5"
                  placeholder="09xx xxx xxx"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Địa chỉ nhận hàng
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5"
                placeholder="Địa chỉ giao hàng thực tế..."
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <input
                type="text"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 text-slate-600 placeholder:text-slate-400"
                placeholder="Ghi chú giao hàng (vd: giao sáng sớm, gọi trước khi đến...)"
              />
              {saveCustomerPrompt && customerName.trim() && (
                <button
                  type="button"
                  onClick={handleSaveCustomerToDb}
                  className="ml-2 shrink-0 px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                >
                  Lưu vào danh bạ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Ngành Nghề Kinh Doanh & Danh Mục Hàng Hóa */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">3. Ngành Nghề & Bảng Chi Tiết Hàng Hóa</h3>
              <p className="text-[11px] text-slate-500">
                Chọn đúng ngành hàng để hiển thị và gợi ý chỉ các mặt hàng thuộc ngành đó
              </p>
            </div>
          </div>

          {/* Industry Tabs */}
          <div className="flex items-center flex-wrap gap-1.5">
            {DEFAULT_SALES_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Click Product Suggestions for ONLY the selected category */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Sparkles size={13} className="text-blue-600" />
              Gợi ý nhanh mặt hàng ngành "{selectedCategory}" ({filteredProducts.length} mặt hàng) — Nhấn để thêm:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleQuickPickProduct(prod)}
                className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-slate-700 border border-blue-200 rounded-lg text-[11px] font-semibold transition shadow-2xs cursor-pointer"
                title={`Đơn vị: ${prod.defaultUnit} | Giá gợi ý: ${formatCurrency(prod.defaultPrice)}`}
              >
                + {prod.name}
              </button>
            ))}
          </div>
        </div>

        {/* Action bar for table: Add row, Multi-item quick picker */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition border border-blue-200 cursor-pointer"
            >
              <Plus size={14} />
              <span>Thêm dòng hàng</span>
            </button>

            <button
              type="button"
              onClick={handleOpenMultiItemModal}
              className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition border border-indigo-200 cursor-pointer"
            >
              <ListPlus size={14} />
              <span>Chọn nhiều mặt hàng ({filteredProducts.length})</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Số dòng hàng: <strong className="text-slate-900">{items.length}</strong>
          </span>
        </div>

        {/* Table of items - Wide, readable numeric inputs */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-2.5 w-10 text-center">STT</th>
                  <th className="py-3 px-3 min-w-[230px]">Loại hàng / Tên mặt hàng</th>
                  <th className="py-3 px-2 min-w-[100px] text-center">Đơn vị</th>
                  <th className="py-3 px-3 min-w-[130px] text-right">Số lượng</th>
                  <th className="py-3 px-3 min-w-[170px] text-right">Đơn giá (VNĐ)</th>
                  <th className="py-3 px-3 min-w-[150px] text-right">Thành tiền (VNĐ)</th>
                  <th className="py-3 px-2 w-20 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* STT */}
                    <td className="py-2.5 px-2.5 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* Product Name with Suggestions ONLY from selectedCategory */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                          placeholder={`Nhập hoặc chọn hàng (${selectedCategory})...`}
                          list={`catalog-list-${index}`}
                          className="w-full text-sm font-semibold text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        />
                        <datalist id={`catalog-list-${index}`}>
                          {filteredProducts.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.defaultUnit} - {formatCurrency(p.defaultPrice)}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full text-sm text-center rounded-lg border border-slate-200 px-2 py-2 text-slate-700 focus:border-blue-500 focus:outline-none"
                        placeholder="Cái"
                      />
                    </td>

                    {/* Quantity - Wide input */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.quantity === 0 ? '' : String(item.quantity)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.,]/g, '');
                          const normalized = raw.replace(',', '.');
                          const num = parseFloat(normalized);
                          const updated = [...items];
                          const nextItem = { ...updated[index] };
                          nextItem.quantity = isNaN(num) ? 0 : Math.max(0, num);
                          nextItem.amount = Math.round(nextItem.quantity * nextItem.unitPrice);
                          updated[index] = nextItem;
                          setItems(updated);
                        }}
                        className="w-full min-w-[110px] text-right text-sm font-bold text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        placeholder="0"
                      />
                    </td>

                    {/* Unit Price - Wide formatted input */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.unitPrice > 0 ? formatThousands(item.unitPrice) : ''}
                        onChange={(e) => handleItemChange(index, 'unitPrice', digitsOnly(e.target.value))}
                        className="w-full min-w-[150px] text-right text-sm font-bold text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        placeholder="0"
                      />
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right text-sm font-black text-blue-900 whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </td>

                    {/* Actions: Clone & Delete */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded"
                          title="Nhân bản dòng"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                          title="Xóa dòng"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. TỔNG GIÁ TRỊ HÓA ĐƠN MONG MUỐN */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[280px]">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                TỔNG GIÁ TRỊ HÓA ĐƠN MONG MUỐN:
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={desiredTotalDigits ? formatThousands(desiredTotalDigits) : ''}
                  onChange={(e) => setDesiredTotalDigits(digitsOnly(e.target.value))}
                  placeholder="Nhập số tiền mong muốn (VNĐ) để hệ thống kiểm tra cân đối..."
                  className="w-full text-base font-bold text-blue-900 bg-white rounded-lg border border-slate-300 px-3.5 py-2.5 pr-16 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                  VNĐ
                </span>
              </div>
            </div>

            {/* Total items sum badge */}
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Tổng thực tế các dòng:</span>
              <p className="text-xl font-black text-slate-900">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          {renderDesiredTotalHelper()}
        </div>

        {/* 5. Thanh toán & Trạng thái */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            5. Thông Tin Thanh Toán
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tổng cộng tiền hàng
              </label>
              <div className="text-base font-black text-blue-900 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                {formatCurrency(totalAmount)}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-600">
                  Số tiền đã thanh toán
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaidAmountDigits(digitsOnly(Math.round(totalAmount)))}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Đủ 100%
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setPaidAmountDigits('0')}
                    className="text-[11px] text-slate-500 hover:underline"
                  >
                    0đ
                  </button>
                </div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={paidAmountDigits ? formatThousands(paidAmountDigits) : ''}
                onChange={(e) => setPaidAmountDigits(digitsOnly(e.target.value))}
                className="w-full text-sm font-bold rounded-lg border border-slate-300 px-3 py-2.5 text-emerald-800"
                placeholder={formatThousands(Math.round(totalAmount)) || '0'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Số tiền còn nợ lại
              </label>
              <div
                className={`text-base font-black p-2.5 rounded-lg border ${
                  remainingAmount > 0
                    ? 'bg-red-50 text-red-700 border-red-100'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                }`}
              >
                {formatCurrency(remainingAmount)}
              </div>
            </div>
          </div>

          {/* Payment Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Trạng thái phiếu:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : paymentStatus === 'PARTIAL'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {paymentStatus === 'PAID'
                  ? 'Đã thanh toán đủ'
                  : paymentStatus === 'PARTIAL'
                  ? 'Thanh toán một phần'
                  : 'Chưa thanh toán'}
              </span>
            </div>

            <div className="text-xs text-slate-700 italic">
              <span className="font-semibold text-slate-900 not-italic">Bằng chữ: </span>
              {totalInWords}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar for effortless clicking after filling form */}
      <div className="sticky bottom-3 z-30 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-slate-500 block">Tổng tiền phiếu giao hàng</span>
          <span className="text-base sm:text-lg font-black text-blue-900">{formatCurrency(totalAmount)}</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Eye size={16} />
            <span>Xem trước A4</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDirectExportPng}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <ImageIcon size={16} />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất ảnh (PNG)'}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDirectExportPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Download size={16} />
            <span>Xuất PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndIssue}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <CheckCircle2 size={16} />
            <span>Lưu phiếu</span>
          </button>
        </div>
      </div>

      {/* Multi-item Quick Select Modal */}
      {isMultiItemModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Chọn Nhanh Nhiều Mặt Hàng ({selectedCategory})
                </h3>
                <p className="text-xs text-slate-500">
                  Chỉ hiển thị các mặt hàng thuộc ngành "{selectedCategory}"
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMultiItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Lọc mặt hàng trong danh mục..."
                value={multiSearchTerm}
                onChange={(e) => setMultiSearchTerm(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-2"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
              {filteredProducts
                .filter((p) => p.name.toLowerCase().includes(multiSearchTerm.toLowerCase()))
                .map((prod) => {
                  const isChecked = multiSelectedProductIds.includes(prod.id);
                  return (
                    <label
                      key={prod.id}
                      className="flex items-center justify-between py-2.5 px-3 hover:bg-slate-50 rounded-lg cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMultiSelectedProductIds((prev) => [...prev, prod.id]);
                            } else {
                              setMultiSelectedProductIds((prev) =>
                                prev.filter((id) => id !== prod.id)
                              );
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-semibold text-xs text-slate-900">{prod.name}</span>
                          <span className="text-[11px] text-slate-500 ml-2">({prod.defaultUnit})</span>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-blue-900">
                        {formatCurrency(prod.defaultPrice)}
                      </span>
                    </label>
                  );
                })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-600">
                Đã chọn: <strong>{multiSelectedProductIds.length}</strong> mặt hàng
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMultiItemModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleApplyMultiItems}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Thêm vào phiếu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
