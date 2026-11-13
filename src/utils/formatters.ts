/**
 * Formatters and string helpers for invoices and procurement sheets
 */

export function digitsOnly(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  return String(val).replace(/\D/g, '');
}

export function formatThousands(val: string | number | undefined | null): string {
  const digits = digitsOnly(val);
  if (!digits) return '';
  // Remove leading zeros except single '0'
  const normalized = digits.replace(/^0+(?=\d)/, '');
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseVndInput(val: string | number | undefined | null): number {
  const digits = digitsOnly(val);
  if (!digits) return 0;
  const num = Number(digits);
  return isNaN(num) ? 0 : num;
}

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return '0 ₫';
  const val = typeof amount === 'string' ? parseFormattedNumber(amount) : amount;
  if (isNaN(val)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + ' ₫';
}

export function formatNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'string' ? parseFormattedNumber(val) : val;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function parseFormattedNumber(str: string | number): number {
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  if (!str) return 0;
  let raw = str.toString().trim();
  if (!raw) return 0;

  // Handle Vietnamese thousands format like "1.000.000" (multiple dots)
  const dotCount = (raw.match(/\./g) || []).length;
  if (dotCount > 1) {
    raw = raw.replace(/\./g, '');
  } else if (dotCount === 1 && /\.\d{3}$/.test(raw) && raw.length >= 5) {
    // Likely thousands separator e.g. "10.000" or "500.000"
    raw = raw.replace(/\./g, '');
  }

  // Replace Vietnamese comma decimal with dot if there's no dot left
  raw = raw.replace(/,/g, '.').replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatDateVietnamese(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `Ngày ${day < 10 ? '0' + day : day} tháng ${month < 10 ? '0' + month : month} năm ${year}`;
}

export function formatDateShort(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year}`;
}

export function generateDocCode(prefix: 'PGH' | 'BKM'): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 digits
  return `${prefix}-${yyyy}${mm}${dd}-${randomSuffix}`;
}

export function removeVietnameseAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
