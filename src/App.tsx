import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  FileText,
} from 'lucide-react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DeliveryNoteEditor } from './components/DeliveryNoteEditor';
import { PurchaseTableEditor } from './components/PurchaseTableEditor';
import { DocumentList } from './components/DocumentList';
import { CustomerList } from './components/CustomerList';
import { ProductCatalog } from './components/ProductCatalog';
import { StoreManagement } from './components/StoreManagement';
import { BackupRestore } from './components/BackupRestore';
import { SettingsView } from './components/SettingsModal';
import { DocumentPreviewModal } from './components/DocumentPreviewModal';

import { DeliveryNote, PurchaseTableDoc, Customer } from './types';
import { getDefaultStore } from './utils/storage';
import { generateDocCode } from './utils/formatters';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [storeName, setStoreName] = useState<string>('Hộ Kinh Doanh An Phát');

  // Editing state
  const [editingDeliveryNote, setEditingDeliveryNote] = useState<DeliveryNote | null>(null);
  const [editingPurchaseDoc, setEditingPurchaseDoc] = useState<PurchaseTableDoc | null>(null);

  // Preview Modal state
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewType, setPreviewType] = useState<'DELIVERY' | 'PURCHASE'>('DELIVERY');
  const [previewDeliveryDoc, setPreviewDeliveryDoc] = useState<DeliveryNote | undefined>(undefined);
  const [previewPurchaseDoc, setPreviewPurchaseDoc] = useState<PurchaseTableDoc | undefined>(undefined);

  // Load initial store
  const refreshStoreAndSettings = async () => {
    const store = await getDefaultStore();
    if (store) setStoreName(store.name);
  };

  useEffect(() => {
    refreshStoreAndSettings();
  }, []);

  // Navigations with reset
  const handleNav = (tab: NavTab) => {
    if (tab === 'delivery_create') {
      setEditingDeliveryNote(null);
    }
    if (tab === 'purchase_create') {
      setEditingPurchaseDoc(null);
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Preview Triggers
  const handleOpenDeliveryPreview = (note: DeliveryNote) => {
    setPreviewType('DELIVERY');
    setPreviewDeliveryDoc(note);
    setPreviewPurchaseDoc(undefined);
    setPreviewOpen(true);
  };

  const handleOpenPurchasePreview = (doc: PurchaseTableDoc) => {
    setPreviewType('PURCHASE');
    setPreviewPurchaseDoc(doc);
    setPreviewDeliveryDoc(undefined);
    setPreviewOpen(true);
  };

  // Clone Triggers (creates independent copy with new id & current date)
  const handleCloneDelivery = (note: DeliveryNote) => {
    const clone: DeliveryNote = {
      ...note,
      id: `pgh-${Date.now()}`,
      code: generateDocCode('PGH'),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: false,
      isDemo: false,
    };
    setEditingDeliveryNote(clone);
    setActiveTab('delivery_create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClonePurchase = (doc: PurchaseTableDoc) => {
    const clone: PurchaseTableDoc = {
      ...doc,
      id: `bkm-${Date.now()}`,
      code: generateDocCode('BKM'),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: false,
      isDemo: false,
    };
    setEditingPurchaseDoc(clone);
    setActiveTab('purchase_create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Create doc for customer from Customer List
  const handleCreateDeliveryForCustomer = (cust: Customer) => {
    setEditingDeliveryNote({
      id: `pgh-${Date.now()}`,
      code: generateDocCode('PGH'),
      date: new Date().toISOString().split('T')[0],
      store: {
        id: 'default',
        name: storeName,
        address: '',
        phone: '',
        businessField: cust.businessField || 'Thương mại',
      },
      customer: {
        id: cust.id,
        name: cust.name,
        phone: cust.phone,
        address: cust.address,
        notes: cust.notes,
      },
      businessCategory: cust.businessField || 'Vật tư nông nghiệp',
      items: [
        {
          id: `item-${Date.now()}`,
          productName: '',
          unit: 'Cái',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ],
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentStatus: 'UNPAID',
      totalInWords: 'Không đồng',
      isDraft: false,
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setActiveTab('delivery_create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreatePurchaseForCustomer = (cust: Customer) => {
    setEditingPurchaseDoc({
      id: `bkm-${Date.now()}`,
      code: generateDocCode('BKM'),
      date: new Date().toISOString().split('T')[0],
      buyerName: storeName,
      buyerAddress: '',
      purchaseLocation: '',
      buyerOfficer: '',
      businessCategory: cust.businessField || 'Thu mua lúa',
      items: [
        {
          id: `p-item-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          sellerName: cust.name,
          sellerAddress: cust.address,
          sellerCccd: cust.cccd || '',
          sellerPhone: cust.phone,
          productName: '',
          quantityKg: 100,
          unitPrice: 0,
          totalAmount: 0,
          isPaidReceived: true,
        },
      ],
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      paymentStatus: 'PAID',
      totalInWords: 'Không đồng',
      isDraft: false,
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setActiveTab('purchase_create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans">
      {/* Mobile Header Bar */}
      <header className="lg:hidden no-print sticky top-0 z-40 bg-[#0a192f] text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
            title="Mở menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs text-white">
              VT
            </div>
            <span className="font-bold text-xs tracking-tight truncate max-w-[170px]">
              {storeName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNav('delivery_create')}
            className="p-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1"
          >
            <FileText size={15} />
            <span className="hidden sm:inline">Tạo phiếu</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={handleNav}
            storeName={storeName}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-64 max-w-[80vw] h-full shadow-2xl">
              <Sidebar
                activeTab={activeTab}
                onSelectTab={handleNav}
                storeName={storeName}
              />
            </div>
          </div>
        )}

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={handleNav}
              onPreviewDelivery={handleOpenDeliveryPreview}
              onPreviewPurchase={handleOpenPurchasePreview}
              onCloneDelivery={handleCloneDelivery}
              onClonePurchase={handleClonePurchase}
            />
          )}

          {activeTab === 'delivery_create' && (
            <DeliveryNoteEditor
              initialNote={editingDeliveryNote}
              onPreview={handleOpenDeliveryPreview}
              onSaveSuccess={() => {
                refreshStoreAndSettings();
                setActiveTab('documents');
              }}
            />
          )}

          {activeTab === 'purchase_create' && (
            <PurchaseTableEditor
              initialDoc={editingPurchaseDoc}
              onPreview={handleOpenPurchasePreview}
              onSaveSuccess={() => {
                refreshStoreAndSettings();
                setActiveTab('documents');
              }}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentList
              onPreviewDelivery={handleOpenDeliveryPreview}
              onPreviewPurchase={handleOpenPurchasePreview}
              onEditDelivery={(note) => {
                setEditingDeliveryNote(note);
                setActiveTab('delivery_create');
              }}
              onEditPurchase={(doc) => {
                setEditingPurchaseDoc(doc);
                setActiveTab('purchase_create');
              }}
              onCloneDelivery={handleCloneDelivery}
              onClonePurchase={handleClonePurchase}
              onCreateDelivery={() => handleNav('delivery_create')}
              onCreatePurchase={() => handleNav('purchase_create')}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerList
              onCreateDeliveryForCustomer={handleCreateDeliveryForCustomer}
              onCreatePurchaseForCustomer={handleCreatePurchaseForCustomer}
            />
          )}

          {activeTab === 'products' && <ProductCatalog />}

          {activeTab === 'store' && <StoreManagement />}

          {activeTab === 'backup' && (
            <BackupRestore
              onDataChanged={() => {
                refreshStoreAndSettings();
              }}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Universal A4 Document Preview & Export Modal */}
      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentType={previewType}
        deliveryNote={previewDeliveryDoc}
        purchaseTable={previewPurchaseDoc}
      />
    </div>
  );
}
