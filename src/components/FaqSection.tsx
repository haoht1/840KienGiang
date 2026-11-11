import React, { useState } from 'react';
import { 
  HelpCircle, 
  ArrowLeft, 
  ExternalLink, 
  Youtube, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  LogOut, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Maximize2
} from 'lucide-react';
import contentData from '../data/contentData.json';
import { FaqItem } from '../types';

interface FaqSectionProps {
  onBackToHome: () => void;
  onOpenAdvisorModal: (message?: string) => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onBackToHome, onOpenAdvisorModal }) => {
  const { faqData, bankInfo } = contentData;
  const cards = faqData.cards as FaqItem[];

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'satisfied' | 'need_help' | 'ended'>('idle');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  const handleSelectCard = (id: string) => {
    setSelectedCardId(id);
    setCurrentStepIndex(0);
    setFeedbackStatus('idle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetToMenu = () => {
    setSelectedCardId(null);
    setCurrentStepIndex(0);
    setFeedbackStatus('idle');
  };

  const handleEndConversation = () => {
    setFeedbackStatus('ended');
  };

  return (
    <div className="space-y-6">
      {/* View 1: 9 Cards Question Selection */}
      {!selectedCard ? (
        <div className="space-y-6">
          {/* Header Question */}
          <div className="p-6 bg-gradient-to-r from-[#003B70] to-[#014f94] text-white rounded-2xl shadow-sm border border-blue-900/40">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl text-amber-300">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
                  Cấu phần 1 • Kiosk Hỗ Trợ Giao Dịch
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                  {faqData.promptQuestion}
                </h2>
                <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                  Vui lòng chọn một nội dung bên dưới để xem hướng dẫn chi tiết từng bước, kèm hình ảnh minh họa và video hướng dẫn trực quan.
                </p>
              </div>
            </div>
          </div>

          {/* 9 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, idx) => (
              <div
                key={card.id}
                onClick={() => handleSelectCard(card.id)}
                className="group p-5 bg-white rounded-xl border border-slate-200/90 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-7 h-7 rounded-full bg-blue-50 text-[#003B70] font-bold text-xs flex items-center justify-center border border-blue-100">
                      0{idx + 1}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {card.type === 'video_direct' ? 'Video trực tiếp' : `${card.steps?.length || 0} bước thao tác`}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#003B70] transition-colors leading-snug mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {card.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#003B70] group-hover:text-[#ED1C24] transition-colors">
                  <span>{card.type === 'video_direct' ? 'Xem video ngay' : 'Xem từng bước'}</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* View 2: Detailed Guide Screen */
        <div className="space-y-6">
          {/* Top Bar for Card */}
          <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={handleResetToMenu}
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#003B70] hover:text-[#ED1C24] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách câu hỏi</span>
            </button>
            <span className="text-xs font-semibold text-slate-400">
              {bankInfo.branchName}
            </span>
          </div>

          {/* Guide Header */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#ED1C24]">
                  Hướng dẫn chi tiết
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  {selectedCard.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {selectedCard.summary}
                </p>
              </div>

              {selectedCard.videoUrl && (
                <a
                  href={selectedCard.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 self-start md:self-auto"
                >
                  <Youtube className="w-4 h-4" />
                  <span>Mở xem trên YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Content: Cards 7, 8, 9 (Direct Video Embed) */}
            {selectedCard.type === 'video_direct' ? (
              <div className="mt-6 space-y-4">
                <div className="aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-slate-200 bg-black shadow-inner">
                  {selectedCard.embedVideoUrl ? (
                    <iframe
                      src={selectedCard.embedVideoUrl}
                      title={selectedCard.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      Đang tải video hướng dẫn...
                    </div>
                  )}
                </div>
                <div className="text-center text-xs text-slate-500">
                  {selectedCard.description}
                </div>
              </div>
            ) : (
              /* Content: Cards 1 to 6 (Step by Step with Images & Texts) */
              <div className="mt-6 space-y-8">
                {/* Step Navigation Pill Indicator */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                  {selectedCard.steps?.map((st, i) => (
                    <button
                      key={st.step}
                      onClick={() => setCurrentStepIndex(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        currentStepIndex === i
                          ? 'bg-[#003B70] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Bước {st.step}
                    </button>
                  ))}
                </div>

                {/* Single Step Interactive Viewer */}
                {selectedCard.steps && selectedCard.steps[currentStepIndex] && (
                  <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-6 border border-slate-200/90">
                    <div className="flex flex-col lg:flex-row gap-6 items-center">
                      {/* Left: Step Description */}
                      <div className="lg:w-1/2 space-y-4 text-left w-full">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#003B70] text-xs font-bold">
                          <span>Bước {selectedCard.steps[currentStepIndex].step} / {selectedCard.steps.length}</span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                          {selectedCard.steps[currentStepIndex].text}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Quan sát hình ảnh minh họa bên cạnh để đối chiếu với giao diện thực tế trên điện thoại của Quý khách.
                        </p>

                        <div className="flex items-center gap-3 pt-3">
                          <button
                            disabled={currentStepIndex === 0}
                            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Bước trước</span>
                          </button>
                          <button
                            disabled={currentStepIndex === selectedCard.steps.length - 1}
                            onClick={() => setCurrentStepIndex((prev) => Math.min(selectedCard.steps!.length - 1, prev + 1))}
                            className="px-4 py-2 bg-[#003B70] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                          >
                            <span>Bước tiếp theo</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Right: Step Illustration Image */}
                      <div className="lg:w-1/2 w-full flex flex-col items-center justify-center">
                        <div className="relative group max-w-xs sm:max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                          <img
                            src={selectedCard.steps[currentStepIndex].image}
                            alt={`Hình ảnh bước ${selectedCard.steps[currentStepIndex].step}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-auto max-h-[380px] object-contain mx-auto"
                            onError={(e) => {
                              // Elegant fallback if image host is unavailable
                              const target = e.target as HTMLElement;
                              target.style.display = 'none';
                            }}
                          />
                          <button
                            onClick={() => setEnlargedImage(selectedCard.steps![currentStepIndex].image || null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-md text-xs flex items-center gap-1 transition-all opacity-80 group-hover:opacity-100"
                            title="Phóng to ảnh"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-2">
                          Ảnh minh họa bước {selectedCard.steps[currentStepIndex].step}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* View All Steps Grid for Quick Overview */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">
                    Toàn bộ các bước quy trình ({selectedCard.steps?.length} bước):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedCard.steps?.map((stepItem, idx) => (
                      <div
                        key={stepItem.step}
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          currentStepIndex === idx
                            ? 'border-[#003B70] bg-blue-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-[#003B70] mb-1">
                          Bước {stepItem.step}
                        </div>
                        <p className="text-slate-600 line-clamp-2">
                          {stepItem.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* YouTube Link Banner at bottom */}
                {selectedCard.videoUrl && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                        <Youtube className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-red-950">
                          Video hướng dẫn thao tác trực tiếp trên YouTube
                        </div>
                        <div className="text-xs text-red-700">
                          Xem video clip chuẩn HD từng thao tác thực tế trên ứng dụng VietinBank iPay
                        </div>
                      </div>
                    </div>
                    <a
                      href={selectedCard.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Youtube className="w-4 h-4" />
                      <span>Xem trên App YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* MANDATORY FEEDBACK SECTION FROM USER SPECIFICATION */}
            <div className="mt-10 pt-6 border-t border-slate-200 bg-slate-50/60 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <div className="max-w-xl mx-auto text-center space-y-4">
                <div className="text-base font-bold text-slate-900">
                  Khách hàng thực hiện ổn hay chưa?
                </div>

                {feedbackStatus === 'idle' && (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setFeedbackStatus('satisfied')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã ổn / Thực hiện thành công</span>
                    </button>
                    <button
                      onClick={() => setFeedbackStatus('need_help')}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Chưa ổn / Cần hỗ trợ thêm</span>
                    </button>
                  </div>
                )}

                {/* Case 1: Đã ổn */}
                {feedbackStatus === 'satisfied' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
                    <div className="text-emerald-800 text-sm font-semibold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Tuyệt vời! VietinBank rất vui vì đã hỗ trợ được Quý khách.</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleResetToMenu}
                        className="px-4 py-2 bg-[#003B70] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Quay lại menu chính
                      </button>
                      <button
                        onClick={handleEndConversation}
                        className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Kết thúc cuộc trò chuyện</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Case 2: Chưa ổn -> Contact Huỳnh Thái Hào */}
                {feedbackStatus === 'need_help' && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-in fade-in text-left">
                    <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                      “{faqData.supportContactMessage}”
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <a
                        href={`tel:${bankInfo.advisorPhone}`}
                        className="px-4 py-2 bg-[#ED1C24] hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Gọi ngay Cán bộ {bankInfo.advisorName} ({bankInfo.advisorPhone})</span>
                      </a>
                      <button
                        onClick={handleResetToMenu}
                        className="px-4 py-2 bg-[#003B70] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        Quay lại menu chính
                      </button>
                      <button
                        onClick={handleEndConversation}
                        className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Kết thúc cuộc trò chuyện</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Case 3: Kết thúc cuộc trò chuyện */}
                {feedbackStatus === 'ended' && (
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-3 animate-in fade-in">
                    <div className="text-[#003B70] font-bold text-sm sm:text-base">
                      “{faqData.endConversationMessage}”
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={handleResetToMenu}
                        className="px-4 py-2 bg-[#003B70] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Quay lại menu chính
                      </button>
                    </div>
                  </div>
                )}

                {/* Default actions if not satisfied/need_help yet */}
                {feedbackStatus === 'idle' && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleResetToMenu}
                      className="text-xs font-semibold text-slate-600 hover:text-[#003B70] underline cursor-pointer"
                    >
                      Quay lại menu chính
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      onClick={handleEndConversation}
                      className="text-xs font-semibold text-slate-600 hover:text-[#ED1C24] underline cursor-pointer"
                    >
                      Kết thúc cuộc trò chuyện
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white p-2 rounded-xl">
            <img
              src={enlargedImage}
              alt="Enlarged step"
              className="max-h-[85vh] w-auto mx-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
