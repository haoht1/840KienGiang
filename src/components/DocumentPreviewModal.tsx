import React, { useRef, useState, useEffect } from 'react';
import { Printer, Download, Image as ImageIcon, Share2, X, ZoomIn, ZoomOut, Check, AlertCircle } from 'lucide-react';
import { DeliveryNote, PurchaseTableDoc } from '../types';
import { A4PrintDeliveryNote } from './A4PrintDeliveryNote';
import { A4PrintPurchaseTable } from './A4PrintPurchaseTable';
import {
  exportElementToPdf,
  exportElementToPng,
  printDocument,
  shareDocument,
  getDeliveryFilename,
  getPurchaseFilename,
  PaperOrientation,
} from '../utils/exportUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'DELIVERY' | 'PURCHASE';
  deliveryNote?: DeliveryNote;
  purchaseTable?: PurchaseTableDoc;
}

export const DocumentPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  documentType,
  deliveryNote,
  purchaseTable,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const orientation: PaperOrientation = documentType === 'PURCHASE' ? 'landscape' : 'portrait';

  const [zoom, setZoom] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auto-fit zoom on small viewports when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const sheetPx = orientation === 'landscape' ? 1123 : 794;
    const available = window.innerWidth - 32;
    if (available < sheetPx) {
      const fit = Math.max(35, Math.floor((available / sheetPx) * 100));
      setZoom(fit);
    } else {
      setZoom(100);
    }
  }, [isOpen, orientation]);

  if (!isOpen) return null;

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setExportMessage({ text, type });
    setTimeout(() => setExportMessage(null), 3500);
  };

  const handlePrint = () => {
    printDocument(orientation);
  };

  const handleExportPdf = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    let filename = 'ChungTu.pdf';

    if (documentType === 'DELIVERY' && deliveryNote) {
      filename = getDeliveryFilename(deliveryNote.customer?.name || 'KhachHang', deliveryNote.date, 'pdf');
    } else if (documentType === 'PURCHASE' && purchaseTable) {
      const firstSeller = purchaseTable.items?.[0]?.sellerName || 'NguoiBan';
      filename = getPurchaseFilename(firstSeller, purchaseTable.date, 'pdf');
    }

    try {
      const ok = await exportElementToPdf(printRef.current, filename, orientation);
      if (ok) {
        showStatus(`Đã xuất tệp PDF thành công: ${filename}`, 'success');
      } else {
        showStatus('Đã mở hộp thoại in để lưu thành PDF', 'success');
      }
    } catch (err) {
      showStatus('Lỗi khi xuất PDF, đang mở cửa sổ in...', 'error');
      printDocument(orientation);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPng = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    let filename = 'ChungTu.png';

    if (documentType === 'DELIVERY' && deliveryNote) {
      filename = getDeliveryFilename(deliveryNote.customer?.name || 'KhachHang', deliveryNote.date, 'png');
    } else if (documentType === 'PURCHASE' && purchaseTable) {
      const firstSeller = purchaseTable.items?.[0]?.sellerName || 'NguoiBan';
      filename = getPurchaseFilename(firstSeller, purchaseTable.date, 'png');
    }

    try {
      const ok = await exportElementToPng(printRef.current, filename, orientation);
      if (ok) {
        showStatus(`Đã lưu ảnh PNG độ nét cao (200+ DPI): ${filename}`, 'success');
      } else {
        showStatus('Không thể xuất ảnh PNG, vui lòng thử lại', 'error');
      }
    } catch (err) {
      showStatus('Có lỗi xảy ra khi tạo ảnh PNG', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    const title =
      documentType === 'DELIVERY'
        ? `Phiếu giao hàng - ${deliveryNote?.customer?.name || ''}`
        : `Bảng kê thu mua - ${purchaseTable?.buyerName || ''}`;
    const text = `Chứng từ tạo từ Trợ Lý Giao Hàng & Thu Mua`;
    const shared = await shareDocument(title, text);
    if (!shared) {
      navigator.clipboard?.writeText(window.location.href);
      showStatus('Đã sao chép liên kết vào bộ nhớ tạm để gửi qua Zalo / tin nhắn!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex flex-col items-center p-2 sm:p-4">
      {/* Top Floating Control Bar */}
      <div className="no-print sticky top-2 z-50 w-full max-w-6xl bg-white border border-slate-200 rounded-xl shadow-2xl p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Document info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-100 text-blue-800">
              {documentType === 'DELIVERY' ? 'Phiếu Giao Hàng' : 'Bảng Kê Thu Mua'}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[260px] sm:max-w-md">
              {documentType === 'DELIVERY'
                ? deliveryNote?.customer?.name || 'Khách hàng'
                : purchaseTable?.buyerName || 'Bảng kê thu mua'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {orientation === 'landscape'
              ? 'Khổ chuẩn: A4 Ngang (297 × 210 mm) • Chuẩn in sắc nét không vỡ chữ'
              : 'Khổ chuẩn: A4 Dọc (210 × 297 mm) • Chuẩn in sắc nét không vỡ chữ'}
          </p>
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(35, z - 10))}
            className="p-1.5 hover:bg-white rounded transition text-slate-700"
            title="Thu nhỏ"
          >
            <ZoomOut size={16} />
          </button>
          <span className="w-12 text-center font-semibold text-slate-700">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(130, z + 10))}
            className="p-1.5 hover:bg-white rounded transition text-slate-700"
            title="Phóng to"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="ml-1 px-2 py-1 text-[11px] font-medium bg-white rounded border border-slate-300 text-slate-600 hover:text-slate-900"
          >
            100%
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
            title="In trực tiếp ra máy in hoặc lưu PDF hệ thống"
          >
            <Printer size={16} />
            <span>In A4</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            title="Tải tệp PDF A4 chất lượng cao"
          >
            <Download size={16} />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất PDF'}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPng}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            title="Tải ảnh PNG độ phân giải 200+ DPI gửi Zalo"
          >
            <ImageIcon size={16} />
            <span>{isExporting ? 'Đang xuất...' : 'Xuất PNG (Ảnh)'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            title="Chia sẻ nhanh"
          >
            <Share2 size={18} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-1 cursor-pointer"
            title="Đóng xem trước"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Export notification popup */}
      {exportMessage && (
        <div
          className={`fixed top-24 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
            exportMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {exportMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{exportMessage.text}</span>
        </div>
      )}

      {/* Sheet Container with Zoom */}
      <div className="w-full flex justify-center pb-12 overflow-x-auto">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="print-container shadow-2xl bg-white border border-slate-300 rounded shrink-0"
        >
          <div ref={printRef} className="print-target">
            {documentType === 'DELIVERY' && deliveryNote && (
              <A4PrintDeliveryNote note={deliveryNote} />
            )}
            {documentType === 'PURCHASE' && purchaseTable && (
              <A4PrintPurchaseTable doc={purchaseTable} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
