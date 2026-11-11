import React from 'react';
import { Smartphone, Download, QrCode, ShieldCheck, Check, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import contentData from '../data/contentData.json';

interface IpayDownloadSectionProps {
  onNavigateToFaqGuide?: () => void;
}

export const IpayDownloadSection: React.FC<IpayDownloadSectionProps> = ({ onNavigateToFaqGuide }) => {
  const { ipayData, bankInfo } = contentData;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-[#003B70] via-[#004e92] to-[#003B70] text-white rounded-2xl shadow-sm border border-blue-900/40 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold mb-3 border border-white/15">
            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
            <span>Cấu phần 7 • Ngân hàng số thế hệ mới</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            {ipayData.title}
          </h2>
          <p className="text-sm sm:text-base text-blue-100 font-medium mb-4">
            {ipayData.subtitle}
          </p>
          <p className="text-xs sm:text-sm text-blue-200 leading-relaxed max-w-2xl">
            {ipayData.description}
          </p>
        </div>
      </div>

      {/* 2 Download Platforms with Direct Links & QR Codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* iOS Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-all">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Apple iOS (iPhone / iPad)</h3>
                  <p className="text-xs text-slate-500">Tương thích iOS 13.0 trở lên</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-blue-50 text-[#003B70]">
                App Store
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 my-4">
              <div className="p-2 rounded-xl border border-slate-200 bg-white shadow-xs shrink-0">
                <img
                  src={ipayData.ios.qrUrl}
                  alt="QR Code tải VietinBank iPay iOS"
                  className="w-36 h-36 object-contain"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                  <QrCode className="w-4 h-4 text-[#003B70]" />
                  <span>Quét mã QR để tải ngay</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mở ứng dụng Camera trên iPhone và quét mã vuông bên cạnh để truy cập trực tiếp trang cài đặt chính thức từ VietinBank.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <a
              href={ipayData.ios.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Mở trang tải App Store</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Android Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-all">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Google Android (Samsung, Xiaomi, Oppo...)</h3>
                  <p className="text-xs text-slate-500">Tương thích Android 7.0 trở lên</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700">
                Google Play
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 my-4">
              <div className="p-2 rounded-xl border border-slate-200 bg-white shadow-xs shrink-0">
                <img
                  src={ipayData.android.qrUrl}
                  alt="QR Code tải VietinBank iPay Android"
                  className="w-36 h-36 object-contain"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Quét mã QR để tải ngay</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mở Zalo hoặc máy ảnh trên điện thoại Android quét mã bên cạnh để tải ứng dụng VietinBank iPay chính thức từ Google Play Store.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <a
              href={ipayData.android.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Mở trang tải Google Play</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* Key Advantages Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#ED1C24]" />
          <span>Tại sao khách hàng lựa chọn VietinBank iPay?</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ipayData.keyFeatures.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#003B70] flex items-center justify-center font-bold text-xs mb-2">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-slate-900 mb-1">{f.title}</div>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
