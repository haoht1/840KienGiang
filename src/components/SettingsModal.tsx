import React, { useState, useEffect } from 'react';
import {
  Printer,
  Check,
  Smartphone,
  Save,
} from 'lucide-react';
import { getSettings, saveSettings, AppSettings } from '../utils/storage';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    isDemoMode: false,
    autoPrintPrompt: false,
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const s = await getSettings();
      setSettings(s);
    }
    load();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSave = async () => {
    await saveSettings({ ...settings, isDemoMode: false });
    showToast('Đã lưu cấu hình cài đặt thành công!');
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
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
            Cài Đặt Hệ Thống & Tùy Chọn Xuất File
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cấu hình chuẩn khổ giấy in A4 (Dọc / Ngang) và hướng dẫn cài đặt trên điện thoại.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
        >
          <Save size={15} />
          <span>Lưu Cài Đặt</span>
        </button>
      </div>

      {/* Setting Section 1: Print & Paper format */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Printer size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase">
              Quy Chuẩn Trang In & Xuất File A4
            </h3>
            <p className="text-xs text-slate-500">
              Tự động điều chỉnh khổ giấy tối ưu cho từng loại chứng từ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Phiếu giao hàng</span>
            <p className="text-sm font-bold text-slate-900 mt-1">A4 Chiều Dọc (Portrait)</p>
            <p className="text-[11px] text-slate-400 mt-0.5">210 mm × 297 mm</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Bảng kê thu mua</span>
            <p className="text-sm font-bold text-emerald-800 mt-1">A4 Chiều Ngang (Landscape)</p>
            <p className="text-[11px] text-slate-400 mt-0.5">297 mm × 210 mm</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Độ phân giải xuất PNG</span>
            <p className="text-sm font-bold text-emerald-700 mt-1">200+ DPI (Siêu nét)</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tối ưu gửi qua Zalo / Mobile</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">Bộ chuyển số tiền thành chữ</span>
            <p className="text-sm font-bold text-blue-900 mt-1">Chuẩn Tiếng Việt 100%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Hỗ trợ từ 0 đến hàng nghìn tỷ</p>
          </div>
        </div>
      </div>

      {/* Setting Section 2: Technical Specs & PWA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <Smartphone size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase">
              Tối Ưu Hóa Thiết Bị Di Động & Sử Dụng Offline
            </h3>
            <p className="text-xs text-slate-500">
              Có thể cài đặt lên màn hình chính điện thoại như ứng dụng native
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <p>
            • <strong>Cách cài đặt trên điện thoại iPhone / iPad:</strong> Mở trình duyệt Safari &gt; Nhấn nút <strong>Chia sẻ (Share)</strong> &gt; Chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.
          </p>
          <p>
            • <strong>Cách cài đặt trên điện thoại Android:</strong> Mở trình duyệt Chrome &gt; Nhấn biểu tượng <strong>3 chấm</strong> ở góc trên &gt; Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
