import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { FaqSection } from './components/FaqSection';
import { IpayDownloadSection } from './components/IpayDownloadSection';
import { GamesSection } from './components/GamesSection';
import { SavingsCalculator } from './components/SavingsCalculator';
import { LoanRepaymentSchedule } from './components/LoanRepaymentSchedule';
import { FeaturedProductsSection } from './components/FeaturedProductsSection';
import { BranchNetworkSection } from './components/BranchNetworkSection';
import { LoanChecklistTool } from './components/LoanChecklistTool';
import { AdvisorModal } from './components/AdvisorModal';
import { Footer } from './components/Footer';
import contentData from './data/contentData.json';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState<boolean>(false);
  const [advisorModalMessage, setAdvisorModalMessage] = useState<string | undefined>(undefined);

  const contentRef = useRef<HTMLDivElement | null>(null);

  // GSAP subtle page transition effect on tab switch
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleOpenAdvisor = (customMessage?: string) => {
    setAdvisorModalMessage(customMessage);
    setIsAdvisorModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 3-Zone Sticky Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onOpenAdvisorModal={() => handleOpenAdvisor()}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div ref={contentRef}>
          {activeTab === 'home' && (
            <HeroBanner
              onSelectModule={(modId) => setActiveTab(modId)}
              onOpenAdvisorModal={() => handleOpenAdvisor()}
            />
          )}

          {activeTab === 'faq' && (
            <FaqSection
              onBackToHome={() => setActiveTab('home')}
              onOpenAdvisorModal={(msg) => handleOpenAdvisor(msg)}
            />
          )}

          {activeTab === 'ipay' && (
            <IpayDownloadSection
              onNavigateToFaqGuide={() => setActiveTab('faq')}
            />
          )}

          {activeTab === 'games' && (
            <GamesSection
              onBackToHome={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'savings' && <SavingsCalculator />}

          {activeTab === 'loan' && <LoanRepaymentSchedule />}

          {activeTab === 'products' && (
            <FeaturedProductsSection
              onOpenAdvisorModal={(msg) => handleOpenAdvisor(msg)}
            />
          )}

          {activeTab === 'branches' && <BranchNetworkSection />}

          {activeTab === 'checklist' && <LoanChecklistTool />}
        </div>
      </main>

      {/* Advisor Contact Dialog */}
      <AdvisorModal
        isOpen={isAdvisorModalOpen}
        onClose={() => setIsAdvisorModalOpen(false)}
        customMessage={advisorModalMessage}
      />

      {/* Footer */}
      <Footer
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onOpenAdvisorModal={() => handleOpenAdvisor()}
      />
    </div>
  );
}
