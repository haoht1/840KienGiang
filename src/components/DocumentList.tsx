import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Copy,
  Trash2,
  Edit,
  Download,
  FileText,
  Receipt,
  Plus,
  Printer,
  FileDown,
  Calendar,
} from 'lucide-react';
import { DeliveryNote, PurchaseTableDoc } from '../types';
import { getDeliveryNotes, getPurchaseTables, deleteDeliveryNote, deletePurchaseTable } from '../utils/storage';
import { formatCurrency, formatDateShort } from '../utils/formatters';

interface Props {
  onPreviewDelivery: (note: DeliveryNote) => void;
  onPreviewPurchase: (doc: PurchaseTableDoc) => void;
  onEditDelivery: (note: DeliveryNote) => void;
  onEditPurchase: (doc: PurchaseTableDoc) => void;
  onCloneDelivery: (note: DeliveryNote) => void;
  onClonePurchase: (doc: PurchaseTableDoc) => void;
  onCreateDelivery: () => void;
  onCreatePurchase: () => void;
}

export const DocumentList: React.FC<Props> = ({
  onPreviewDelivery,
  onPreviewPurchase,
  onEditDelivery,
  onEditPurchase,
  onCloneDelivery,
  onClonePurchase,
  onCreateDelivery,
  onCreatePurchase,
}) => {
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [purchaseTables, setPurchaseTables] = useState<PurchaseTableDoc[]>([]);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DELIVERY' | 'PURCHASE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = async () => {
    const [d, p] = await Promise.all([getDeliveryNotes(), getPurchaseTables()]);
    setDeliveryNotes(d);
    setPurchaseTables(p);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Combine and format
  const allDocs = useMemo(() => {
    const dList = (deliveryNotes || []).map((d) => ({
      id: d.id,
      code: d.code,
      type: 'DELIVERY' as const,
      typeName: 'Phiếu giao hàng',
      customerName: d.customer?.name || 'Khách hàng',
      phone: d.customer?.phone || '',
      date: d.date,
      businessCategory: d.businessCategory || '',
      totalAmount: d.totalAmount || 0,
      paidAmount: d.paidAmount || 0,
      remainingAmount: d.remainingAmount || 0,
      paymentStatus: d.paymentStatus,
      isDraft: d.isDraft,
      isDemo: d.isDemo,
      raw: d,
    }));

    const pList = (purchaseTables || []).map((p) => ({
      id: p.id,
      code: p.code,
      type: 'PURCHASE' as const,
      typeName: 'Bảng kê thu mua',
      customerName: `${p.items?.[0]?.sellerName || 'Người bán'} (${p.items?.length || 0} mặt hàng)`,
      phone: p.items?.[0]?.sellerPhone || '',
      date: p.date,
      businessCategory: p.businessCategory || '',
      totalAmount: p.totalAmount || 0,
      paidAmount: p.paidAmount || 0,
      remainingAmount: p.remainingAmount || 0,
      paymentStatus: p.paymentStatus,
      isDraft: p.isDraft,
      isDemo: p.isDemo,
      raw: p,
    }));

    return [...dList, ...pList].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [deliveryNotes, purchaseTables]);

  // Filtered List
  const filteredDocs = useMemo(() => {
    return allDocs.filter((doc) => {
      if (typeFilter !== 'ALL' && doc.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && doc.paymentStatus !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          doc.code.toLowerCase().includes(term) ||
          doc.customerName.toLowerCase().includes(term) ||
          doc.businessCategory.toLowerCase().includes(term) ||
          doc.phone.includes(term)
        );
      }
      return true;
    });
  }, [allDocs, typeFilter, statusFilter, searchTerm]);

  // Handle Delete
  const handleDelete = async (id: string, type: 'DELIVERY' | 'PURCHASE', code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chứng từ ${code} không? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    if (type === 'DELIVERY') {
      await deleteDeliveryNote(id);
    } else {
      await deletePurchaseTable(id);
    }
    await loadData();
  };

  // Export Single Document JSON
  const handleExportSingleJson = (doc: any) => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc.raw, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `${doc.code}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Danh Sách Chứng Từ Đã Lập
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Quản lý, tìm kiếm, xem trước, in ấn và nhân bản tất cả phiếu giao hàng và bảng kê thu mua.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCreateDelivery}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Plus size={15} />
            <span>+ Phiếu Giao Hàng</span>
          </button>
          <button
            onClick={onCreatePurchase}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Plus size={15} />
            <span>+ Bảng Kê Thu Mua</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khách hàng, người bán, ngành hàng, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1 rounded-md transition ${
              typeFilter === 'ALL' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({allDocs.length})
          </button>
          <button
            onClick={() => setTypeFilter('DELIVERY')}
            className={`px-3 py-1 rounded-md transition ${
              typeFilter === 'DELIVERY'
                ? 'bg-white shadow-xs font-bold text-blue-700'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            Giao hàng ({deliveryNotes.length})
          </button>
          <button
            onClick={() => setTypeFilter('PURCHASE')}
            className={`px-3 py-1 rounded-md transition ${
              typeFilter === 'PURCHASE'
                ? 'bg-white shadow-xs font-bold text-emerald-800'
                : 'text-slate-600 hover:text-emerald-800'
            }`}
          >
            Thu mua ({purchaseTables.length})
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Mọi trạng thái thanh toán</option>
            <option value="PAID">Đã thanh toán đủ</option>
            <option value="PARTIAL">Thanh toán một phần</option>
            <option value="UNPAID">Chưa thanh toán</option>
          </select>
        </div>
      </div>

      {/* Document Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">STT</th>
                <th className="py-3 px-3 w-28">Ngày lập</th>
                <th className="py-3 px-3 min-w-[180px]">Khách hàng / Người bán</th>
                <th className="py-3 px-3 min-w-[140px]">Ngành hàng</th>
                <th className="py-3 px-3 w-32 text-right">Tổng tiền (VNĐ)</th>
                <th className="py-3 px-3 w-28 text-center">Thanh toán</th>
                <th className="py-3 px-3 w-24 text-center">Loại</th>
                <th className="py-3 px-3 w-32 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy chứng từ nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{formatDateShort(doc.date)}</span>
                      {doc.isDraft && (
                        <span className="inline-block mt-0.5 text-[9.5px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                          Bản nháp
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{doc.customerName}</span>
                      {doc.phone && (
                        <span className="text-[11px] text-slate-500">SĐT: {doc.phone}</span>
                      )}
                    </td>

                    {/* Industry */}
                    <td className="py-3 px-3 text-slate-600">
                      {doc.businessCategory}
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                      {formatCurrency(doc.totalAmount)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          doc.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {doc.paymentStatus === 'PAID'
                          ? 'Đã thanh toán'
                          : doc.paymentStatus === 'PARTIAL'
                          ? 'Thanh toán 1 phần'
                          : 'Chưa thanh toán'}
                      </span>
                    </td>

                    {/* Doc Type Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          doc.type === 'DELIVERY'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {doc.type === 'DELIVERY' ? <FileText size={11} /> : <Receipt size={11} />}
                        <span>{doc.type === 'DELIVERY' ? 'Giao Hàng' : 'Thu Mua'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Preview & Print */}
                        <button
                          onClick={() => {
                            if (doc.type === 'DELIVERY') onPreviewDelivery(doc.raw as DeliveryNote);
                            else onPreviewPurchase(doc.raw as PurchaseTableDoc);
                          }}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition"
                          title="Xem trước & In A4"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Edit Draft */}
                        <button
                          onClick={() => {
                            if (doc.type === 'DELIVERY') onEditDelivery(doc.raw as DeliveryNote);
                            else onEditPurchase(doc.raw as PurchaseTableDoc);
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition"
                          title="Chỉnh sửa"
                        >
                          <Edit size={15} />
                        </button>

                        {/* Clone */}
                        <button
                          onClick={() => {
                            if (doc.type === 'DELIVERY') onCloneDelivery(doc.raw as DeliveryNote);
                            else onClonePurchase(doc.raw as PurchaseTableDoc);
                          }}
                          className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded transition"
                          title="Nhân bản tạo mới (không ghi đè)"
                        >
                          <Copy size={15} />
                        </button>

                        {/* Export JSON */}
                        <button
                          onClick={() => handleExportSingleJson(doc)}
                          className="p-1.5 hover:bg-purple-50 text-purple-600 rounded transition"
                          title="Tải riêng tệp JSON chứng từ này"
                        >
                          <FileDown size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(doc.id, doc.type, doc.code)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded transition"
                          title="Xóa chứng từ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
