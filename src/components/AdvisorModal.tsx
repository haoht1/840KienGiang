import React from 'react';
import { Phone, User, X, CheckCircle, ShieldCheck } from 'lucide-react';
import contentData from '../data/contentData.json';

interface AdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  customMessage?: string;
}

export const AdvisorModal: React.FC<AdvisorModalProps> = ({
  isOpen,
  onClose,
  title = 'Liên hệ Cán bộ Quan hệ Khách hàng',
  customMessage,
}) => {
  if (!isOpen) return null;

  const { bankInfo } = contentData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 no-print">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-[#003B70] to-[#005ba3] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-blue-100">{bankInfo.branchName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 mb-5 text-sm text-slate-700 leading-relaxed">
            {customMessage || (
              <>
                Quý khách có thể liên hệ trực tiếp với Cán bộ quan hệ khách hàng tại quầy giao dịch hoặc qua số điện thoại cá nhân bên dưới để được hướng dẫn chi tiết và nhanh chóng nhất.
              </>
            )}
          </div>

          {/* Officer Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 mb-5">
            <div className="w-12 h-12 rounded-full bg-[#003B70] text-white flex items-center justify-center font-bold text-lg shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {bankInfo.advisorTitle}
              </div>
              <div className="text-base font-bold text-slate-900 truncate">
                {bankInfo.advisorName}
              </div>
              <div className="text-sm font-semibold text-[#003B70] flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-[#ED1C24]" />
                <a href={`tel:${bankInfo.advisorPhone}`} className="hover:underline">
                  {bankInfo.advisorPhone}
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <a
              href={`tel:${bankInfo.advisorPhone}`}
              className="flex-1 py-3 px-4 bg-[#ED1C24] hover:bg-red-700 active:scale-98 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>Gọi ngay {bankInfo.advisorPhone}</span>
            </a>
            <button
              onClick={onClose}
              className="py-3 px-5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
