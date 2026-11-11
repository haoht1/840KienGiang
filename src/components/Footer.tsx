import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Globe, Shield } from 'lucide-react';
import contentData from '../data/contentData.json';
import { getVisitorCount } from '../utils/visitorTracker';

interface FooterProps {
  onSelectTab: (tabId: string) => void;
  onOpenAdvisorModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, onOpenAdvisorModal }) => {
  const { bankInfo } = contentData;
  const [visitorCount, setVisitorCount] = useState<number>(() => getVisitorCount());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setVisitorCount(e.detail || getVisitorCount());
    };
    window.addEventListener('vtb_visitor_update', handleUpdate);
    return () => window.removeEventListener('vtb_visitor_update', handleUpdate);
  }, []);

  return (
    <footer className="bg-slate-900 text-slate-300 text-xs mt-16 border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Branch */}
          <div className="space-y-3">
            <div className="text-white text-base font-extrabold tracking-tight">
              Vietin<span className="text-white">Bank</span>
            </div>
            <div className="text-slate-400 font-semibold text-xs uppercase">
              {bankInfo.fullName}
            </div>
            <div className="text-white font-bold text-xs">
              {bankInfo.branchName}
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Ứng dụng hỗ trợ giao dịch viên và khách hàng tại quầy giao dịch, tối ưu trải nghiệm dịch vụ ngân hàng số hiện đại.
            </p>
          </div>

          {/* Col 2: Liên hệ Cán bộ phụ trách */}
          <div className="space-y-2">
            <div className="text-white font-bold text-xs uppercase tracking-wider mb-2">
              Cán bộ Quan hệ Khách hàng
            </div>
            <div className="text-white font-semibold text-sm">
              {bankInfo.advisorName}
            </div>
            <div className="text-slate-400 text-xs">
              {bankInfo.advisorTitle}
            </div>
            <div className="pt-1">
              <a
                href={`tel:${bankInfo.advisorPhone}`}
                className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{bankInfo.advisorPhone}</span>
              </a>
            </div>
            <button
              onClick={onOpenAdvisorModal}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline block cursor-pointer"
            >
              Xem thông tin hỗ trợ chi tiết
            </button>
          </div>

          {/* Col 3: Phím tắt tính năng */}
          <div className="space-y-2">
            <div className="text-white font-bold text-xs uppercase tracking-wider mb-2">
              Tiện ích tra cứu
            </div>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <button onClick={() => onSelectTab('faq')} className="hover:text-white transition-colors cursor-pointer">
                  Giải đáp thắc mắc dịch vụ
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('ipay')} className="hover:text-white transition-colors cursor-pointer">
                  Tải App VietinBank iPay Mobile
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('savings')} className="hover:text-white transition-colors cursor-pointer">
                  Công cụ tính lãi tiền gửi
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('loan')} className="hover:text-white transition-colors cursor-pointer">
                  Bảng tính lịch trả nợ khoản vay
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('checklist')} className="hover:text-white transition-colors cursor-pointer">
                  Lập checklist hồ sơ tín dụng A4
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Cam kết an toàn & Bản quyền */}
          <div className="space-y-3">
            <div className="text-white font-bold text-xs uppercase tracking-wider">
              An toàn & Bảo mật
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Mọi công cụ tính toán và biểu mẫu lập checklist được phát triển phục vụ công tác tư vấn chuyên nghiệp tại VietinBank Chi nhánh Kiên Giang.
            </p>
            <div className="pt-2 text-slate-500 text-[10px] space-y-1">
              <div>© {new Date().getFullYear()} Ngân hàng TMCP Công Thương Việt Nam.</div>
              <div className="text-slate-400 font-medium flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Hệ thống ghi nhận: <strong className="text-white font-mono">{visitorCount.toLocaleString('vi-VN')}</strong> lượt truy cập quầy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
