import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  Check,
  Plus,
  Trash2,
  Star,
  Phone,
  MapPin,
  CreditCard,
  Briefcase,
  Image as ImageIcon,
} from 'lucide-react';
import { StoreProfile } from '../types';
import { getStores, saveStore } from '../utils/storage';

export const StoreManagement: React.FC = () => {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Current editing form state
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [businessField, setBusinessField] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [bankOwner, setBankOwner] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [representative, setRepresentative] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(true);

  const loadStores = async () => {
    const list = await getStores();
    setStores(list);
    if (list.length > 0) {
      const active = list.find((s) => s.isDefault) || list[0];
      setSelectedStoreId(active.id);
      populateForm(active);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const populateForm = (s: StoreProfile) => {
    setName(s.name);
    setAddress(s.address);
    setPhone(s.phone);
    setBusinessField(s.businessField);
    setBankName(s.bankName || '');
    setBankAccount(s.bankAccount || '');
    setBankOwner(s.bankOwner || '');
    setTaxId(s.taxId || '');
    setRepresentative(s.representative || '');
    setLogoUrl(s.logoUrl || '');
    setIsDefault(!!s.isDefault);
  };

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    const target = stores.find((s) => s.id === storeId);
    if (target) populateForm(target);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên cửa hàng');
      return;
    }

    const updated: StoreProfile = {
      id: selectedStoreId || `store-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      businessField: businessField.trim(),
      bankName: bankName.trim() || undefined,
      bankAccount: bankAccount.trim() || undefined,
      bankOwner: bankOwner.trim() || undefined,
      taxId: taxId.trim() || undefined,
      representative: representative.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      isDefault: isDefault,
    };

    // If marked default, unset other stores
    if (isDefault) {
      for (const s of stores) {
        if (s.id !== updated.id && s.isDefault) {
          await saveStore({ ...s, isDefault: false });
        }
      }
    }

    await saveStore(updated);
    await loadStores();
    showToast('Đã lưu thông tin cửa hàng thành công!');
  };

  const handleAddNewStore = () => {
    const newId = `store-${Date.now()}`;
    setSelectedStoreId(newId);
    setName('CỬA HÀNG MỚI');
    setAddress('');
    setPhone('');
    setBusinessField('Thương mại & Dịch vụ');
    setBankName('');
    setBankAccount('');
    setBankOwner('');
    setTaxId('');
    setRepresentative('');
    setLogoUrl('');
    setIsDefault(false);
  };

  // Image Upload helper (base64)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
        showToast('Đã tải logo thành công!');
      };
      reader.readAsDataURL(file);
    }
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
            Quản Lý Thông Tin Cửa Hàng / Cơ Sở
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Khai báo thông tin hiển thị tại phần đầu Phiếu giao hàng và Bảng kê thu mua.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNewStore}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition"
        >
          <Plus size={15} />
          <span>+ Thêm Cơ Sở Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Store selection list */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Danh Sách Cơ Sở Của Bạn ({stores.length})
          </h3>
          <div className="space-y-2">
            {stores.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectStore(s.id)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedStoreId === s.id
                    ? 'bg-blue-50/80 border-blue-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{s.name}</h4>
                  {s.isDefault && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800">
                      <Star size={10} className="fill-amber-600" /> Mặc định
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 truncate">{s.address}</p>
                <p className="text-[11px] text-blue-700 font-medium mt-0.5">{s.phone}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Store Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase">
                  Chi Tiết Thông Tin Cơ Sở
                </h3>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-700">Đặt làm cơ sở mặc định</span>
              </label>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Tên cửa hàng / Hộ kinh doanh / Công ty <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-bold rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                placeholder="CỬA HÀNG VẬT TƯ NÔNG NGHIỆP AN PHÁT"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="0918 234 567"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Người đại diện / Phụ trách
                </label>
                <input
                  type="text"
                  value={representative}
                  onChange={(e) => setRepresentative(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Nguyễn Văn An"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Địa chỉ trụ sở / Cửa hàng
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Số 128 Nguyễn Huệ, Phường Rạch Sỏi, TP. Rạch Giá, Kiên Giang"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Ngành nghề kinh doanh chính
                </label>
                <input
                  type="text"
                  value={businessField}
                  onChange={(e) => setBusinessField(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Vật tư nông nghiệp, Phân bón & Nông sản"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Mã số thuế (nếu có)
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="1701234567-001"
                />
              </div>
            </div>

            {/* Bank details */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <CreditCard size={14} className="text-slate-600" />
                Thông Tin Tài Khoản Ngân Hàng (In Lên Phiếu Giao Hàng)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Ngân hàng</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
                    placeholder="Vietcombank, MB, Agribank..."
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Số tài khoản</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white font-mono font-bold"
                    placeholder="0091000888999"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Chủ tài khoản</label>
                  <input
                    type="text"
                    value={bankOwner}
                    onChange={(e) => setBankOwner(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white uppercase font-semibold"
                    placeholder="NGUYỄN VĂN AN"
                  />
                </div>
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Logo cửa hàng (Tùy chọn)
              </label>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-14 h-14 object-contain rounded-lg border border-slate-300 bg-white p-1"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50">
                    <ImageIcon size={20} />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-[10px] text-red-600 hover:underline mt-1 block"
                    >
                      Xóa logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition"
              >
                <Save size={16} />
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
