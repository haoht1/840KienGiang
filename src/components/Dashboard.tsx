import React, { useState, useEffect } from 'react';
import {
  FileText,
  Receipt,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  Printer,
  Copy,
  PlusCircle,
  Clock,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { DeliveryNote, PurchaseTableDoc, Customer } from '../types';
import { getDeliveryNotes, getPurchaseTables, getCustomers } from '../utils/storage';
import { formatCurrency, formatDateShort } from '../utils/formatters';
import { NavTab } from './Sidebar';

interface Props {
  onNavigate: (tab: NavTab) => void;
  onPreviewDelivery: (note: DeliveryNote) => void;
  onPreviewPurchase: (doc: PurchaseTableDoc) => void;
  onCloneDelivery: (note: DeliveryNote) => void;
  onClonePurchase: (doc: PurchaseTableDoc) => void;
}

export const Dashboard: React.FC<Props> = ({
  onNavigate,
  onPreviewDelivery,
  onPreviewPurchase,
  onCloneDelivery,
  onClonePurchase,
}) => {
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [purchaseTables, setPurchaseTables] = useState<PurchaseTableDoc[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    async function fetchStats() {
      const [dList, pList, cList] = await Promise.all([
        getDeliveryNotes(),
        getPurchaseTables(),
        getCustomers(),
      ]);
      setDeliveryNotes(dList);
      setPurchaseTables(pList);
      setCustomers(cList);
    }
    fetchStats();
  }, []);

  // Compute Metrics
  const totalDeliveryValue = deliveryNotes.reduce((sum, n) => sum + (n.totalAmount || 0), 0);
  const totalPurchaseValue = purchaseTables.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalDocsCount = deliveryNotes.length + purchaseTables.length;
  const totalDocValue = totalDeliveryValue + totalPurchaseValue;

  // Recent unified items
  const recentActivities = [
    ...(deliveryNotes || []).map((d) => ({
      type: 'DELIVERY' as const,
      id: d.id,
      code: d.code,
      title: d.customer?.name || 'Khách hàng',
      category: d.businessCategory || 'Hàng hóa',
      date: d.date,
      amount: d.totalAmount || 0,
      status: d.paymentStatus,
      raw: d,
    })),
    ...(purchaseTables || []).map((p) => ({
      type: 'PURCHASE' as const,
      id: p.id,
      code: p.code,
      title: `${p.items?.[0]?.sellerName || 'Người bán'} (${p.items?.length || 0} mặt hàng)`,
      category: p.businessCategory || 'Nông sản',
      date: p.date,
      amount: p.totalAmount || 0,
      status: p.paymentStatus,
      raw: p,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  return (
    <div className="space-y-6 pb-16">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0a192f] via-[#102a4e] to-[#1e3a8a] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-semibold backdrop-blur-xs border border-blue-400/30">
            <Sparkles size={14} />
            <span>Phần mềm SaaS thế hệ mới • Chuẩn in A4 tuyệt đối</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Trợ Lý Tạo Phiếu Giao Hàng & Bảng Kê Thu Mua
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Giải pháp chuyên biệt cho hộ kinh doanh, shop thời trang, vật tư nông nghiệp, phân bón, VLXD và cơ sở thu mua lúa, thủy hải sản, tổ yến.
          </p>
        </div>

        {/* Big Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('delivery_create')}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <FileText size={18} />
            <span>+ Tạo Phiếu Giao Hàng</span>
          </button>

          <button
            onClick={() => onNavigate('purchase_create')}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Receipt size={18} />
            <span>+ Tạo Bảng Kê Thu Mua</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng giá trị chứng từ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng giá trị chứng từ
            </p>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {formatCurrency(totalDocValue)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp size={13} />
              Bao gồm bán ra & thu mua
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 2: Bán ra (Phiếu giao hàng) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Doanh số giao hàng
            </p>
            <h3 className="text-xl font-black text-blue-900 mt-1">
              {formatCurrency(totalDeliveryValue)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {deliveryNotes.length} phiếu đã phát hành
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* Card 3: Thu mua nông thủy sản */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chi thu mua hàng hóa
            </p>
            <h3 className="text-xl font-black text-emerald-900 mt-1">
              {formatCurrency(totalPurchaseValue)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {purchaseTables.length} bảng kê thu mua
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft size={24} />
          </div>
        </div>

        {/* Card 4: Tổng khách hàng & đối tác */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Khách hàng & Người bán
            </p>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {customers.length} hồ sơ
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Lưu sẵn tên, SĐT, CCCD
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Workflow Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Launch Cards */}
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <PlusCircle size={16} className="text-blue-600" />
            Lối Tắt Thao Tác Nhanh
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => onNavigate('delivery_create')}
              className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-200 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                    Tạo Phiếu Giao Hàng
                  </h4>
                  <p className="text-[11px] text-slate-500">Bán lẻ, phân phối, vật tư, VLXD</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-600">Mở &gt;</span>
            </button>

            <button
              onClick={() => onNavigate('purchase_create')}
              className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-emerald-50/60 hover:border-emerald-200 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Receipt size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                    Tạo Bảng Kê Thu Mua
                  </h4>
                  <p className="text-[11px] text-slate-500">Tổ yến, hải sản, lúa & nông sản</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600">Mở &gt;</span>
            </button>

            <button
              onClick={() => onNavigate('customers')}
              className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Users size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Danh Sách Khách Hàng</h4>
                  <p className="text-[11px] text-slate-500">Tra cứu nhanh tên, SĐT, CCCD</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500">Xem &gt;</span>
            </button>

            <button
              onClick={() => onNavigate('backup')}
              className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Sao Lưu & Phục Hồi JSON</h4>
                  <p className="text-[11px] text-slate-500">Tải tệp sao lưu hoặc phục hồi dữ liệu</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500">Mở &gt;</span>
            </button>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Chứng Từ Gần Đây Nhất
              </h3>
            </div>
            <button
              onClick={() => onNavigate('documents')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Xem tất cả ({totalDocsCount}) &gt;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2 px-3">Loại</th>
                  <th className="py-2 px-3">Ngày lập</th>
                  <th className="py-2 px-3">Khách hàng / Người bán</th>
                  <th className="py-2 px-3 text-right">Tổng tiền</th>
                  <th className="py-2 px-3 text-center">Trạng thái</th>
                  <th className="py-2 px-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentActivities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.type === 'DELIVERY'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.type === 'DELIVERY' ? 'Giao Hàng' : 'Thu Mua'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                      {formatDateShort(item.date)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 truncate max-w-[140px]">
                      {item.title}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase ${
                          item.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status === 'PAID'
                          ? 'Đã đủ'
                          : item.status === 'PARTIAL'
                          ? 'Một phần'
                          : 'Chưa'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            if (item.type === 'DELIVERY') onPreviewDelivery(item.raw as DeliveryNote);
                            else onPreviewPurchase(item.raw as PurchaseTableDoc);
                          }}
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                          title="Xem & In A4"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (item.type === 'DELIVERY') onCloneDelivery(item.raw as DeliveryNote);
                            else onClonePurchase(item.raw as PurchaseTableDoc);
                          }}
                          className="p-1 hover:bg-slate-200 text-indigo-600 rounded"
                          title="Nhân bản chứng từ"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
