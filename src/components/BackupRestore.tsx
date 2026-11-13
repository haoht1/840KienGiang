import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileJson,
  Shield,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { exportAllJSON, importJSON, resetDatabaseToDefault } from '../utils/storage';
import { BackupData } from '../types';

interface Props {
  onDataChanged: () => void;
}

export const BackupRestore: React.FC<Props> = ({ onDataChanged }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [pendingData, setPendingData] = useState<BackupData | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setMessage({ text, type });
  };

  // Export full JSON
  const handleExportFull = async () => {
    try {
      setIsProcessing(true);
      const data = await exportAllJSON();
      const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = `${now.getHours()}${now.getMinutes()}`;
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `SaoLuu_TroLyChungTu_${dateStr}_${timeStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showMessage('Đã tải xuống tệp sao lưu dữ liệu toàn diện thành công!', 'success');
    } catch (err) {
      console.error(err);
      showMessage('Có lỗi xảy ra khi xuất dữ liệu sao lưu', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Dữ liệu không phải JSON hợp lệ');
        }
        setPendingData(parsed as BackupData);
        showMessage(
          `Đã đọc thành công tệp sao lưu (Phiên bản ${parsed.version || '1.0'}). Vui lòng chọn cách nhập dưới đây.`,
          'warning'
        );
      } catch (err: any) {
        showMessage('Tệp JSON không hợp lệ hoặc bị lỗi cấu trúc: ' + (err.message || ''), 'error');
        setPendingData(null);
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (!pendingData) return;
    setIsProcessing(true);
    try {
      const res = await importJSON(pendingData, importMode);
      if (res.success) {
        showMessage(res.message, 'success');
        setPendingData(null);
        onDataChanged();
      }
    } catch (err: any) {
      showMessage('Lỗi khi phục hồi dữ liệu: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset Default Demo
  const handleResetDemo = async () => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn nạp lại Dữ Liệu Mẫu Chuẩn (Bao gồm 15 mặt hàng mẫu các ngành, khách hàng mẫu và chứng từ kiểm thử hàng tỷ đồng)?'
      )
    ) {
      return;
    }
    setIsProcessing(true);
    try {
      await resetDatabaseToDefault();
      showMessage('Đã nạp lại toàn bộ dữ liệu mẫu ban đầu thành công!', 'success');
      onDataChanged();
    } catch (err: any) {
      showMessage('Lỗi khi nạp dữ liệu: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Sao Lưu & Phục Hồi Dữ Liệu Bằng JSON
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Dữ liệu của bạn được lưu an toàn 100% trên trình duyệt cục bộ (IndexedDB). Không lưu lên máy chủ ngoài, bảo mật tối đa số CCCD.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFull}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <Download size={16} />
            <span>Xuất Toàn Bộ Dữ Liệu (JSON)</span>
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : message.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid: 2 Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Export & Backup */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Download size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">1. Xuất Tệp Sao Lưu JSON</h3>
              <p className="text-xs text-slate-500">Lưu trữ dự phòng trên máy tính cá nhân hoặc USB</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 space-y-2 border border-slate-100">
            <p className="font-semibold text-slate-800">Tệp sao lưu bao gồm:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>Toàn bộ danh bạ khách hàng & thông tin CCCD người bán.</li>
              <li>Bảng giá và danh mục hàng hóa (tất cả 9 ngành nghề).</li>
              <li>Tất cả các phiếu giao hàng & bảng kê thu mua đã phát hành.</li>
              <li>Thông tin cơ sở, cửa hàng, tài khoản ngân hàng.</li>
            </ul>
          </div>

          <button
            onClick={handleExportFull}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
          >
            <Download size={16} />
            <span>Tải Xuống Bản Sao Lưu Ngay (.json)</span>
          </button>
        </div>

        {/* Panel 2: Import & Restore */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <Upload size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase">2. Nhập & Phục Hồi Dữ Liệu</h3>
              <p className="text-xs text-slate-500">Khôi phục lại dữ liệu từ tệp JSON đã sao lưu</p>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition space-y-2"
          >
            <FileJson size={32} className="mx-auto text-slate-400" />
            <p className="text-xs font-bold text-slate-800">
              Nhấp vào đây để chọn tệp sao lưu (.json)
            </p>
            <p className="text-[11px] text-slate-500">
              Kiểm tra tính hợp lệ trước khi áp dụng vào hệ thống
            </p>
          </div>

          {/* Pending import choices */}
          {pendingData && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs space-y-3">
              <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle size={15} />
                <span>Chọn phương thức phục hồi:</span>
              </h4>

              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer p-2 rounded bg-white border border-amber-200">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Nhập bổ sung (Gộp) - Khuyên dùng
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Giữ nguyên dữ liệu hiện tại, chỉ thêm các bản ghi mới.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 rounded bg-white border border-amber-200">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5 text-red-600"
                  />
                  <div>
                    <span className="font-bold text-red-700 block">
                      Thay thế toàn bộ (Ghi đè)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Xóa toàn bộ dữ liệu hiện tại và thay bằng tệp sao lưu này.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingData(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-semibold text-xs bg-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isProcessing}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm"
                >
                  Xác nhận Phục Hồi Dữ Liệu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset to Default Demo Data */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw size={16} className="text-amber-600" />
            Khôi Phục Dữ Liệu Mẫu Tiêu Chuẩn (Kiểm Thử 15 Mặt Hàng & Hàng Tỷ Đồng)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Nạp lại dữ liệu mẫu chứa các tình huống hóa đơn hàng tỷ đồng, nhiều người bán, đầy đủ 6 ngành bán hàng và 3 ngành thu mua.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <RotateCcw size={14} />
          <span>Nạp Dữ Liệu Mẫu Kiểm Thử</span>
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
        <Shield size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Chính sách an toàn & bảo mật dữ liệu:</strong> Toàn bộ hồ sơ người mua, thông tin người bán và số Căn cước công dân (CCCD) được lưu trữ hoàn toàn trong kho dữ liệu cục bộ (IndexedDB) của trình duyệt. Ứng dụng không gửi hay đồng bộ dữ liệu này tới máy chủ bên thứ ba nào, đảm bảo tuân thủ nghiêm ngặt quyền riêng tư kinh doanh của bạn.
        </div>
      </div>
    </div>
  );
};
