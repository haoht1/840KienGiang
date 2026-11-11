import React, { useState } from 'react';
import { MapPin, Phone, Clock, ExternalLink, Search, Building2, Navigation } from 'lucide-react';
import contentData from '../data/contentData.json';
import { BranchItem } from '../types';

export const BranchNetworkSection: React.FC = () => {
  const { branchLocations, bankInfo } = contentData;
  const branches = branchLocations as BranchItem[];

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);

  const filteredBranches = branches.filter((b) => {
    const q = searchTerm.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q) || b.phone.includes(q);
  });

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#003B70] via-[#004e92] to-[#003B70] text-white rounded-2xl shadow-sm border border-blue-900/40">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl text-amber-300">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
              Cấu phần 4 • Mạng Lưới Điểm Giao Dịch
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              Hệ Thống Chi Nhánh & Phòng Giao Dịch
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              {bankInfo.branchName} — Tra cứu nhanh 08 địa điểm phòng giao dịch, giờ hoạt động, chỉ đường Google Maps và gọi hotline trực tiếp.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên phòng giao dịch, địa chỉ, hoặc số điện thoại..."
          className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2"
          >
            Xóa
          </button>
        )}
      </div>

      {/* 8 Branch Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBranches.map((b) => {
          const isSelected = selectedBranchId === b.id;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedBranchId(b.id)}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-[#003B70] shadow-md ring-2 ring-blue-100'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Branch Photo */}
              <div className="relative h-36 bg-slate-100 overflow-hidden">
                <img
                  src={b.imageUrl}
                  alt={b.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#003B70]/90 text-white text-[10px] font-bold">
                  {b.id === 1 ? 'Trụ sở Chi nhánh' : `PGD 0${b.id}`}
                </div>
              </div>

              {/* Branch Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                    {b.name}
                  </h3>
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-[#ED1C24] shrink-0 mt-0.5" />
                    <span>{b.address}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{b.hours}</span>
                  </div>

                  {/* Hotline: Click to call immediately as requested */}
                  <div className="flex items-center justify-between">
                    <a
                      href={`tel:${b.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 font-bold text-[#003B70] hover:text-[#ED1C24] transition-colors"
                      title="Bấm gọi ngay"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#ED1C24]" />
                      <span>{b.phone}</span>
                    </a>

                    {/* Google Maps Link with Icon */}
                    <a
                      href={b.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                      title="Mở chỉ đường Google Maps"
                    >
                      <Navigation className="w-3 h-3 text-[#003B70]" />
                      <span>Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
