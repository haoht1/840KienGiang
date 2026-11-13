import html2canvas from 'html2canvas-pro';
import { removeVietnameseAccents } from './formatters';

export type PaperOrientation = 'portrait' | 'landscape';

export function getDeliveryFilename(customerName: string, dateStr: string, ext: 'pdf' | 'png'): string {
  const cleanName = removeVietnameseAccents(customerName || 'KhachHang');
  const cleanDate = (dateStr || '').replace(/-/g, '');
  return `PhieuGiaoHang_${cleanName}_${cleanDate}.${ext}`;
}

export function getPurchaseFilename(sellerOrBuyerName: string, dateStr: string, ext: 'pdf' | 'png'): string {
  const cleanName = removeVietnameseAccents(sellerOrBuyerName || 'NguoiBan');
  const cleanDate = (dateStr || '').replace(/-/g, '');
  return `BangKeThuMua_${cleanName}_${cleanDate}.${ext}`;
}

/**
 * Create an unscaled off-screen clone of the printable A4 sheet so exports
 * are always full-resolution and never clipped by screen size or modal zoom.
 */
function createOffscreenClone(element: HTMLElement, orientation: PaperOrientation): {
  wrapper: HTMLDivElement;
  clone: HTMLElement;
  targetWidthPx: number;
} {
  // 210mm @ 96dpi ≈ 794px, 297mm @ 96dpi ≈ 1123px
  const targetWidthPx = orientation === 'landscape' ? 1123 : 794;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${targetWidthPx}px`;
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.zIndex = '-1';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.transform = 'none';

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = `${targetWidthPx}px`;
  clone.style.maxWidth = `${targetWidthPx}px`;
  clone.style.transform = 'none';
  clone.style.margin = '0';

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  return { wrapper, clone, targetWidthPx };
}

export async function exportElementToPng(
  element: HTMLElement,
  filename: string,
  orientation: PaperOrientation = 'portrait'
): Promise<boolean> {
  const { wrapper, clone, targetWidthPx } = createOffscreenClone(element, orientation);
  try {
    // Wait a tick for layout to settle
    await new Promise((r) => setTimeout(r, 60));

    const canvas = await html2canvas(clone, {
      scale: 2.5, // Crisp 200+ DPI equivalent
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: targetWidthPx,
      windowWidth: targetWidthPx,
      scrollX: 0,
      scrollY: 0,
    });

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png', 1.0)
    );

    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      return true;
    }

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Lỗi khi xuất ảnh PNG:', error);
    return false;
  } finally {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
}

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  orientation: PaperOrientation = 'portrait'
): Promise<boolean> {
  const { wrapper, clone, targetWidthPx } = createOffscreenClone(element, orientation);
  try {
    await new Promise((r) => setTimeout(r, 60));

    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

    const opt = {
      margin: [5, 5, 5, 5], // mm
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        width: targetWidthPx,
        windowWidth: targetWidthPx,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: orientation,
      },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    await html2pdf().set(opt).from(clone).save();
    return true;
  } catch (error) {
    console.error('Lỗi khi xuất PDF qua html2pdf.js, chuyển sang in hệ thống:', error);
    printDocument(orientation);
    return false;
  } finally {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
}

export function printDocument(orientation: PaperOrientation = 'portrait'): void {
  const styleId = 'dynamic-print-orientation';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    @media print {
      @page {
        size: A4 ${orientation};
        margin: 8mm 10mm 10mm 10mm;
      }
    }
  `;
  window.print();
}

export async function shareDocument(title: string, text: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return true;
    } catch (e) {
      console.log('Chia sẻ bị hủy hoặc không được hỗ trợ');
    }
  }
  return false;
}
