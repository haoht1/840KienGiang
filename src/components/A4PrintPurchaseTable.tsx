import React from 'react';
import { PurchaseTableDoc } from '../types';
import { formatNumber, formatDateVietnamese, formatDateShort } from '../utils/formatters';

interface Props {
  doc: PurchaseTableDoc;
}

export const A4PrintPurchaseTable: React.FC<Props> = ({ doc }) => {
  return (
    <div
      className="a4-sheet relative bg-white text-black text-xs leading-normal p-6 sm:p-8 mx-auto select-none print:p-0 print:m-0"
      style={{
        width: '297mm',
        minHeight: '210mm',
        boxSizing: 'border-box',
        fontFamily: "'Times New Roman', Times, serif, 'Plus Jakarta Sans'",
      }}
    >
      {/* Top Header */}
      <div className="flex justify-between items-start mb-1">
        <div className="text-[11px] text-gray-700">
          <p className="font-semibold uppercase">{doc.buyerName}</p>
        </div>
        <div className="text-right text-[11px] text-gray-600">
          <p>Ngày lập: {formatDateShort(doc.date)}</p>
        </div>
      </div>

      {/* Title Centered */}
      <div className="text-center my-2.5">
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-gray-950">
          BẢNG KÊ THU MUA HÀNG HÓA, DỊCH VỤ
        </h1>
        <p className="text-xs italic text-gray-700 mt-0.5">
          {formatDateVietnamese(doc.date)}
        </p>
        <p className="text-xs font-semibold text-gray-600 mt-0.5">
          Ngành nghề thu mua: {doc.businessCategory}
        </p>
      </div>

      {/* Buyer & Location Details */}
      <div className="border border-gray-400 bg-gray-50/50 rounded p-2.5 mb-3 text-[11.5px] leading-relaxed">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          <div>
            <span className="font-bold text-gray-900">1. Tên người thu mua:</span>{' '}
            <span className="font-semibold text-gray-900 uppercase">{doc.buyerName}</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">2. Người phụ trách thu mua:</span>{' '}
            <span className="font-semibold text-gray-900">{doc.buyerOfficer || '—'}</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">3. Địa chỉ người thu mua:</span>{' '}
            <span>{doc.buyerAddress}</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">4. Địa chỉ nơi tổ chức thu mua:</span>{' '}
            <span>{doc.purchaseLocation || doc.buyerAddress}</span>
          </div>
        </div>
      </div>

      {/* Procurement Table - A4 Landscape proportions */}
      <div className="mb-3">
        <table className="w-full border-collapse border border-gray-900 text-[11.5px]">
          <thead>
            {/* Super Header */}
            <tr className="bg-gray-100 font-bold text-center">
              <th rowSpan={2} className="border border-gray-900 px-1.5 py-1.5 w-9">
                STT
              </th>
              <th colSpan={4} className="border border-gray-900 px-2 py-1 bg-gray-200/70 text-gray-900 uppercase text-[11px]">
                THÔNG TIN NGƯỜI BÁN HÀNG
              </th>
              <th colSpan={4} className="border border-gray-900 px-2 py-1 bg-gray-200/70 text-gray-900 uppercase text-[11px]">
                HÀNG HÓA MUA VÀO
              </th>
              <th rowSpan={2} className="border border-gray-900 px-2 py-1.5 w-36 text-[10.5px] leading-tight">
                BÊN BÁN KÝ XÁC NHẬN ĐÃ NHẬN ĐỦ TIỀN
              </th>
            </tr>
            {/* Sub Header */}
            <tr className="bg-gray-100 font-bold text-center text-[11px]">
              <th className="border border-gray-900 px-1.5 py-1.5 w-22">Ngày, tháng, năm</th>
              <th className="border border-gray-900 px-2 py-1.5 text-left w-36">Họ và tên</th>
              <th className="border border-gray-900 px-2 py-1.5 text-left">Địa chỉ</th>
              <th className="border border-gray-900 px-1.5 py-1.5 w-28">Số CCCD</th>
              <th className="border border-gray-900 px-2 py-1.5 text-left w-40">Tên mặt hàng</th>
              <th className="border border-gray-900 px-2 py-1.5 w-22 text-right">Số lượng (kg)</th>
              <th className="border border-gray-900 px-2 py-1.5 w-28 text-right">Đơn giá (đ/kg)</th>
              <th className="border border-gray-900 px-2 py-1.5 w-32 text-right">Tổng giá thanh toán (đ)</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((row, idx) => (
              <tr key={row.id || idx}>
                <td className="border border-gray-900 px-1.5 py-2 text-center font-medium">
                  {idx + 1}
                </td>
                <td className="border border-gray-900 px-1.5 py-2 text-center whitespace-nowrap">
                  {formatDateShort(row.date)}
                </td>
                <td className="border border-gray-900 px-2 py-2 font-semibold text-gray-900">
                  {row.sellerName}
                  {row.sellerPhone && (
                    <span className="block text-[10px] text-gray-500 font-normal">
                      SĐT: {row.sellerPhone}
                    </span>
                  )}
                </td>
                <td className="border border-gray-900 px-2 py-2 text-[11px] text-gray-700">
                  {row.sellerAddress}
                </td>
                <td className="border border-gray-900 px-1.5 py-2 text-center font-mono text-[11px]">
                  {row.sellerCccd || '—'}
                </td>
                <td className="border border-gray-900 px-2 py-2 font-medium text-gray-900">
                  {row.productName}
                </td>
                <td className="border border-gray-900 px-2 py-2 text-right font-semibold">
                  {formatNumber(row.quantityKg)}
                </td>
                <td className="border border-gray-900 px-2 py-2 text-right">
                  {formatNumber(row.unitPrice)}
                </td>
                <td className="border border-gray-900 px-2 py-2 text-right font-bold text-gray-900">
                  {formatNumber(row.totalAmount)}
                </td>
                <td className="border border-gray-900 px-2 py-2 text-center align-middle">
                  {row.isPaidReceived && doc.paymentStatus === 'PAID' ? (
                    <div className="flex flex-col items-center justify-center min-h-[32px]">
                      <span className="text-[10px] text-emerald-800 font-semibold leading-tight">
                        Đã nhận đủ tiền
                      </span>
                      <span className="text-[9.5px] text-gray-400 italic mt-2">(Ký tên)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[32px]">
                      <span className="text-[10px] text-amber-800 font-semibold leading-tight">
                        Chưa thanh toán đủ
                      </span>
                      <span className="text-[9.5px] text-gray-400 italic mt-2">(Ký xác nhận)</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {/* Spacer empty rows if few rows to preserve page structure */}
            {doc.items.length < 4 &&
              Array.from({ length: 4 - doc.items.length }).map((_, i) => (
                <tr key={`empty-row-${i}`} className="h-8">
                  <td className="border border-gray-900 px-1.5 py-1 text-center text-gray-300">
                    {doc.items.length + i + 1}
                  </td>
                  <td className="border border-gray-900"></td>
                  <td className="border border-gray-900"></td>
                  <td className="border border-gray-900"></td>
                  <td className="border border-gray-900"></td>
                  <td className="border border-gray-900"></td>
                  <td className="border border-gray-900"></td>
                  <td className="border border-gray-900"></td>
                  <td className="border border-gray-900"></td>
                  <td className="border border-gray-900"></td>
                </tr>
              ))}

            {/* Grand Total Row - 8 + 1 + 1 = 10 columns */}
            <tr className="bg-gray-100 font-bold">
              <td colSpan={8} className="border border-gray-900 px-3 py-2 text-right uppercase text-[11.5px]">
                CỘNG TỔNG GIÁ TRỊ THANH TOÁN:
              </td>
              <td className="border border-gray-900 px-2 py-2 text-right text-xs text-blue-900 font-black">
                {formatNumber(doc.totalAmount)} đ
              </td>
              <td className="border border-gray-900 bg-gray-50 text-center text-[10px] text-gray-600 font-semibold">
                {doc.paymentStatus === 'PAID' ? 'Đủ 100%' : 'Chưa tất toán'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Words and Summary */}
      <div className="border border-gray-400 bg-gray-50/70 rounded p-2.5 mb-4 text-[11.5px]">
        <p className="text-gray-900 leading-relaxed">
          <span className="font-bold">Tổng số tiền thanh toán (viết bằng chữ):</span>{' '}
          <span className="italic font-bold text-gray-900">{doc.totalInWords}</span>
        </p>
        <div className="flex flex-wrap justify-between items-center mt-1.5 pt-1.5 border-t border-gray-300 text-[11px] text-gray-700">
          <span>
            Đã thanh toán: <strong className="text-emerald-700">{formatNumber(doc.paidAmount)} đ</strong>
          </span>
          <span>
            Còn nợ bên bán: <strong className="text-red-700">{formatNumber(doc.remainingAmount)} đ</strong>
          </span>
          <span>
            Trạng thái:{' '}
            <strong className={doc.paymentStatus === 'PAID' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {doc.paymentStatus === 'PAID' ? 'Đã thanh toán đủ' : 'Thanh toán một phần / Chưa đủ'}
            </strong>
          </span>
        </div>
      </div>

      {/* Signatures 3 Columns - Blank spaces so parties write and sign themselves */}
      <div className="mt-4 pt-1 text-[11.5px]" style={{ pageBreakInside: 'avoid' }}>
        <div className="flex justify-end mb-1">
          <span className="italic text-gray-700 text-xs">
            {formatDateVietnamese(doc.date)}
          </span>
        </div>
        <div className="grid grid-cols-3 text-center gap-4">
          <div>
            <p className="font-bold uppercase text-gray-900">NGƯỜI LẬP BẢNG KÊ</p>
            <p className="text-[10.5px] italic text-gray-500">(Ký, ghi rõ họ tên)</p>
            <div className="h-20" />
          </div>
          <div>
            <p className="font-bold uppercase text-gray-900">NGƯỜI PHỤ TRÁCH THU MUA</p>
            <p className="text-[10.5px] italic text-gray-500">(Ký, ghi rõ họ tên)</p>
            <div className="h-20" />
          </div>
          <div>
            <p className="font-bold uppercase text-gray-900">ĐẠI DIỆN CƠ SỞ / DOANH NGHIỆP</p>
            <p className="text-[10.5px] italic text-gray-500">(Ký, ghi rõ họ tên và đóng dấu)</p>
            <div className="h-20" />
          </div>
        </div>
      </div>
    </div>
  );
};
