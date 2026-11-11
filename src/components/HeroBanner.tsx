import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Smartphone, 
  Gamepad2, 
  PiggyBank, 
  Calculator, 
  Sparkles, 
  MapPin, 
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Clock,
  PhoneCall,
  Eye
} from 'lucide-react';
import contentData from '../data/contentData.json';
import { getVisitorCount, incrementVisitorCount } from '../utils/visitorTracker';

interface HeroBannerProps {
  onSelectModule: (moduleId: string) => void;
  onOpenAdvisorModal: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  HelpCircle: <HelpCircle className="w-6 h-6 text-blue-600" />,
  Smartphone: <Smartphone className="w-6 h-6 text-emerald-600" />,
  Gamepad2: <Gamepad2 className="w-6 h-6 text-purple-600" />,
  PiggyBank: <PiggyBank className="w-6 h-6 text-amber-600" />,
  Calculator: <Calculator className="w-6 h-6 text-indigo-600" />,
  Sparkles: <Sparkles className="w-6 h-6 text-rose-600" />,
  MapPin: <MapPin className="w-6 h-6 text-red-600" />,
  FileCheck: <FileCheck className="w-6 h-6 text-cyan-600" />,
};

export const HeroBanner: React.FC<HeroBannerProps> = ({ onSelectModule, onOpenAdvisorModal }) => {
  const { bankInfo, modules } = contentData;
  const [visitorCount, setVisitorCount] = useState<number>(() => getVisitorCount());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setVisitorCount(e.detail || getVisitorCount());
    };
    window.addEventListener('vtb_visitor_update', handleUpdate);
    return () => window.removeEventListener('vtb_visitor_update', handleUpdate);
  }, []);

  const handleCardClick = (moduleId: string) => {
    incrementVisitorCount();
    onSelectModule(moduleId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Image with Collective Photo & Hero Greeting */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 bg-[#003B70] text-white">
        <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
          <img
            src={bankInfo.bannerUrl}
            alt="Tập thể VietinBank Chi nhánh Kiên Giang"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
            onError={(e) => {
              // Graceful styled fallback if GitHub temporary token expires
              const target = e.target as HTMLElement;
              target.style.display = 'none';
            }}
          />
          {/* Measured Scrim for legibility per Frontend Design Constitution */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#002242] via-[#003B70]/60 to-transparent" />
          
          {/* Hero Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Chào mừng Quý khách đến với {bankInfo.branchName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 text-balance">
                Kiosk Tương Tác & Tiện Ích Giao Dịch Tại Quầy
              </h1>
              <p className="text-sm sm:text-base text-blue-100 max-w-2xl line-clamp-2 sm:line-clamp-none font-normal">
                Giải đáp thắc mắc dịch vụ iPay, tính lãi tiền gửi & lịch trả nợ khoản vay, trải nghiệm game nhận voucher xăng, cập nhật ưu đãi và lập checklist hồ sơ tín dụng nhanh chóng.
              </p>
              
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onSelectModule('faq')}
                  className="px-4 py-2 bg-[#ED1C24] hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Bắt đầu tra cứu nhanh</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenAdvisorModal}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-amber-300" />
                  <span>Cán bộ phụ trách: {bankInfo.advisorName}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Feature Action Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Danh mục tiện ích tại quầy
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Chạm vào tiện ích Quý khách muốn thao tác hoặc trải nghiệm
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-[#003B70]">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã có <strong className="font-mono text-[#ED1C24]">{visitorCount.toLocaleString('vi-VN')}</strong> lượt tương tác</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Phục vụ: 7h30 - 16h45</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => handleCardClick(m.id)}
              className="group p-5 bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-50 transition-all">
                  {iconMap[m.icon] || <Sparkles className="w-6 h-6 text-[#003B70]" />}
                </div>
                <div className="text-xs font-bold text-slate-400 mb-1">
                  Tiện ích 0{idx + 1}
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#003B70] transition-colors leading-snug">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {m.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#003B70] group-hover:text-[#ED1C24] transition-colors">
                <span>Trải nghiệm ngay</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
