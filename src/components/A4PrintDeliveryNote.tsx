import React from 'react';
import { DeliveryNote } from '../types';
import { formatNumber, formatDateVietnamese, formatDateShort } from '../utils/formatters';

interface Props {
  note: DeliveryNote;
}

export const A4PrintDeliveryNote: React.FC<Props> = ({ note }) => {
  return (
    <div
      className="a4-sheet relative bg-white text-black text-sm leading-normal p-8 sm:p-10 mx-auto select-none print:p-0 print:m-0"
      style={{
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        fontFamily: "'Times New Roman', Times, serif, 'Plus Jakarta Sans'",
      }}
    >
      {/* Header Store Profile */}
      <div className="flex justify-between items-start border-b border-gray-400 pb-3 mb-4">
        <div className="w-3/4 pr-4">
          <h2 className="text-base font-bold uppercase tracking-tight text-gray-900 leading-tight">
            {note.store?.name || 'CỬA HÀNG KINH DOANH'}
          </h2>
          <p className="text-xs text-gray-700 mt-1">
            <span className="font-semibold">Địa chỉ:</span> {note.store?.address || 'Tại cửa hàng'}
          </p>
          <p className="text-xs text-gray-700">
            <span className="font-semibold">Điện thoại / Hotline:</span> {note.store?.phone || 'Chưa có'}
          </p>
          {note.store?.bankAccount && (
            <p className="text-xs text-gray-700">
              <span className="font-semibold">Tài khoản ngân hàng:</span> {note.store.bankAccount} - {note.store.bankName} ({note.store.bankOwner})
            </p>
          )}
        </div>

        <div className="w-1/4 text-right">
          <p className="text-xs text-gray-700 font-medium">
            Ngày lập: {formatDateShort(note.date)}
          </p>
        </div>
      </div>

      {/* Main Document Title */}
      <div className="text-center my-4">
        <h1 className="text-2xl font-bold tracking-wider uppercase text-gray-900">
          PHIẾU GIAO HÀNG
        </h1>
        <p className="text-xs italic text-gray-600 mt-0.5">
          {formatDateVietnamese(note.date)}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">
          Ngành hàng: {note.businessCategory || 'Vật tư & Hàng hóa'}
        </p>
      </div>

      {/* Customer Info Section */}
      <div className="bg-gray-50/70 border border-gray-300 rounded p-3 mb-4 text-xs leading-relaxed">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div>
            <span className="font-bold text-gray-800">Khách hàng (Bên mua):</span>{' '}
            <span className="font-semibold uppercase text-gray-900">{note.customer?.name || 'Khách hàng vãng lai'}</span>
          </div>
          <div>
            <span className="font-bold text-gray-800">Số điện thoại:</span>{' '}
            <span className="font-semibold">{note.customer?.phone || 'Chưa cung cấp'}</span>
          </div>
          <div className="col-span-2">
            <span className="font-bold text-gray-800">Địa chỉ giao hàng:</span>{' '}
            <span>{note.customer?.address || 'Tại cửa hàng'}</span>
          </div>
          {note.customer?.notes && (
            <div className="col-span-2">
              <span className="font-bold text-gray-800">Ghi chú giao nhận:</span>{' '}
              <span className="italic">{note.customer.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Goods Table */}
      <div className="mb-4">
        <table className="w-full border-collapse border border-gray-800 text-xs">
          <thead>
            <tr className="bg-gray-100 text-center font-bold">
              <th className="border border-gray-800 px-2 py-2 w-10">STT</th>
              <th className="border border-gray-800 px-3 py-2 text-left">Tên mặt hàng, quy cách</th>
              <th className="border border-gray-800 px-2 py-2 w-22">ĐVT</th>
              <th className="border border-gray-800 px-2 py-2 w-20 text-right">Số lượng</th>
              <th className="border border-gray-800 px-2 py-2 w-26 text-right">Đơn giá (đ)</th>
              <th className="border border-gray-800 px-2 py-2 w-32 text-right">Thành tiền (đ)</th>
            </tr>
          </thead>
          <tbody>
            {note.items.map((item, index) => (
              <tr key={item.id || index}>
                <td className="border border-gray-800 px-2 py-1.5 text-center">{index + 1}</td>
                <td className="border border-gray-800 px-3 py-1.5 font-medium text-gray-900">
                  {item.productName}
                  {item.note && <span className="block text-[11px] text-gray-500 italic">{item.note}</span>}
                </td>
                <td className="border border-gray-800 px-2 py-1.5 text-center">{item.unit || 'Cái'}</td>
                <td className="border border-gray-800 px-2 py-1.5 text-right font-semibold">
                  {formatNumber(item.quantity)}
                </td>
                <td className="border border-gray-800 px-2 py-1.5 text-right">
                  {formatNumber(item.unitPrice)}
                </td>
                <td className="border border-gray-800 px-2 py-1.5 text-right font-semibold text-gray-900">
                  {formatNumber(item.amount)}
                </td>
              </tr>
            ))}

            {/* If fewer than 5 items, render empty rows for balanced paper layout */}
            {note.items.length < 5 &&
              Array.from({ length: 5 - note.items.length }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-6">
                  <td className="border border-gray-800 px-2 py-1 text-center text-gray-300">
                    {note.items.length + i + 1}
                  </td>
                  <td className="border border-gray-800 px-3 py-1"></td>
                  <td className="border border-gray-800 px-2 py-1"></td>
                  <td className="border border-gray-800 px-2 py-1"></td>
                  <td className="border border-gray-800 px-2 py-1"></td>
                  <td className="border border-gray-800 px-2 py-1"></td>
                </tr>
              ))}

            {/* Summary Rows */}
            <tr className="font-bold bg-gray-50">
              <td colSpan={5} className="border border-gray-800 px-3 py-2 text-right uppercase">
                Tổng cộng tiền hàng:
              </td>
              <td className="border border-gray-800 px-2 py-2 text-right text-sm text-blue-900">
                {formatNumber(note.totalAmount)} đ
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="border border-gray-800 px-3 py-1.5 text-right font-medium">
                Đã thanh toán:
              </td>
              <td className="border border-gray-800 px-2 py-1.5 text-right font-semibold text-emerald-800">
                {formatNumber(note.paidAmount)} đ
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="border border-gray-800 px-3 py-1.5 text-right font-medium">
                Còn lại / Tiền nợ:
              </td>
              <td className="border border-gray-800 px-2 py-1.5 text-right font-bold text-red-700">
                {formatNumber(note.remainingAmount)} đ
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Words & Payment Details */}
      <div className="border border-gray-300 rounded p-2.5 mb-5 text-xs bg-gray-50/50">
        <p className="text-gray-900">
          <span className="font-bold">Số tiền viết bằng chữ:</span>{' '}
          <span className="italic font-semibold text-gray-800">{note.totalInWords}</span>
        </p>
        <div className="flex justify-between items-center mt-1 text-[11px] text-gray-600">
          <span>
            Trạng thái thanh toán:{' '}
            <strong
              className={
                note.paymentStatus === 'PAID'
                  ? 'text-emerald-700 font-bold'
                  : note.paymentStatus === 'PARTIAL'
                  ? 'text-amber-700 font-bold'
                  : 'text-red-700 font-bold'
              }
            >
              {note.paymentStatus === 'PAID'
                ? 'Đã thanh toán đủ'
                : note.paymentStatus === 'PARTIAL'
                ? 'Thanh toán một phần'
                : 'Chưa thanh toán'}
            </strong>
          </span>
          {note.generalNotes && <span>Ghi chú chung: {note.generalNotes}</span>}
        </div>
      </div>

      {/* Signatures Section - Blank so parties sign & write their own names */}
      <div className="mt-6 pt-2 text-xs" style={{ pageBreakInside: 'avoid' }}>
        <div className="flex justify-end mb-2">
          <span className="italic text-gray-700">
            {formatDateVietnamese(note.date)}
          </span>
        </div>
        <div className="grid grid-cols-2 text-center gap-6">
          <div>
            <p className="font-bold uppercase text-gray-900">NGƯỜI NHẬN HÀNG (BÊN MUA)</p>
            <p className="text-[11px] italic text-gray-500">(Ký, ghi rõ họ tên)</p>
            <div className="h-24" />
          </div>
          <div>
            <p className="font-bold uppercase text-gray-900">NGƯỜI GIAO HÀNG (BÊN BÁN)</p>
            <p className="text-[11px] italic text-gray-500">(Ký, ghi rõ họ tên)</p>
            <div className="h-24" />
          </div>
        </div>
      </div>
    </div>
  );
};
