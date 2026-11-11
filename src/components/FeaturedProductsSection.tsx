import React, { useState } from 'react';
import { Sparkles, Star, Gift, ChevronLeft, ChevronRight, Phone, CheckCircle, Info, LayoutGrid, SlidersHorizontal, Maximize2, X, ExternalLink } from 'lucide-react';
import contentData from '../data/contentData.json';
import { ProductItem } from '../types';

interface FeaturedProductsSectionProps {
  onOpenAdvisorModal: (message?: string) => void;
}

export const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({ onOpenAdvisorModal }) => {
  const { featuredProducts, bankInfo } = contentData;
  const items = featuredProducts.items as ProductItem[];

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; title: string } | null>(null);

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handleInterestClick = (productTitle: string) => {
    const msg = `Cảm ơn Quý khách đã quan tâm đến sản phẩm/dịch vụ "${productTitle}". Quý khách vui lòng liên hệ cán bộ VietinBank tại quầy để được tư vấn chi tiết.\nHoặc liên hệ Chuyên viên tư vấn Huỳnh Thái Hào - 0919131021.`;
    onOpenAdvisorModal(msg);
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#003B70] via-[#004e92] to-[#003B70] text-white rounded-2xl shadow-sm border border-blue-900/40">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl text-amber-300">
            <Gift className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
              Cấu phần 5 • Giới Thiệu Sản Phẩm & Ưu Đãi
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              {featuredProducts.title}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              {featuredProducts.description}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Chips & View Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {featuredProducts.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setCurrentSlideIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#003B70] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <span className="text-xs font-semibold text-slate-400">Hiển thị:</span>
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('carousel')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'carousel' ? 'bg-white text-[#003B70] shadow-xs' : 'text-slate-500'
              }`}
            >
              Carousel Poster
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-[#003B70] shadow-xs' : 'text-slate-500'
              }`}
            >
              Lưới danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Carousel Poster View (as highlighted in PDF) */}
      {viewMode === 'carousel' && filteredItems.length > 0 && (
        <div className="relative max-w-2xl mx-auto bg-white rounded-3xl border border-blue-100 shadow-md p-4 sm:p-6 overflow-hidden">
          {/* Subtle gradient frame & red accent border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#003B70] via-[#ED1C24] to-[#003B70]" />

          <div className="pt-2">
            {/* Poster Card */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#003B70] border border-blue-200 text-xs font-extrabold">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{filteredItems[currentSlideIndex].badge || 'Nổi bật'}</span>
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {currentSlideIndex + 1} / {filteredItems.length}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
              {filteredItems[currentSlideIndex].title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4 line-clamp-2">
              {filteredItems[currentSlideIndex].description}
            </p>

              {/* Poster Image Frame */}
            <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner flex items-center justify-center min-h-[300px] max-h-[440px]">
              <img
                src={filteredItems[currentSlideIndex].imageUrl}
                alt={filteredItems[currentSlideIndex].title}
                referrerPolicy="no-referrer"
                onClick={() => setEnlargedImage({ url: filteredItems[currentSlideIndex].imageUrl, title: filteredItems[currentSlideIndex].title })}
                className="w-full h-auto max-h-[440px] object-contain mx-auto cursor-zoom-in"
                onError={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.display = 'none';
                }}
              />
              <button
                onClick={() => setEnlargedImage({ url: filteredItems[currentSlideIndex].imageUrl, title: filteredItems[currentSlideIndex].title })}
                className="absolute top-3 right-3 px-2.5 py-1.5 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 shadow-sm opacity-90 group-hover:opacity-100 transition-all cursor-pointer"
                title="Phóng to xem rõ chi tiết"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Phóng to</span>
              </button>
            </div>

            {/* Carousel Navigation and Action CTA */}
            <div className="mt-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
                  title="Poster trước"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
                  title="Poster sau"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* MANDATORY BUTTON "Tôi quan tâm" */}
              <button
                onClick={() => handleInterestClick(filteredItems[currentSlideIndex].title)}
                className="flex-1 max-w-xs py-3 px-6 bg-[#ED1C24] hover:bg-red-700 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Tôi quan tâm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Grid Poster View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-blue-400"
            >
              <div className="p-5 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#003B70] border border-blue-100">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{prod.badge || 'Nổi bật'}</span>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#003B70] transition-colors line-clamp-1 mb-1">
                  {prod.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {prod.description}
                </p>
              </div>

              <div className="px-5">
                <div 
                  onClick={() => setEnlargedImage({ url: prod.imageUrl, title: prod.title })}
                  className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 h-52 flex items-center justify-center cursor-zoom-in"
                >
                  <img
                    src={prod.imageUrl}
                    alt={prod.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="p-5 pt-4">
                <button
                  onClick={() => handleInterestClick(prod.title)}
                  className="w-full py-2.5 px-4 bg-[#ED1C24] hover:bg-red-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tôi quan tâm</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enlarged Image Zoom Modal */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[92vh] bg-white rounded-2xl p-4 shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {enlargedImage.title}
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={enlargedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg flex items-center gap-1"
                >
                  <span>Mở ảnh gốc</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setEnlargedImage(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center custom-scrollbar">
              <img
                src={enlargedImage.url}
                alt={enlargedImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[78vh] w-auto object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
