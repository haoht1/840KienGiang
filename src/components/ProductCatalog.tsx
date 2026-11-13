import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Tag,
  Check,
  RotateCcw,
  ShoppingBag,
  Wheat,
} from 'lucide-react';
import { ProductItem } from '../types';
import {
  DEFAULT_SALES_CATEGORIES,
  DEFAULT_PURCHASE_CATEGORIES,
  INITIAL_PRODUCTS,
} from '../data/defaultCatalog';
import { getProducts, saveProduct, deleteProduct } from '../utils/storage';
import {
  formatCurrency,
  digitsOnly,
  formatThousands,
  parseVndInput,
} from '../utils/formatters';

export const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_SALES_CATEGORIES[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal edit/new
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);

  // Form
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>(DEFAULT_SALES_CATEGORIES[0]);
  const [type, setType] = useState<'SALES' | 'PURCHASE'>('SALES');
  const [defaultUnit, setDefaultUnit] = useState<string>('Cái');
  const [defaultPrice, setDefaultPrice] = useState<string>('0');
  const [note, setNote] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const allCategories = useMemo(() => {
    return [...DEFAULT_SALES_CATEGORIES, ...DEFAULT_PURCHASE_CATEGORIES];
  }, []);

  const loadProducts = async () => {
    const p = await getProducts();
    setProducts(p);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory !== 'ALL' && p.category !== activeCategory) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(term) || p.defaultUnit.toLowerCase().includes(term);
      }
      return true;
    });
  }, [products, activeCategory, searchTerm]);

  // Open Add
  const handleOpenNew = () => {
    setEditingItem(null);
    setName('');
    setCategory(activeCategory === 'ALL' ? DEFAULT_SALES_CATEGORIES[0] : activeCategory);
    setType(DEFAULT_PURCHASE_CATEGORIES.includes(activeCategory) ? 'PURCHASE' : 'SALES');
    setDefaultUnit('Cái');
    setDefaultPrice('0');
    setNote('');
    setIsModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (p: ProductItem) => {
    setEditingItem(p);
    setName(p.name);
    setCategory(p.category);
    setType(p.type);
    setDefaultUnit(p.defaultUnit);
    setDefaultPrice(digitsOnly(Math.round(p.defaultPrice)));
    setNote(p.note || '');
    setIsModalOpen(true);
  };

  // Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Vui lòng nhập tên mặt hàng');
      return;
    }

    const item: ProductItem = {
      id: editingItem?.id || `custom-p-${Date.now()}`,
      name: name.trim(),
      category,
      type: DEFAULT_PURCHASE_CATEGORIES.includes(category) ? 'PURCHASE' : 'SALES',
      defaultUnit: defaultUnit.trim() || 'Cái',
      defaultPrice: parseVndInput(defaultPrice),
      note: note.trim() || undefined,
      isCustom: true,
    };

    await saveProduct(item);
    await loadProducts();
    setIsModalOpen(false);
    showToast(`Đã lưu mặt hàng "${item.name}"`);
  };

  // Delete
  const handleDelete = async (id: string, prodName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mặt hàng "${prodName}" không?`)) {
      return;
    }
    await deleteProduct(id);
    await loadProducts();
    showToast('Đã xóa mặt hàng');
  };

  // Quick price change inline
  const handleInlinePriceUpdate = async (p: ProductItem, newPrice: number) => {
    const updated = { ...p, defaultPrice: Math.max(0, newPrice) };
    await saveProduct(updated);
    await loadProducts();
    showToast(`Đã cập nhật giá "${p.name}"`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2">
          <Check size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Quản Lý Danh Mục Hàng Hóa & Bảng Giá
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cấu hình bảng giá chuẩn cho 6 ngành bán hàng và 3 ngành thu mua nông thủy sản.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Plus size={16} />
          <span>+ Thêm Mặt Hàng Mới</span>
        </button>
      </div>

      {/* Category Pills Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
            Phân Loại Theo Ngành Nghề
          </span>
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-slate-900">{products.length}</strong> mặt hàng
          </span>
        </div>

        {/* Sales Categories */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1 mb-1.5">
            <ShoppingBag size={12} />
            <span>Ngành Hàng Bán Ra (Phiếu Giao Hàng)</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_SALES_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Purchase Categories */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1 mb-1.5">
            <Wheat size={12} />
            <span>Ngành Hàng Thu Mua (Bảng Kê Mua Vào)</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_PURCHASE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Tìm mặt hàng trong ngành "${activeCategory}"...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-2"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Hiển thị <strong>{filteredProducts.length}</strong> mặt hàng
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th className="py-2.5 px-3 min-w-[220px]">Tên mặt hàng</th>
                <th className="py-2.5 px-3 w-40">Ngành nghề</th>
                <th className="py-2.5 px-3 w-28 text-center">Đơn vị tính</th>
                <th className="py-2.5 px-3 w-40 text-right">Đơn giá niêm yết</th>
                <th className="py-2.5 px-3 w-24 text-center">Loại</th>
                <th className="py-2.5 px-3 w-28 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 text-center text-slate-400 font-bold">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {p.name}
                    {p.note && <span className="block text-[10px] text-slate-400 font-normal">{p.note}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-medium">
                    {p.category}
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                    {p.defaultUnit}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-black text-blue-900 text-sm">
                      {formatCurrency(p.defaultPrice)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.type === 'SALES'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.type === 'SALES' ? 'Bán' : 'Thu mua'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition"
                        title="Chỉnh sửa mặt hàng và giá"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded transition"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Chỉnh Sửa Mặt Hàng' : 'Thêm Mặt Hàng Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Tên mặt hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-semibold"
                  placeholder="Ví dụ: Phân NPK 16-16-8..."
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Ngành nghề kinh doanh / thu mua
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-medium"
                >
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    required
                    value={defaultUnit}
                    onChange={(e) => setDefaultUnit(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Chai, Bao, Cái, kg, tấn..."
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Đơn giá niêm yết (VNĐ)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={defaultPrice ? formatThousands(defaultPrice) : ''}
                    onChange={(e) => setDefaultPrice(digitsOnly(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-bold text-blue-900"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Ghi chú hoặc quy cách</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Quy cách đóng gói, xuất xứ..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Lưu mặt hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
