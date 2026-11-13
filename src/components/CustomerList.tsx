import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Users,
  UserCheck,
  Edit,
  Trash2,
  FileDown,
  History,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Receipt,
  X,
  Check,
} from 'lucide-react';
import { Customer, DeliveryNote, PurchaseTableDoc } from '../types';
import { getCustomers, saveCustomer, deleteCustomer, getDeliveryNotes, getPurchaseTables } from '../utils/storage';
import { formatCurrency, formatDateShort } from '../utils/formatters';

interface Props {
  onCreateDeliveryForCustomer: (customer: Customer) => void;
  onCreatePurchaseForCustomer: (customer: Customer) => void;
}

export const CustomerList: React.FC<Props> = ({
  onCreateDeliveryForCustomer,
  onCreatePurchaseForCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [purchaseTables, setPurchaseTables] = useState<PurchaseTableDoc[]>([]);

  // Search & Type Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'buyer' | 'seller'>('ALL');

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // History modal
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [cccd, setCccd] = useState<string>('');
  const [type, setType] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [businessField, setBusinessField] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = async () => {
    const [c, d, p] = await Promise.all([getCustomers(), getDeliveryNotes(), getPurchaseTables()]);
    setCustomers(c);
    setDeliveryNotes(d);
    setPurchaseTables(p);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (typeFilter !== 'ALL' && c.type !== typeFilter && c.type !== 'both') return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          (c.cccd && c.cccd.includes(term)) ||
          c.address.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [customers, typeFilter, searchTerm]);

  // Open modal for new
  const handleOpenNew = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setCccd('');
    setType('buyer');
    setBusinessField('');
    setNotes('');
    setIsEditModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setCccd(c.cccd || '');
    setType(c.type);
    setBusinessField(c.businessField || '');
    setNotes(c.notes || '');
    setIsEditModalOpen(true);
  };

  // Save customer
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập họ tên khách hàng / đối tác');
      return;
    }

    const item: Customer = {
      id: editingCustomer?.id || `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      cccd: cccd.trim() || undefined,
      type,
      businessField: businessField.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingCustomer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveCustomer(item);
    await loadData();
    setIsEditModalOpen(false);
    showToast(`Đã lưu thông tin "${item.name}"`);
  };

  // Delete
  const handleDelete = async (id: string, customerName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khách hàng "${customerName}" không?`)) {
      return;
    }
    await deleteCustomer(id);
    await loadData();
    showToast('Đã xóa khách hàng');
  };

  // Export single customer JSON
  const handleExportSingleJson = (c: Customer) => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(c, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `KhachHang_${c.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Get transactions for history modal
  const customerDeliveries = useMemo(() => {
    if (!historyCustomer) return [];
    return deliveryNotes.filter(
      (d) =>
        d.customer.name.toLowerCase() === historyCustomer.name.toLowerCase() ||
        (historyCustomer.phone && d.customer.phone === historyCustomer.phone)
    );
  }, [historyCustomer, deliveryNotes]);

  const customerPurchases = useMemo(() => {
    if (!historyCustomer) return [];
    return purchaseTables.filter((p) =>
      p.items.some(
        (it) =>
          it.sellerName.toLowerCase() === historyCustomer.name.toLowerCase() ||
          (historyCustomer.cccd && it.sellerCccd === historyCustomer.cccd)
      )
    );
  }, [historyCustomer, purchaseTables]);

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
            Danh Sách Khách Hàng & Đối Tác
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Quản lý người mua, hộ nông dân bán hàng, số CCCD và xem lịch sử giao dịch.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Plus size={16} />
          <span>+ Thêm Khách Hàng Mới</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, SĐT, số CCCD, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1 rounded-md transition ${
              typeFilter === 'ALL' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600'
            }`}
          >
            Tất cả ({customers.length})
          </button>
          <button
            onClick={() => setTypeFilter('buyer')}
            className={`px-3 py-1 rounded-md transition ${
              typeFilter === 'buyer' ? 'bg-white shadow-xs font-bold text-blue-700' : 'text-slate-600'
            }`}
          >
            Bên mua hàng
          </button>
          <button
            onClick={() => setTypeFilter('seller')}
            className={`px-3 py-1 rounded-md transition ${
              typeFilter === 'seller' ? 'bg-white shadow-xs font-bold text-emerald-800' : 'text-slate-600'
            }`}
          >
            Bên bán thu mua (Có CCCD)
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            Không tìm thấy khách hàng nào. Hãy thêm khách hàng mới hoặc nhập từ JSON.
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const isSeller = c.type === 'seller' || c.type === 'both' || !!c.cccd;
            return (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isSeller ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {(c.name || 'K').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{c.name}</h3>
                        <span
                          className={`inline-block mt-0.5 text-[9.5px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            c.type === 'both'
                              ? 'bg-purple-100 text-purple-800'
                              : isSeller
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {c.type === 'both'
                            ? 'Mua & Bán'
                            : isSeller
                            ? 'Người bán hàng'
                            : 'Người mua'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 rounded transition"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleExportSingleJson(c)}
                        className="p-1.5 hover:bg-purple-50 text-purple-600 rounded transition"
                        title="Tải riêng tệp JSON khách hàng"
                      >
                        <FileDown size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 hover:bg-red-50 text-red-600 rounded transition"
                        title="Xóa hồ sơ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{c.phone || 'Chưa có SĐT'}</span>
                    </div>

                    {c.cccd && (
                      <div className="flex items-center gap-2">
                        <CreditCard size={13} className="text-slate-400 shrink-0" />
                        <span className="font-mono text-emerald-800 font-bold">CCCD: {c.cccd}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{c.address || 'Chưa có địa chỉ'}</span>
                    </div>

                    {c.businessField && (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        Ngành nghề: {c.businessField}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Quick Doc Triggers */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                  <button
                    onClick={() => setHistoryCustomer(c)}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
                  >
                    <History size={13} />
                    <span>Lịch sử</span>
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onCreateDeliveryForCustomer(c)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold text-[10.5px]"
                      title="Tạo phiếu giao hàng cho khách này"
                    >
                      <FileText size={11} />
                      <span>Giao hàng</span>
                    </button>

                    <button
                      onClick={() => onCreatePurchaseForCustomer(c)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-[10.5px]"
                      title="Tạo bảng kê thu mua từ người này"
                    >
                      <Receipt size={11} />
                      <span>Thu mua</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'Chỉnh Sửa Hồ Sơ Khách Hàng' : 'Thêm Khách Hàng / Đối Tác Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-semibold"
                  placeholder="Ví dụ: Nguyễn Văn An"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="09xx xxx xxx"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Số CCCD (cho thu mua)
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={cccd}
                    onChange={(e) => setCccd(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    placeholder="0910xxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Ấp, xã, phường, huyện, tỉnh..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phân loại đối tác</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-medium"
                  >
                    <option value="buyer">Bên mua hàng (Khách giao hàng)</option>
                    <option value="seller">Bên bán hàng (Thu mua nông thủy sản)</option>
                    <option value="both">Cả hai (Vừa mua vừa bán)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Ngành nghề</label>
                  <input
                    type="text"
                    value={businessField}
                    onChange={(e) => setBusinessField(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Vd: Nuôi tôm, Lúa ST25, VLXD..."
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Thông tin đặc điểm, thanh toán, tuyến đường giao..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Lịch Sử Giao Dịch: {historyCustomer.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {historyCustomer.phone || 'Không SĐT'} • {historyCustomer.address}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryCustomer(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto text-xs pr-1">
              {/* Delivery History */}
              <div>
                <h4 className="font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText size={14} />
                  <span>Phiếu giao hàng đã lập ({customerDeliveries.length})</span>
                </h4>
                {customerDeliveries.length === 0 ? (
                  <p className="text-slate-400 italic">Chưa có phiếu giao hàng nào.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {customerDeliveries.map((d) => (
                      <div key={d.id} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                        <div>
                          <span className="font-mono font-bold text-slate-800">{d.code}</span>
                          <span className="text-slate-500 text-[11px] ml-2">{formatDateShort(d.date)}</span>
                          <p className="text-[11px] text-slate-600">{d.items.length} mặt hàng ({d.businessCategory})</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 block">{formatCurrency(d.totalAmount)}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold uppercase">{d.paymentStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase History */}
              <div className="pt-2">
                <h4 className="font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Receipt size={14} />
                  <span>Bảng kê thu mua ({customerPurchases.length})</span>
                </h4>
                {customerPurchases.length === 0 ? (
                  <p className="text-slate-400 italic">Chưa có bảng kê thu mua nào.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {customerPurchases.map((p) => (
                      <div key={p.id} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                        <div>
                          <span className="font-mono font-bold text-slate-800">{p.code}</span>
                          <span className="text-slate-500 text-[11px] ml-2">{formatDateShort(p.date)}</span>
                          <p className="text-[11px] text-slate-600">{p.businessCategory}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 block">{formatCurrency(p.totalAmount)}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold uppercase">{p.paymentStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
