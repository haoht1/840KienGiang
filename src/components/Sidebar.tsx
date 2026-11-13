import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Files,
  Users,
  Package,
  Building2,
  HardDriveDownload,
  Settings,
  ChevronRight,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'delivery_create'
  | 'purchase_create'
  | 'documents'
  | 'customers'
  | 'products'
  | 'store'
  | 'backup'
  | 'settings';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  storeName?: string;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  storeName = 'Hộ Kinh Doanh An Phát',
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'delivery_create',
      label: 'Tạo phiếu giao hàng',
      icon: <FileText size={18} />,
      badge: 'Nhanh',
    },
    {
      id: 'purchase_create',
      label: 'Tạo bảng kê thu mua',
      icon: <Receipt size={18} />,
      badge: 'A4 Ngang',
    },
    {
      id: 'documents',
      label: 'Danh sách chứng từ',
      icon: <Files size={18} />,
    },
    {
      id: 'customers',
      label: 'Danh sách khách hàng',
      icon: <Users size={18} />,
    },
    {
      id: 'products',
      label: 'Danh mục hàng hóa',
      icon: <Package size={18} />,
    },
    {
      id: 'store',
      label: 'Quản lý cửa hàng',
      icon: <Building2 size={18} />,
    },
    {
      id: 'backup',
      label: 'Sao lưu & Phục hồi',
      icon: <HardDriveDownload size={18} />,
    },
    {
      id: 'settings',
      label: 'Cài đặt hệ thống',
      icon: <Settings size={18} />,
    },
  ];

  return (
    <aside className="w-64 bg-[#0a192f] text-slate-300 flex flex-col shrink-0 h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-lg">
            VT
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white tracking-tight truncate leading-tight">
              TRỢ LÝ CHỨNG TỪ
            </h1>
            <p className="text-[10px] text-sky-400 font-medium truncate">
              Giao Hàng & Thu Mua Nhanh
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Menu chính
        </p>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span
                  className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-sky-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight size={14} className="text-blue-300" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Store Footprint */}
      <div className="p-3 border-t border-slate-800 bg-[#071324]">
        <div className="px-2 py-1 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="truncate mr-2">
            <span className="block text-[9px] uppercase tracking-wider text-slate-400">Cơ sở hoạt động</span>
            <span className="font-semibold text-slate-200 truncate block">{storeName}</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Dữ liệu lưu an toàn cục bộ" />
        </div>
      </div>
    </aside>
  );
};
