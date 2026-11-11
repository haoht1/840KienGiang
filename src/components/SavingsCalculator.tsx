import React, { useState, useMemo } from 'react';
import { PiggyBank, Calculator, ExternalLink, AlertCircle, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import contentData from '../data/contentData.json';

export const SavingsCalculator: React.FC = () => {
  const { savingsData } = contentData;

  const [depositAmountStr, setDepositAmountStr] = useState<string>('100,000,000');
  const [selectedTermMonths, setSelectedTermMonths] = useState<number>(12);
  const [interestRateStr, setInterestRateStr] = useState<string>('4.7');
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Parsing & validation
  const depositAmount = useMemo(() => {
    const raw = depositAmountStr.replace(/[^0-9]/g, '');
    return raw ? parseInt(raw, 10) : 0;
  }, [depositAmountStr]);

  const interestRate = useMemo(() => {
    const parsed = parseFloat(interestRateStr);
    return isNaN(parsed) ? 0 : parsed;
  }, [interestRateStr]);

  // Validation errors following PDF rules strictly
  const errors = useMemo(() => {
    const errs: { deposit?: string; term?: string; rate?: string } = {};

    if (!depositAmountStr.trim() || depositAmount <= 0 || depositAmount < savingsData.minDeposit) {
      errs.deposit = 'Vui lòng nhập số tiền gửi hợp lệ.';
    }

    if (!selectedTermMonths || selectedTermMonths <= 0) {
      errs.term = 'Vui lòng chọn kỳ hạn gửi.';
    }

    if (!interestRateStr.trim() || interestRate < 0 || interestRate > 20) {
      errs.rate = 'Vui lòng nhập lãi suất hợp lệ.';
    }

    return errs;
  }, [depositAmountStr, depositAmount, selectedTermMonths, interestRateStr, interestRate, savingsData.minDeposit]);

  const isValid = Object.keys(errors).length === 0;

  // Calculation: Trả lãi sau: Lãi = Tiền gửi * (Lãi suất/100) * (Số tháng / 12)
  const calculationResult = useMemo(() => {
    if (!isValid) {
      return { interest: 0, total: 0 };
    }
    const interest = Math.round(depositAmount * (interestRate / 100) * (selectedTermMonths / 12));
    const total = depositAmount + interest;
    return { interest, total };
  }, [depositAmount, interestRate, selectedTermMonths, isValid]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasInteracted(true);
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (!rawVal) {
      setDepositAmountStr('');
      return;
    }
    const num = parseInt(rawVal, 10);
    setDepositAmountStr(num.toLocaleString('en-US'));
  };

  const handleTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setHasInteracted(true);
    const months = parseInt(e.target.value, 10);
    setSelectedTermMonths(months);
    const match = savingsData.termOptions.find((t) => t.months === months);
    if (match) {
      setInterestRateStr(match.rate.toString());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#003B70] to-[#014f94] text-white rounded-2xl shadow-sm border border-blue-900/40">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl text-amber-300">
            <PiggyBank className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
              Cấu phần 2 • Tiền Gửi Tiết Kiệm VietinBank
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              {savingsData.title}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              {savingsData.subTitle} — Tính toán số tiền lãi sinh lời dự tính và tổng tiền nhận về khi đáo hạn.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#003B70]" />
            <span>Thông số tiền gửi dự tính</span>
          </h3>

          {/* Input 1: Số tiền gửi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tổng tiền gửi (VND) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={depositAmountStr}
                onChange={handleAmountChange}
                placeholder="Ví dụ: 100,000,000"
                className={`w-full px-4 py-3 rounded-xl border text-base font-semibold text-slate-900 pr-16 focus:outline-none focus:ring-2 transition-all ${
                  hasInteracted && errors.deposit
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:ring-blue-100 focus:border-[#003B70]'
                }`}
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                VND
              </span>
            </div>
            {hasInteracted && errors.deposit ? (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.deposit}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Số tiền tối thiểu: {savingsData.minDeposit.toLocaleString()} VND
              </p>
            )}
          </div>

          {/* Input 2: Kỳ hạn gửi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kỳ hạn gửi (Tháng) <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTermMonths}
              onChange={handleTermChange}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                hasInteracted && errors.term
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-slate-300 focus:ring-blue-100 focus:border-[#003B70]'
              }`}
            >
              <option value="">Chọn kỳ hạn</option>
              {savingsData.termOptions.map((opt) => (
                <option key={opt.months} value={opt.months}>
                  {opt.label} — Lãi suất tham khảo {opt.rate}%/năm
                </option>
              ))}
            </select>
            {hasInteracted && errors.term && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.term}</span>
              </p>
            )}
          </div>

          {/* Input 3: Lãi suất */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lãi suất (%/năm) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="0"
                max="20"
                value={interestRateStr}
                onChange={(e) => {
                  setHasInteracted(true);
                  setInterestRateStr(e.target.value);
                }}
                className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold text-slate-900 pr-16 focus:outline-none focus:ring-2 transition-all ${
                  hasInteracted && errors.rate
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:ring-blue-100 focus:border-[#003B70]'
                }`}
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                %/năm
              </span>
            </div>
            {hasInteracted && errors.rate && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.rate}</span>
              </p>
            )}
          </div>

          {/* Quick preset amount chips */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Chọn nhanh số tiền:
            </span>
            <div className="flex flex-wrap gap-2">
              {[20000000, 50000000, 100000000, 200000000, 500000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setHasInteracted(true);
                    setDepositAmountStr(amt.toLocaleString('en-US'));
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:border-[#003B70] hover:text-[#003B70] bg-slate-50 transition-all cursor-pointer"
                >
                  {(amt / 1000000).toLocaleString()} triệu
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results Card */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-gradient-to-br from-[#003B70] to-[#012f5a] text-white rounded-2xl p-6 shadow-md border border-blue-900 space-y-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                KẾT QUẢ DỰ TÍNH
              </div>
              <h4 className="text-lg font-bold text-white">
                Tiền lãi & Tổng tiền khi đáo hạn
              </h4>
            </div>

            {/* Interest amount */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/10">
              <span className="text-xs font-medium text-blue-100 block mb-1">
                Số tiền lãi dự tính:
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
                {calculationResult.interest.toLocaleString('vi-VN')} <span className="text-sm font-bold text-white">VND</span>
              </div>
            </div>

            {/* Total payout */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/10">
              <span className="text-xs font-medium text-blue-100 block mb-1">
                Tổng tiền nhận về (Gốc + Lãi):
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {calculationResult.total.toLocaleString('vi-VN')} <span className="text-sm font-bold text-blue-200">VND</span>
              </div>
            </div>

            {/* Summary details */}
            <div className="pt-2 border-t border-white/10 space-y-2 text-xs text-blue-100">
              <div className="flex justify-between">
                <span>Số tiền gốc gửi:</span>
                <strong className="text-white font-bold">{depositAmount.toLocaleString('vi-VN')} VND</strong>
              </div>
              <div className="flex justify-between">
                <span>Kỳ hạn đã chọn:</span>
                <strong className="text-white font-bold">{selectedTermMonths} tháng</strong>
              </div>
              <div className="flex justify-between">
                <span>Lãi suất áp dụng:</span>
                <strong className="text-amber-300 font-bold">{interestRate}% / năm</strong>
              </div>
            </div>
          </div>

          {/* Video Guide Link directly from PDF 2 */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xs border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Video clip hướng dẫn
              </div>
              <p className="text-xs text-slate-300">
                Xem video hướng dẫn gửi tiết kiệm online nhận lãi suất cao trên TikTok
              </p>
            </div>
            <a
              href={savingsData.videoGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#ED1C24] hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
            >
              <span>Xem video</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
