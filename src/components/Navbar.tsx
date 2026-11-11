import React, { useState, useEffect } from 'react';
import { Phone, ChevronRight, Eye } from 'lucide-react';
import contentData from '../data/contentData.json';
import { getVisitorCount, recordVisitOnLoad } from '../utils/visitorTracker';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenAdvisorModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onOpenAdvisorModal }) => {
  const { bankInfo, modules } = contentData;
  const [visitorCount, setVisitorCount] = useState<number>(() => recordVisitOnLoad());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setVisitorCount(e.detail || getVisitorCount());
    };
    window.addEventListener('vtb_visitor_update', handleUpdate);
    return () => window.removeEventListener('vtb_visitor_update', handleUpdate);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs no-print">
      {/* Top micro bar for VietinBank Kiên Giang branch */}
      <div className="bg-[#003B70] text-white text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wide">{bankInfo.fullName}</span>
          <span className="hidden sm:inline opacity-60">|</span>
          <span className="hidden sm:inline font-medium text-blue-200">{bankInfo.branchName}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          {/* Visitor Counter */}
          <div className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-2.5 py-0.5 rounded-full text-blue-100 font-medium transition-colors cursor-default" title="Số lượt khách truy cập tích lũy vào Kiosk VietinBank">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Eye className="w-3 h-3 text-emerald-300" />
            <span>Lượt truy cập: <strong className="text-white font-mono">{visitorCount.toLocaleString('vi-VN')}</strong></span>
          </div>

          <span className="hidden md:inline text-blue-100">
            Cán bộ tư vấn: <strong className="text-white">{bankInfo.advisorName}</strong> ({bankInfo.advisorPhone})
          </span>
          <a
            href={`tel:${bankInfo.advisorPhone}`}
            className="flex items-center gap-1.5 text-amber-300 hover:text-white transition-colors font-medium"
          >
            <Phone className="w-3 h-3" />
            <span>Hotline: {bankInfo.advisorPhone}</span>
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand Wordmark & Logo */}
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-3 text-left group shrink-0 focus:outline-none"
          >
            <img
              src={bankInfo.logoUrl}
              alt="VietinBank Logo"
              referrerPolicy="no-referrer"
              className="h-10 w-auto object-contain rounded-xs"
              onError={(e) => {
                // Fallback styling if remote image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="bg-[#003B70] px-3 py-1.5 rounded-xl shadow-xs">
              <div className="text-lg font-extrabold text-white tracking-tight leading-none">
                Vietin<span className="text-white">Bank</span>
              </div>
              <div className="text-[10px] tracking-wider uppercase text-blue-200 font-semibold mt-0.5">
                Kiosk Giao Dịch Kiên Giang
              </div>
            </div>
          </button>

          {/* Zone 2: Navigation Links for 8 features (Horizontal scrollable on tablet, dropdown/icon on mobile) */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {modules.map((m) => {
              const isActive = activeTab === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectTab(m.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#003B70] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#003B70] hover:bg-slate-100'
                  }`}
                >
                  {m.title}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenAdvisorModal}
              className="px-4 py-2 text-xs font-bold text-white bg-[#ED1C24] hover:bg-red-700 active:scale-95 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Gặp Tư Vấn Viên</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Module Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto pb-2 pt-1 border-t border-slate-100 custom-scrollbar">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'home' ? 'bg-[#003B70] text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            Trang chủ
          </button>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectTab(m.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                activeTab === m.id
                  ? 'bg-[#003B70] text-white'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {m.title}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
