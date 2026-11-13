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
  Wheat,
  ListPlus,
  Sparkles,
  ArrowRight,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { PurchaseTableDoc, PurchaseItemRow, Customer, ProductItem } from '../types';
import { DEFAULT_PURCHASE_CATEGORIES } from '../data/defaultCatalog';
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
import { getCustomers, getProducts, getStores, savePurchaseTable, saveCustomer } from '../utils/storage';
import { exportElementToPdf, exportElementToPng, getPurchaseFilename } from '../utils/exportUtils';
import { A4PrintPurchaseTable } from './A4PrintPurchaseTable';

interface Props {
  initialDoc?: PurchaseTableDoc | null;
  onPreview: (doc: PurchaseTableDoc) => void;
  onSaveSuccess: () => void;
}

export const PurchaseTableEditor: React.FC<Props> = ({
  initialDoc,
  onPreview,
  onSaveSuccess,
}) => {
  // Database references
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);

  // Doc metadata
  const [docCode] = useState<string>(initialDoc?.code || generateDocCode('BKM'));
  const [docDate, setDocDate] = useState<string>(
    initialDoc?.date || new Date().toISOString().split('T')[0]
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialDoc?.businessCategory || DEFAULT_PURCHASE_CATEGORIES[0]
  );

  // Buyer Info
  const [buyerName, setBuyerName] = useState<string>(
    initialDoc?.buyerName || 'Cơ sở Thu Mua & Chế Biến Thủy Nông Sản Kiên Giang'
  );
  const [buyerAddress, setBuyerAddress] = useState<string>(
    initialDoc?.buyerAddress || 'Khu công nghiệp Thạnh Lộc, Huyện Châu Thành, Tỉnh Kiên Giang'
  );
  const [purchaseLocation, setPurchaseLocation] = useState<string>(
    initialDoc?.purchaseLocation || 'Trạm Cân Thu Mua Tân Hiệp, Quốc Lộ 80, Kiên Giang'
  );
  const [buyerOfficer, setBuyerOfficer] = useState<string>(
    initialDoc?.buyerOfficer || ''
  );

  // Items
  const [items, setItems] = useState<PurchaseItemRow[]>(
    initialDoc?.items && initialDoc.items.length > 0
      ? initialDoc.items
      : [
          {
            id: 'p-item-1',
            date: new Date().toISOString().split('T')[0],
            sellerName: '',
            sellerAddress: '',
            sellerCccd: '',
            sellerPhone: '',
            productName: '',
            quantityKg: 100,
            unitPrice: 0,
            totalAmount: 0,
            isPaidReceived: true,
          },
        ]
  );

  // Store digits-only strings for VNĐ inputs so typing never resets or glitches
  const [declaredTotalDigits, setDeclaredTotalDigits] = useState<string>(
    initialDoc?.declaredTotal ? digitsOnly(Math.round(initialDoc.declaredTotal)) : ''
  );
  const [paidAmountDigits, setPaidAmountDigits] = useState<string>(
    initialDoc?.paidAmount !== undefined ? digitsOnly(Math.round(initialDoc.paidAmount)) : ''
  );
  const [generalNotes, setGeneralNotes] = useState<string>(initialDoc?.generalNotes || '');

  // Quick Multi Item Modal
  const [isMultiItemModalOpen, setIsMultiItemModalOpen] = useState<boolean>(false);
  const [multiSelectedProdIds, setMultiSelectedProdIds] = useState<string[]>([]);
  const [multiSearchTerm, setMultiSearchTerm] = useState<string>('');

  // Toast & Direct Export
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const directPrintRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    async function load() {
      const [cList, pList, sList] = await Promise.all([getCustomers(), getProducts(), getStores()]);
      setCustomers(cList);
      setAllProducts(pList);

      if (!initialDoc && sList.length > 0) {
        const def = sList.find((s) => s.isDefault) || sList[0];
        setBuyerName(def.name);
        setBuyerAddress(def.address);
        if (def.representative) {
          setBuyerOfficer(def.representative);
        }
      }
    }
    load();
  }, [initialDoc]);

  // STRICTLY filter products by selected purchase category
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => p.category === selectedCategory);
  }, [allProducts, selectedCategory]);

  // Saved sellers from customers
  const sellerCustomers = useMemo(() => {
    return customers.filter((c) => c.type === 'seller' || c.type === 'both' || c.cccd);
  }, [customers]);

  // Calculate Subtotals
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  }, [items]);

  const declaredTotal = parseVndInput(declaredTotalDigits);
  const diffDeclared = declaredTotal > 0 ? declaredTotal - totalAmount : 0;

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

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Row update handlers
  const handleItemChange = (
    index: number,
    field: keyof PurchaseItemRow,
    value: string | number | boolean
  ) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'quantityKg') {
      const q = typeof value === 'number' ? value : parseFormattedNumber(String(value));
      item.quantityKg = Math.max(0, q);
      item.totalAmount = Math.round(item.quantityKg * item.unitPrice);
    } else if (field === 'unitPrice') {
      const p = typeof value === 'number' ? value : parseVndInput(String(value));
      item.unitPrice = Math.max(0, p);
      item.totalAmount = Math.round(item.quantityKg * item.unitPrice);
    } else if (field === 'productName') {
      item.productName = String(value);
      const found = filteredProducts.find(
        (p) => p.name.toLowerCase() === String(value).trim().toLowerCase()
      );
      if (found) {
        item.unitPrice = found.defaultPrice;
        item.totalAmount = Math.round(item.quantityKg * found.defaultPrice);
      }
    } else if (field === 'sellerName') {
      item.sellerName = String(value);
      const matchedSeller = sellerCustomers.find(
        (s) => s.name.toLowerCase() === String(value).trim().toLowerCase()
      );
      if (matchedSeller) {
        if (!item.sellerAddress && matchedSeller.address) item.sellerAddress = matchedSeller.address;
        if (!item.sellerCccd && matchedSeller.cccd) item.sellerCccd = matchedSeller.cccd;
        if (!item.sellerPhone && matchedSeller.phone) item.sellerPhone = matchedSeller.phone;
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
      const q = updated[emptyIdx].quantityKg || 100;
      updated[emptyIdx] = {
        ...updated[emptyIdx],
        productName: product.name,
        quantityKg: q,
        unitPrice: product.defaultPrice,
        totalAmount: Math.round(q * product.defaultPrice),
      };
      setItems(updated);
    } else {
      const lastItem = items[items.length - 1];
      setItems((prev) => [
        ...prev,
        {
          id: `p-item-${Date.now()}-${prev.length + 1}`,
          date: docDate,
          sellerName: lastItem?.sellerName || '',
          sellerAddress: lastItem?.sellerAddress || '',
          sellerCccd: lastItem?.sellerCccd || '',
          sellerPhone: lastItem?.sellerPhone || '',
          productName: product.name,
          quantityKg: 100,
          unitPrice: product.defaultPrice,
          totalAmount: Math.round(100 * product.defaultPrice),
          isPaidReceived: true,
        },
      ]);
    }
    showToast(`Đã thêm "${product.name}"`);
  };

  // Multi-item modal apply
  const handleOpenMultiItemModal = () => {
    setMultiSelectedProdIds([]);
    setMultiSearchTerm('');
    setIsMultiItemModalOpen(true);
  };

  const handleApplyMultiItems = () => {
    const selected = filteredProducts.filter((p) => multiSelectedProdIds.includes(p.id));
    if (selected.length === 0) {
      setIsMultiItemModalOpen(false);
      return;
    }

    const lastItem = items[items.length - 1];
    const validExisting = items.filter(
      (it) => it.productName.trim() !== '' || it.sellerName.trim() !== ''
    );
    const newRows: PurchaseItemRow[] = selected.map((p, idx) => ({
      id: `p-multi-${Date.now()}-${idx}`,
      date: docDate,
      sellerName: lastItem?.sellerName || '',
      sellerAddress: lastItem?.sellerAddress || '',
      sellerCccd: lastItem?.sellerCccd || '',
      sellerPhone: lastItem?.sellerPhone || '',
      productName: p.name,
      quantityKg: 100,
      unitPrice: p.defaultPrice,
      totalAmount: Math.round(100 * p.defaultPrice),
      isPaidReceived: true,
    }));

    setItems([...validExisting, ...newRows]);
    setIsMultiItemModalOpen(false);
    showToast(`Đã thêm nhanh ${selected.length} mặt hàng thu mua!`);
  };

  const handleAddItem = () => {
    const lastItem = items[items.length - 1];
    setItems((prev) => [
      ...prev,
      {
        id: `p-item-${Date.now()}-${prev.length + 1}`,
        date: docDate,
        sellerName: lastItem?.sellerName || '',
        sellerAddress: lastItem?.sellerAddress || '',
        sellerCccd: lastItem?.sellerCccd || '',
        sellerPhone: lastItem?.sellerPhone || '',
        productName: '',
        quantityKg: 100,
        unitPrice: 0,
        totalAmount: 0,
        isPaidReceived: true,
      },
    ]);
  };

  const handleDuplicateItem = (index: number) => {
    const target = items[index];
    const newItem: PurchaseItemRow = {
      ...target,
      id: `p-item-${Date.now()}-${Math.random()}`,
    };
    const updated = [...items];
    updated.splice(index + 1, 0, newItem);
    setItems(updated);
    showToast('Đã nhân bản dòng thu mua');
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      setItems([
        {
          id: `p-item-${Date.now()}`,
          date: docDate,
          sellerName: '',
          sellerAddress: '',
          sellerCccd: '',
          sellerPhone: '',
          productName: '',
          quantityKg: 100,
          unitPrice: 0,
          totalAmount: 0,
          isPaidReceived: true,
        },
      ]);
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Build Document Object
  const buildCurrentDoc = (isDraft: boolean): PurchaseTableDoc => {
    return {
      id: initialDoc?.id || `bkm-${Date.now()}`,
      code: docCode,
      date: docDate,
      buyerName: buyerName.trim() || 'Cơ Sở Thu Mua',
      buyerAddress: buyerAddress.trim() || 'Địa chỉ thu mua',
      purchaseLocation: purchaseLocation.trim() || buyerAddress.trim(),
      buyerOfficer: buyerOfficer.trim(),
      businessCategory: selectedCategory,
      items: items.filter((it) => it.productName.trim() !== '' || it.sellerName.trim() !== ''),
      declaredTotal: declaredTotal > 0 ? declaredTotal : undefined,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentStatus,
      totalInWords,
      generalNotes,
      isDraft,
      isDemo: false,
      createdAt: initialDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSaveDraft = async () => {
    const doc = buildCurrentDoc(true);
    await savePurchaseTable(doc);
    showToast('Đã lưu bản nháp Bảng Kê Thu Mua thành công!');
    onSaveSuccess();
  };

  // Opens A4 Landscape preview immediately without blocking confirm
  const handlePreview = () => {
    const doc = buildCurrentDoc(false);
    onPreview(doc);
  };

  // Direct 1-click PNG export (A4 Landscape)
  const handleDirectExportPng = async () => {
    if (!directPrintRef.current) return;
    setIsExporting(true);
    const firstSeller = items.find((it) => it.sellerName.trim())?.sellerName || buyerName || 'NguoiBan';
    const filename = getPurchaseFilename(firstSeller, docDate, 'png');
    try {
      const ok = await exportElementToPng(directPrintRef.current, filename, 'landscape');
      if (ok) {
        showToast(`Đã tải ảnh PNG A4 Ngang thành công: ${filename}`);
      } else {
        showToast('Không thể xuất ảnh PNG, thử mở Xem trước để xuất', 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Direct 1-click PDF export (A4 Landscape)
  const handleDirectExportPdf = async () => {
    if (!directPrintRef.current) return;
    setIsExporting(true);
    const firstSeller = items.find((it) => it.sellerName.trim())?.sellerName || buyerName || 'NguoiBan';
    const filename = getPurchaseFilename(firstSeller, docDate, 'pdf');
    try {
      const ok = await exportElementToPdf(directPrintRef.current, filename, 'landscape');
      if (ok) {
        showToast(`Đã tải PDF A4 Ngang thành công: ${filename}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAndIssue = async () => {
    const validRows = items.filter(
      (it) => it.productName.trim() !== '' || it.sellerName.trim() !== ''
    );
    if (validRows.length === 0) {
      showToast('Vui lòng nhập tên người bán hoặc tên mặt hàng cho ít nhất một dòng!', 'error');
      return;
    }

    if (declaredTotal > 0 && Math.abs(diffDeclared) > 100) {
      const confirmContinue = window.confirm(
        `Chú ý: Tổng chi tiết (${formatCurrency(
          totalAmount
        )}) chưa khớp với tổng khai báo (${formatCurrency(
          declaredTotal
        )}). Bạn có muốn tiếp tục lưu không?`
      );
      if (!confirmContinue) return;
    }

    // Auto save sellers into customer address book if not exist
    for (const row of validRows) {
      if (row.sellerName && !customers.some((c) => (c.name || '').toLowerCase() === row.sellerName.toLowerCase())) {
        const newSeller: Customer = {
          id: `seller-${Date.now()}-${Math.random()}`,
          name: row.sellerName,
          address: row.sellerAddress || '',
          phone: row.sellerPhone || '',
          cccd: row.sellerCccd || '',
          type: 'seller',
          businessField: selectedCategory,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveCustomer(newSeller);
      }
    }

    const doc = buildCurrentDoc(false);
    await savePurchaseTable(doc);
    showToast('Đã lưu Bảng Kê Thu Mua Hàng Hóa thành công!');
    onSaveSuccess();
  };

  // Helper for Declared Total
  const renderDeclaredTotalHelper = () => {
    if (!declaredTotal || declaredTotal <= 0 || Math.abs(diffDeclared) === 0) return null;
    const isDeficit = diffDeclared > 0;
    const activeItems = items.filter((it) => it.productName && it.quantityKg > 0);

    return (
      <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs space-y-2">
        <div className="flex items-start gap-2 text-amber-900 font-semibold">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p>
              Chênh lệch giữa tổng chi tiết và tổng theo chứng từ:{' '}
              <strong className={isDeficit ? 'text-red-700' : 'text-blue-800'}>
                {isDeficit ? `Thiếu ${formatCurrency(diffDeclared)}` : `Thừa ${formatCurrency(Math.abs(diffDeclared))}`}
              </strong>
            </p>
            <p className="text-[11px] font-normal text-amber-800 mt-0.5">
              Hệ thống không tự ý sửa số liệu giao dịch để ép khớp. Bạn có thể kiểm tra lại số kg hoặc đơn giá thực tế:
            </p>
          </div>
        </div>

        {activeItems.length > 0 && activeItems[0].quantityKg > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="bg-white p-2.5 rounded border border-amber-200">
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-600" />
                Gợi ý 1: Điều chỉnh đơn giá thu mua tham khảo
              </span>
              <p className="text-slate-600 mt-1">
                Áp dụng đơn giá thực tế cho{' '}
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
                      (activeItems[0].totalAmount + diffDeclared) / (activeItems[0].quantityKg || 1)
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
                        (activeItems[0].totalAmount + diffDeclared) /
                          (activeItems[0].quantityKg || 1)
                      )
                    );
                    handleItemChange(targetIdx >= 0 ? targetIdx : 0, 'unitPrice', newPrice);
                    showToast('Đã áp dụng đơn giá gợi ý');
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
                Gợi ý 2: Cân đối số lượng kg thu mua
              </span>
              <p className="text-slate-600 mt-1">
                Điều chỉnh số lượng kg của <span className="font-bold text-slate-900">"{activeItems[0].productName}"</span>:
              </p>
              {activeItems[0].unitPrice > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-slate-600">
                    SL hiện tại: <strong>{formatNumber(activeItems[0].quantityKg)} kg</strong>
                  </span>
                  <ArrowRight size={12} className="text-slate-400" />
                  <span className="font-bold text-emerald-800">
                    {formatNumber(
                      Math.round(
                        (activeItems[0].totalAmount + diffDeclared) / activeItems[0].unitPrice
                      )
                    )}{' '}
                    kg
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const targetIdx = items.findIndex((it) => it.id === activeItems[0].id);
                      const newQ = Math.max(
                        0,
                        Math.round(
                          (activeItems[0].totalAmount + diffDeclared) /
                            activeItems[0].unitPrice
                        )
                      );
                      handleItemChange(targetIdx >= 0 ? targetIdx : 0, 'quantityKg', newQ);
                      showToast('Đã điều chỉnh số kg');
                    }}
                    className="ml-auto px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium text-[10px]"
                  >
                    Xác nhận đổi kg
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
    [docDate, buyerName, buyerAddress, purchaseLocation, buyerOfficer, selectedCategory, items, declaredTotalDigits, paidAmountDigits, generalNotes]
  );

  return (
    <div className="space-y-6 pb-28">
      {/* Hidden off-screen render (A4 Landscape: 1123px wide) for 1-click direct PDF/PNG export */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', left: '-100000px', top: 0, width: '1123px', pointerEvents: 'none' }}
      >
        <div ref={directPrintRef}>
          <A4PrintPurchaseTable doc={currentDocSnapshot} />
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 ${
            toastMsg.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toastMsg.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Banner / Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-emerald-50 text-emerald-800 border border-emerald-200">
              Bảng kê thu mua • Khổ A4 Ngang
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Tạo Bảng Kê Thu Mua Hàng Hóa, Dịch Vụ
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Hỗ trợ nhiều người bán trong một bảng kê, gợi ý nhanh mặt hàng thu mua và in A4 chiều ngang.
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
            <span>Xem trước A4 Ngang</span>
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
            <span>Lưu bảng kê</span>
          </button>
        </div>
      </div>

      {/* Section 1: Thông tin người thu mua & địa điểm */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Building size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                1. Thông Tin Cơ Sở / Người Thu Mua & Địa Điểm
              </h3>
              <p className="text-[11px] text-slate-500">
                Thông tin cơ sở, hộ kinh doanh hoặc cá nhân đứng ra thu mua
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
              Ngày lập bảng kê
            </label>
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 px-2.5 py-1.5 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tên cơ sở / Người thu mua <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Người phụ trách thu mua
            </label>
            <input
              type="text"
              value={buyerOfficer}
              onChange={(e) => setBuyerOfficer(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5"
              placeholder="Họ tên người phụ trách thu mua (để trống nếu tự ký tay)..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Địa chỉ người thu mua
            </label>
            <input
              type="text"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5"
              placeholder="Địa chỉ trụ sở/cơ sở..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Địa chỉ nơi tổ chức thu mua
            </label>
            <input
              type="text"
              value={purchaseLocation}
              onChange={(e) => setPurchaseLocation(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5"
              placeholder="Ví dụ: Tại trạm cân X, kho nông sản Y..."
            />
          </div>
        </div>
      </div>

      {/* Section 2: Chọn ngành nghề thu mua & Bảng chi tiết */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Wheat size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                2. Ngành Hàng Thu Mua & Bảng Chi Tiết (Nhiều Người Bán)
              </h3>
              <p className="text-[11px] text-slate-500">
                Chọn ngành hàng để hiển thị và gợi ý nhanh các mặt hàng thu mua tương ứng
              </p>
            </div>
          </div>

          {/* Industry categories */}
          <div className="flex items-center flex-wrap gap-1.5">
            {DEFAULT_PURCHASE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Click Purchase Product Suggestions for ONLY the selected category */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-600" />
              Gợi ý nhanh mặt hàng "{selectedCategory}" ({filteredProducts.length} mặt hàng) — Nhấn để thêm vào bảng:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleQuickPickProduct(prod)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-600 hover:text-white text-slate-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition shadow-2xs cursor-pointer"
                title={`Đơn giá gợi ý: ${formatCurrency(prod.defaultPrice)}/${prod.defaultUnit}`}
              >
                + {prod.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick add actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold transition border border-emerald-200 cursor-pointer"
            >
              <Plus size={14} />
              <span>Thêm dòng thu mua</span>
            </button>

            <button
              type="button"
              onClick={handleOpenMultiItemModal}
              className="inline-flex items-center gap-1 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold transition border border-teal-200 cursor-pointer"
            >
              <ListPlus size={14} />
              <span>Chọn nhiều mặt hàng ({filteredProducts.length})</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Tổng số dòng: <strong className="text-slate-900">{items.length}</strong>
          </span>
        </div>

        {/* Procurement Table with wide, readable numeric inputs */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10.5px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-2 w-9 text-center">STT</th>
                  <th className="py-3 px-2 min-w-[125px]">Ngày</th>
                  <th className="py-3 px-3 min-w-[175px]">Người bán (Họ tên)</th>
                  <th className="py-3 px-3 min-w-[190px]">Địa chỉ</th>
                  <th className="py-3 px-2 min-w-[140px] text-center">Số CCCD</th>
                  <th className="py-3 px-3 min-w-[200px]">Tên mặt hàng</th>
                  <th className="py-3 px-3 min-w-[125px] text-right">SL (kg)</th>
                  <th className="py-3 px-3 min-w-[160px] text-right">Đơn giá (đ/kg)</th>
                  <th className="py-3 px-3 min-w-[140px] text-right">Tổng tiền</th>
                  <th className="py-3 px-2 min-w-[115px] text-center">Nhận tiền</th>
                  <th className="py-3 px-2 w-16 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-2 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-2">
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => handleItemChange(index, 'date', e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 px-2 py-2"
                      />
                    </td>

                    {/* Seller Name with Auto Complete */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.sellerName}
                        onChange={(e) => handleItemChange(index, 'sellerName', e.target.value)}
                        placeholder="Họ tên người bán..."
                        list={`seller-list-${index}`}
                        className="w-full text-sm font-bold text-slate-900 rounded-lg border border-slate-300 px-2.5 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                      <datalist id={`seller-list-${index}`}>
                        {sellerCustomers.map((s) => (
                          <option key={s.id} value={s.name}>
                            CCCD: {s.cccd || 'Không'} - {s.address}
                          </option>
                        ))}
                      </datalist>
                    </td>

                    {/* Seller Address */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.sellerAddress}
                        onChange={(e) => handleItemChange(index, 'sellerAddress', e.target.value)}
                        placeholder="Ấp, xã, huyện..."
                        className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-2 text-slate-700"
                      />
                    </td>

                    {/* Seller CCCD */}
                    <td className="py-2.5 px-2 text-center">
                      <input
                        type="text"
                        maxLength={12}
                        value={item.sellerCccd}
                        onChange={(e) => handleItemChange(index, 'sellerCccd', digitsOnly(e.target.value))}
                        placeholder="Số CCCD"
                        className="w-full text-center font-mono text-xs rounded-lg border border-slate-200 px-2 py-2 text-slate-800"
                      />
                    </td>

                    {/* Product Name with Suggestions STRICTLY from selectedCategory */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                        placeholder={`Chọn hàng (${selectedCategory})...`}
                        list={`purchase-prods-${index}`}
                        className="w-full text-sm font-semibold text-slate-900 rounded-lg border border-slate-300 px-2.5 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                      <datalist id={`purchase-prods-${index}`}>
                        {filteredProducts.map((p) => (
                          <option key={p.id} value={p.name}>
                            {formatCurrency(p.defaultPrice)}/{p.defaultUnit}
                          </option>
                        ))}
                      </datalist>
                    </td>

                    {/* Quantity Kg - Wide readable input */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={item.quantityKg === 0 ? '' : String(item.quantityKg)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.,]/g, '');
                          const normalized = raw.replace(',', '.');
                          const num = parseFloat(normalized);
                          const updated = [...items];
                          const nextItem = { ...updated[index] };
                          nextItem.quantityKg = isNaN(num) ? 0 : Math.max(0, num);
                          nextItem.totalAmount = Math.round(nextItem.quantityKg * nextItem.unitPrice);
                          updated[index] = nextItem;
                          setItems(updated);
                        }}
                        className="w-full min-w-[115px] text-right text-sm font-bold text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        placeholder="0"
                      />
                    </td>

                    {/* Unit Price - Wide formatted VNĐ input */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.unitPrice > 0 ? formatThousands(item.unitPrice) : ''}
                        onChange={(e) => handleItemChange(index, 'unitPrice', digitsOnly(e.target.value))}
                        className="w-full min-w-[145px] text-right text-sm font-bold text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        placeholder="0"
                      />
                    </td>

                    {/* Total Amount */}
                    <td className="py-2.5 px-3 text-right text-sm font-black text-emerald-900 whitespace-nowrap">
                      {formatCurrency(item.totalAmount)}
                    </td>

                    {/* Seller Acknowledgment Checkbox */}
                    <td className="py-2.5 px-2 text-center">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isPaidReceived}
                          onChange={(e) =>
                            handleItemChange(index, 'isPaidReceived', e.target.checked)
                          }
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-[11px] text-slate-600">Đã nhận</span>
                      </label>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded"
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

        {/* Section 3: TỔNG GIÁ TRỊ THU MUA THEO CHỨNG TỪ */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[280px]">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                TỔNG GIÁ TRỊ THU MUA MONG MUỐN / THEO CHỨNG TỪ:
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={declaredTotalDigits ? formatThousands(declaredTotalDigits) : ''}
                  onChange={(e) => setDeclaredTotalDigits(digitsOnly(e.target.value))}
                  placeholder="Nhập tổng giá trị thu mua (VNĐ)..."
                  className="w-full text-base font-bold text-emerald-900 bg-white rounded-lg border border-slate-300 px-3.5 py-2.5 pr-16 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                  VNĐ
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Tổng thực tế các dòng:</span>
              <p className="text-xl font-black text-emerald-950">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          {renderDeclaredTotalHelper()}
        </div>

        {/* Section 4: Thanh toán và chữ ký */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            4. Tổng Hợp Thanh Toán & Xác Nhận Bảng Kê
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Tổng cộng tiền thu mua
              </label>
              <div className="text-base font-black text-emerald-900 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                {formatCurrency(totalAmount)}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-600">
                  Số tiền đã chi trả
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaidAmountDigits(digitsOnly(Math.round(totalAmount)))}
                    className="text-[11px] text-emerald-700 hover:underline font-semibold"
                  >
                    Chi đủ 100%
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
                Còn nợ người bán
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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Trạng thái thanh toán:</span>
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
              <span className="font-semibold text-slate-900 not-italic">Số tiền bằng chữ: </span>
              {totalInWords}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-3 z-30 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] text-slate-500 block">Tổng tiền bảng kê thu mua</span>
          <span className="text-base sm:text-lg font-black text-emerald-900">{formatCurrency(totalAmount)}</span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Eye size={16} />
            <span>Xem trước A4 Ngang</span>
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
            <span>Lưu bảng kê</span>
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
                  Chỉ hiển thị các mặt hàng thuộc nhóm "{selectedCategory}"
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
                placeholder="Lọc mặt hàng thu mua..."
                value={multiSearchTerm}
                onChange={(e) => setMultiSearchTerm(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-2"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
              {filteredProducts
                .filter((p) => p.name.toLowerCase().includes(multiSearchTerm.toLowerCase()))
                .map((prod) => {
                  const isChecked = multiSelectedProdIds.includes(prod.id);
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
                              setMultiSelectedProdIds((prev) => [...prev, prod.id]);
                            } else {
                              setMultiSelectedProdIds((prev) =>
                                prev.filter((id) => id !== prod.id)
                              );
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <div>
                          <span className="font-semibold text-xs text-slate-900">{prod.name}</span>
                          <span className="text-[11px] text-slate-500 ml-2">({prod.defaultUnit})</span>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-emerald-900">
                        {formatCurrency(prod.defaultPrice)}/{prod.defaultUnit}
                      </span>
                    </label>
                  );
                })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-600">
                Đã chọn: <strong>{multiSelectedProdIds.length}</strong> mặt hàng
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
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Thêm vào bảng kê
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
