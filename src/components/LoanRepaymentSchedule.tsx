import React, { useState, useMemo } from 'react';
import { Calculator, Calendar, FileText, ChevronRight, X, Download, Printer, ArrowUpDown, DollarSign } from 'lucide-react';
import contentData from '../data/contentData.json';

interface ScheduleRow {
  period: number;
  dateStr: string;
  remainingPrincipal: number;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
}

export const LoanRepaymentSchedule: React.FC = () => {
  const { loanData } = contentData;

  // Form states
  const [assetValueStr, setAssetValueStr] = useState<string>('33,333,333,333');
  const [loanAmountStr, setLoanAmountStr] = useState<string>('6,666,666,667');
  const [loanTermMonths, setLoanTermMonths] = useState<number>(240);
  const [annualRateStr, setAnnualRateStr] = useState<string>('8.0');
  const [disbursementDate, setDisbursementDate] = useState<string>('2026-06-16');
  const [repaymentCycle, setRepaymentCycle] = useState<'monthly' | 'quarterly' | 'semiannual' | 'annual'>('monthly');
  const [dueDayOfMonth, setDueDayOfMonth] = useState<number>(25);
  const [roundingUnit, setRoundingUnit] = useState<'1' | '1000'>('1');

  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Parsing numbers
  const loanAmount = useMemo(() => {
    const raw = loanAmountStr.replace(/[^0-9]/g, '');
    return raw ? parseInt(raw, 10) : 0;
  }, [loanAmountStr]);

  const assetValue = useMemo(() => {
    const raw = assetValueStr.replace(/[^0-9]/g, '');
    return raw ? parseInt(raw, 10) : 0;
  }, [assetValueStr]);

  const annualRate = useMemo(() => {
    const parsed = parseFloat(annualRateStr);
    return isNaN(parsed) ? 0 : parsed;
  }, [annualRateStr]);

  // Determine number of periods and rate per period
  const { totalPeriods, periodRate } = useMemo(() => {
    let divisor = 12;
    let monthsPerPeriod = 1;
    if (repaymentCycle === 'quarterly') {
      divisor = 4;
      monthsPerPeriod = 3;
    } else if (repaymentCycle === 'semiannual') {
      divisor = 2;
      monthsPerPeriod = 6;
    } else if (repaymentCycle === 'annual') {
      divisor = 1;
      monthsPerPeriod = 12;
    }

    const periods = Math.max(1, Math.round(loanTermMonths / monthsPerPeriod));
    const rate = annualRate / 100 / divisor;
    return { totalPeriods: periods, periodRate: rate, monthsPerPeriod };
  }, [loanTermMonths, repaymentCycle, annualRate]);

  // Compute schedule table rows
  const scheduleData = useMemo(() => {
    if (loanAmount <= 0 || totalPeriods <= 0) {
      return { rows: [], totalPrincipal: 0, totalInterest: 0, totalPayment: 0, firstMonthPay: 0, lastMonthPay: 0 };
    }

    const round = (val: number) => {
      if (roundingUnit === '1000') {
        return Math.round(val / 1000) * 1000;
      }
      return Math.round(val);
    };

    const regularPrincipal = round(loanAmount / totalPeriods);
    const rows: ScheduleRow[] = [];

    let currentRemaining = loanAmount;
    let accumulatedPrincipal = 0;
    let totalInterest = 0;

    // Date generation logic
    const startDate = new Date(disbursementDate);

    for (let p = 1; p <= totalPeriods; p++) {
      // Calculate date for period p
      const payDate = new Date(startDate);
      let stepMonths = p;
      if (repaymentCycle === 'quarterly') stepMonths = p * 3;
      if (repaymentCycle === 'semiannual') stepMonths = p * 6;
      if (repaymentCycle === 'annual') stepMonths = p * 12;

      payDate.setMonth(startDate.getMonth() + stepMonths);
      payDate.setDate(dueDayOfMonth);

      const dateFormatted = `${payDate.getDate().toString().padStart(2, '0')}/${(payDate.getMonth() + 1).toString().padStart(2, '0')}/${payDate.getFullYear()}`;

      // Principal payment: adjust in the final period to eliminate rounding discrepancies
      let pPay = regularPrincipal;
      if (p === totalPeriods) {
        pPay = loanAmount - accumulatedPrincipal;
      }
      accumulatedPrincipal += pPay;

      // Interest on remaining balance at beginning of period
      const intPay = round(currentRemaining * periodRate);
      totalInterest += intPay;

      const totPay = pPay + intPay;

      rows.push({
        period: p,
        dateStr: dateFormatted,
        remainingPrincipal: currentRemaining,
        principalPayment: pPay,
        interestPayment: intPay,
        totalPayment: totPay,
      });

      currentRemaining = Math.max(0, currentRemaining - pPay);
    }

    const firstMonthPay = rows.length > 0 ? rows[0].totalPayment : 0;
    const lastMonthPay = rows.length > 0 ? rows[rows.length - 1].totalPayment : 0;

    return {
      rows,
      totalPrincipal: loanAmount,
      totalInterest,
      totalPayment: loanAmount + totalInterest,
      firstMonthPay,
      lastMonthPay,
    };
  }, [loanAmount, totalPeriods, periodRate, disbursementDate, repaymentCycle, dueDayOfMonth, roundingUnit]);

  const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (!rawVal) {
      setLoanAmountStr('');
      return;
    }
    setLoanAmountStr(parseInt(rawVal, 10).toLocaleString('en-US'));
  };

  const handleAssetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (!rawVal) {
      setAssetValueStr('');
      return;
    }
    setAssetValueStr(parseInt(rawVal, 10).toLocaleString('en-US'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#003B70] to-[#014f94] text-white rounded-2xl shadow-sm border border-blue-900/40">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl text-amber-300">
            <Calculator className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
              Cấu phần 3 • Tín Dụng & Cho Vay VietinBank
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              {loanData.title}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              {loanData.subTitle} — Trả gốc đều mỗi kỳ, tiền lãi tính trên dư nợ thực tế giảm dần theo thời gian.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Strictly number input per instructions */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Thông tin khoản vay</span>
            <span className="text-xs text-blue-800 font-semibold bg-blue-50 px-2.5 py-1 rounded-md">
              Nhập liệu chính xác
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Giá trị bất động sản */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Giá trị tài sản / BĐS (VND)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={assetValueStr}
                  onChange={handleAssetInput}
                  placeholder="33,333,333,333"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 pr-14 focus:outline-none focus:border-[#003B70] focus:ring-1 focus:ring-blue-100"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  VND
                </span>
              </div>
            </div>

            {/* Số tiền vay - STRICTLY NUMBER INPUT */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Số tiền vay (VND) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loanAmountStr}
                  onChange={handleAmountInput}
                  placeholder="6,666,666,667"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#003B70] pr-14 focus:outline-none focus:border-[#003B70] focus:ring-1 focus:ring-blue-100"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  VND
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Thời gian vay */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Thời gian vay (Tháng) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="420"
                  value={loanTermMonths}
                  onChange={(e) => setLoanTermMonths(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 pr-16 focus:outline-none focus:border-[#003B70]"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  Tháng
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Tương đương {(loanTermMonths / 12).toFixed(1)} năm
              </span>
            </div>

            {/* Lãi suất */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lãi suất (%/Năm) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={annualRateStr}
                  onChange={(e) => setAnnualRateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 pr-16 focus:outline-none focus:border-[#003B70]"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  %/Năm
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Ngày giải ngân */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày giải ngân
              </label>
              <input
                type="date"
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#003B70]"
              />
            </div>

            {/* Chu kỳ trả nợ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Chu kỳ trả nợ
              </label>
              <select
                value={repaymentCycle}
                onChange={(e) => setRepaymentCycle(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#003B70]"
              >
                {loanData.cycleOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ngày trả nợ định kỳ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày trả định kỳ
              </label>
              <select
                value={dueDayOfMonth}
                onChange={(e) => setDueDayOfMonth(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#003B70]"
              >
                {[5, 10, 15, 20, 25, 28].map((d) => (
                  <option key={d} value={d}>
                    Ngày {d} hàng tháng
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quy tắc làm tròn */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Quy tắc làm tròn:</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="rounding"
                  checked={roundingUnit === '1'}
                  onChange={() => setRoundingUnit('1')}
                  className="accent-[#003B70]"
                />
                <span>Đơn vị đồng</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="rounding"
                  checked={roundingUnit === '1000'}
                  onChange={() => setRoundingUnit('1000')}
                  className="accent-[#003B70]"
                />
                <span>1.000 đồng</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Summary Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#003B70] to-[#002242] text-white rounded-2xl p-6 shadow-md border border-blue-900 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  TỔNG QUAN NGHĨA VỤ
                </span>
                <h4 className="text-base font-bold text-white">Số tiền trả hàng tháng</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-lg">
                $
              </div>
            </div>

            {/* Range of payment (Tháng đầu -> Tháng cuối) */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/10">
              <div className="text-xs text-blue-200 mb-1">Số tiền trả hàng tháng:</div>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-xs text-blue-300 block">Tháng đầu tiên:</span>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                    {scheduleData.firstMonthPay.toLocaleString('vi-VN')}{' '}
                    <span className="text-xs font-semibold text-white">VND</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-blue-300 block">Tháng cuối cùng:</span>
                  <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                    {scheduleData.lastMonthPay.toLocaleString('vi-VN')}{' '}
                    <span className="text-xs font-semibold text-blue-200">VND</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total interest & Total payable */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-blue-200">Tổng tiền vay ban đầu:</span>
                <strong className="text-white font-mono font-bold">
                  {loanAmount.toLocaleString('vi-VN')} VND
                </strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-blue-200">Tổng lãi phải trả:</span>
                <strong className="text-amber-300 font-mono font-bold">
                  {scheduleData.totalInterest.toLocaleString('vi-VN')} VND
                </strong>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-blue-200 font-semibold">Tổng gốc và lãi:</span>
                <strong className="text-white font-mono font-bold text-sm">
                  {scheduleData.totalPayment.toLocaleString('vi-VN')} VND
                </strong>
              </div>
            </div>
          </div>

          {/* Action button "Xem chi tiết" opens detailed schedule table */}
          <div className="pt-6">
            <button
              onClick={() => setIsDetailModalOpen(true)}
              className="w-full py-3.5 px-4 bg-[#ED1C24] hover:bg-red-700 active:scale-98 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Xem chi tiết bảng tính lịch trả nợ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Full Detailed Repayment Schedule Table */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#003B70] text-white p-4 sm:p-5 rounded-t-2xl flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  Bảng tính lịch trả nợ với dư nợ giảm dần
                </h3>
                <p className="text-xs text-blue-200">
                  Số tiền vay: {loanAmount.toLocaleString('vi-VN')} VND • {loanTermMonths} tháng • Lãi suất: {annualRate}%/năm
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table Container */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700 border-collapse">
                  <thead className="bg-[#003B70] text-white uppercase text-[11px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-3 text-center border-r border-blue-800">STT</th>
                      <th className="py-3 px-3 border-r border-blue-800">Kỳ trả nợ</th>
                      <th className="py-3 px-3 text-right border-r border-blue-800">Số gốc còn lại</th>
                      <th className="py-3 px-3 text-right border-r border-blue-800">Gốc</th>
                      <th className="py-3 px-3 text-right border-r border-blue-800">Lãi</th>
                      <th className="py-3 px-3 text-right">Tổng gốc + Lãi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {/* Period 0 row as shown in user's PDF sample */}
                    <tr className="bg-slate-50 font-bold text-slate-800">
                      <td className="py-2.5 px-3 text-center">0</td>
                      <td className="py-2.5 px-3">{scheduleData.rows[0]?.dateStr || '16/06/2026'}</td>
                      <td className="py-2.5 px-3 text-right text-[#003B70]">
                        {loanAmount.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right">-</td>
                      <td className="py-2.5 px-3 text-right">-</td>
                      <td className="py-2.5 px-3 text-right">-</td>
                    </tr>

                    {scheduleData.rows.map((row) => (
                      <tr key={row.period} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-500 font-sans font-medium">{row.period}</td>
                        <td className="py-2 px-3 text-slate-800">{row.dateStr}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-700">
                          {row.remainingPrincipal.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                          {row.principalPayment.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-700 font-medium">
                          {row.interestPayment.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {row.totalPayment.toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Total Summary Footer Row */}
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="py-3 px-3 text-center text-xs font-sans font-black uppercase text-[#003B70]">
                        TỔNG CỘNG
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-800 font-extrabold">
                        {scheduleData.totalPrincipal.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800 font-extrabold">
                        {scheduleData.totalInterest.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#ED1C24] font-black text-sm">
                        {scheduleData.totalPayment.toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-500 font-medium">
                * Bảng tính mang tính chất tham khảo tại thời điểm tra cứu.
              </span>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
