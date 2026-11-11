import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileCheck, 
  Printer, 
  Download, 
  Plus, 
  Trash2, 
  Save, 
  Copy, 
  RotateCcw, 
  Search, 
  Eye, 
  CheckSquare, 
  Square, 
  FileText, 
  Edit3, 
  X, 
  Check, 
  User, 
  Building, 
  FolderPlus,
  AlertCircle
} from 'lucide-react';
import contentData from '../data/contentData.json';
import { ChecklistGroup, ChecklistDocItem, SavedChecklist } from '../types';

export const LoanChecklistTool: React.FC = () => {
  const { checklistData, bankInfo } = contentData;

  // View state
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'saved' | 'catalog'>('create');
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Customer Form States
  const [salutation, setSalutation] = useState<string>('Ông');
  const [customSalutation, setCustomSalutation] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Nguyễn Văn A');
  const [customerType, setCustomerType] = useState<'personal' | 'corporate'>('personal');
  const [corporateType, setCorporateType] = useState<string>('Công ty TNHH');
  const [customCorporateType, setCustomCorporateType] = useState<string>('');
  const [phone, setPhone] = useState<string>('0912345678');
  const [coBorrower, setCoBorrower] = useState<string>('');
  const [officer, setOfficer] = useState<string>(bankInfo.advisorName);
  const [createdDate, setCreatedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [generalNote, setGeneralNote] = useState<string>('');

  // Loan Purposes
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>(['V01']);
  const [customPurposeName, setCustomPurposeName] = useState<string>('');

  // Active Checklist Groups (I. Pháp lý, II. Vay vốn, III. Thu nhập/Tài chính, IV. Tài sản bảo đảm)
  const [groups, setGroups] = useState<ChecklistGroup[]>([]);

  // Saved checklists list
  const [savedList, setSavedList] = useState<SavedChecklist[]>(() => {
    try {
      const data = localStorage.getItem('vtb_loan_saved_checklists');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Search & filter in saved list
  const [savedSearchQuery, setSavedSearchQuery] = useState<string>('');

  // Catalog master list (for Quản lý danh mục hồ sơ mẫu)
  const [catalogItems, setCatalogItems] = useState<Array<{ id: string; name: string; group: string; customerType: string }>>(() => {
    try {
      const saved = localStorage.getItem('vtb_loan_custom_catalog');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Seed initial items from contentData
    const items: Array<{ id: string; name: string; group: string; customerType: string }> = [];
    checklistData.masterCatalog.personal.legal.forEach((doc, i) => {
      items.push({ id: `p-leg-${i}`, name: doc, group: 'I. HỒ SƠ PHÁP LÝ', customerType: 'personal' });
    });
    return items;
  });

  // New item modal or inline inputs for custom doc
  const [manualInputs, setManualInputs] = useState<Record<string, { name: string; copy: boolean; original: boolean; image: boolean; note: string; saveToMaster: boolean }>>({
    legal: { name: '', copy: false, original: false, image: false, note: '', saveToMaster: false },
    loan: { name: '', copy: false, original: false, image: false, note: '', saveToMaster: false },
    income: { name: '', copy: false, original: false, image: false, note: '', saveToMaster: false },
    collateral: { name: '', copy: false, original: false, image: false, note: '', saveToMaster: false },
  });

  // Re-generate default groups when customer type or purposes change
  useEffect(() => {
    const newGroups: ChecklistGroup[] = [];

    // Group 1: HỒ SƠ PHÁP LÝ
    const legalItems: ChecklistDocItem[] = [];
    if (customerType === 'personal') {
      checklistData.masterCatalog.personal.legal.forEach((doc, idx) => {
        legalItems.push({
          id: `leg-p-${idx}`,
          name: doc,
          selected: false,
          copy: false,
          original: false,
          image: false,
          note: '',
        });
      });
    } else {
      checklistData.masterCatalog.corporate.legalGeneral.forEach((doc, idx) => {
        legalItems.push({
          id: `leg-c-gen-${idx}`,
          name: doc,
          selected: false,
          copy: false,
          original: false,
          image: false,
          note: '',
        });
      });
      // Specific to corporate type
      const byType = (checklistData.masterCatalog.corporate.legalByType as any)[corporateType] || [];
      byType.forEach((doc: string, idx: number) => {
        legalItems.push({
          id: `leg-c-type-${idx}`,
          name: doc,
          selected: false,
          copy: false,
          original: false,
          image: false,
          note: '',
        });
      });
    }

    newGroups.push({
      groupId: 'legal',
      groupTitle: 'I. HỒ SƠ PHÁP LÝ',
      items: legalItems,
    });

    // Group 2: HỒ SƠ VAY VỐN
    const loanItems: ChecklistDocItem[] = [];
    selectedPurposes.forEach((pCode) => {
      let docs: string[] = [];
      if (customerType === 'personal') {
        docs = (checklistData.masterCatalog.personal.loanPurposes as any)[pCode] || [];
      } else {
        docs = (checklistData.masterCatalog.corporate.loanPurposes as any)[pCode] || [];
      }

      docs.forEach((doc, idx) => {
        // avoid duplicates if multiple purposes share a document
        if (!loanItems.some((it) => it.name === doc)) {
          loanItems.push({
            id: `loan-${pCode}-${idx}`,
            name: doc,
            selected: false,
            copy: false,
            original: false,
            image: false,
            note: '',
          });
        }
      });
    });

    newGroups.push({
      groupId: 'loan',
      groupTitle: 'II. HỒ SƠ VAY VỐN',
      items: loanItems,
    });

    // Group 3: HỒ SƠ CHỨNG MINH NGUỒN THU NHẬP / TÌNH HÌNH TÀI CHÍNH
    const financialItems: ChecklistDocItem[] = [];
    if (customerType === 'personal') {
      checklistData.masterCatalog.personal.incomeGroups.forEach((grp, gIdx) => {
        grp.items.forEach((doc, idx) => {
          financialItems.push({
            id: `inc-${gIdx}-${idx}`,
            name: `${doc} (${grp.name.split('–')[1]?.trim() || grp.name})`,
            selected: false,
            copy: false,
            original: false,
            image: false,
            note: '',
          });
        });
      });
    } else {
      checklistData.masterCatalog.corporate.financialGroups.forEach((grp, gIdx) => {
        grp.items.forEach((doc, idx) => {
          financialItems.push({
            id: `fin-${gIdx}-${idx}`,
            name: `${doc} (${grp.name.split('–')[1]?.trim() || grp.name})`,
            selected: false,
            copy: false,
            original: false,
            image: false,
            note: '',
          });
        });
      });
    }

    newGroups.push({
      groupId: 'income',
      groupTitle: customerType === 'personal' ? 'III. HỒ SƠ CHỨNG MINH NGUỒN THU NHẬP' : 'III. HỒ SƠ CHỨNG MINH TÌNH HÌNH TÀI CHÍNH',
      items: financialItems,
    });

    // Group 4: HỒ SƠ TÀI SẢN BẢO ĐẢM
    const collateralItems: ChecklistDocItem[] = [];
    const colSource = customerType === 'personal'
      ? checklistData.masterCatalog.personal.collateralGroups
      : checklistData.masterCatalog.corporate.collateralGroups;

    colSource.forEach((grp, gIdx) => {
      grp.items.forEach((doc, idx) => {
        collateralItems.push({
          id: `col-${gIdx}-${idx}`,
          name: `${doc} (${grp.name.split('–')[1]?.trim() || grp.name})`,
          selected: false,
          copy: false,
          original: false,
          image: false,
          note: '',
        });
      });
    });

    newGroups.push({
      groupId: 'collateral',
      groupTitle: 'IV. HỒ SƠ TÀI SẢN BẢO ĐẢM',
      items: collateralItems,
    });

    setGroups(newGroups);
  }, [customerType, corporateType, selectedPurposes]);

  // Toggle Item checkbox
  const toggleItemSelect = (groupId: string, itemId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.groupId !== groupId) return g;
        return {
          ...g,
          items: g.items.map((it) => {
            if (it.id !== itemId) return it;
            const nextSelected = !it.selected;
            return {
              ...it,
              selected: nextSelected,
              // If selected and no copy/original/image chosen yet, we leave them unchecked per prompt:
              // "Tất cả giấy tờ mặc định ở trạng thái chưa chọn. Không tự động đánh dấu Bản copy, Bản chính hoặc Hình ảnh."
            };
          }),
        };
      })
    );
  };

  // Toggle Copy / Original / Image
  const toggleDocType = (groupId: string, itemId: string, field: 'copy' | 'original' | 'image') => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.groupId !== groupId) return g;
        return {
          ...g,
          items: g.items.map((it) => {
            if (it.id !== itemId) return it;
            const updated = { ...it, [field]: !it[field] };
            // If checking any of copy/original/image, make sure selected is true
            if (updated.copy || updated.original || updated.image) {
              updated.selected = true;
            }
            return updated;
          }),
        };
      })
    );
  };

  // Change individual note
  const changeItemNote = (groupId: string, itemId: string, noteVal: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.groupId !== groupId) return g;
        return {
          ...g,
          items: g.items.map((it) => (it.id === itemId ? { ...it, note: noteVal } : it)),
        };
      })
    );
  };

  // Add custom manual document to group
  const handleAddManualDoc = (groupId: string) => {
    const input = manualInputs[groupId];
    if (!input || !input.name.trim()) return;

    const newItem: ChecklistDocItem = {
      id: `manual-${Date.now()}-${Math.random()}`,
      name: input.name.trim(),
      selected: true,
      copy: input.copy,
      original: input.original,
      image: input.image,
      note: input.note.trim(),
      isCustom: true,
    };

    setGroups((prev) =>
      prev.map((g) => {
        if (g.groupId !== groupId) return g;
        return {
          ...g,
          items: [...g.items, newItem],
        };
      })
    );

    // If "Lưu hồ sơ này vào danh mục mẫu dùng chung" is checked
    if (input.saveToMaster) {
      const newCat = {
        id: `custom-cat-${Date.now()}`,
        name: input.name.trim(),
        group: groupId === 'legal' ? 'I. HỒ SƠ PHÁP LÝ' : groupId === 'loan' ? 'II. HỒ SƠ VAY VỐN' : groupId === 'income' ? 'III. THU NHẬP' : 'IV. TÀI SẢN',
        customerType,
      };
      const updatedCat = [...catalogItems, newCat];
      setCatalogItems(updatedCat);
      localStorage.setItem('vtb_loan_custom_catalog', JSON.stringify(updatedCat));
    }

    // Reset input
    setManualInputs((prev) => ({
      ...prev,
      [groupId]: { name: '', copy: false, original: false, image: false, note: '', saveToMaster: false },
    }));
  };

  // Remove custom manual document
  const handleRemoveManualDoc = (groupId: string, itemId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.groupId !== groupId) return g;
        return {
          ...g,
          items: g.items.filter((it) => it.id !== itemId),
        };
      })
    );
  };

  // Save current checklist to localStorage
  const handleSaveCurrentChecklist = () => {
    const id = `chk-${Date.now()}`;
    const newEntry: SavedChecklist = {
      id,
      customerName: customerName || 'Khách hàng',
      salutation: salutation === 'Khác' ? customSalutation : salutation,
      phone,
      coBorrower,
      officer,
      createdDate,
      generalNote,
      customerType,
      corporateType: customerType === 'corporate' ? (corporateType === 'Loại hình khác (nhập thủ công)' ? customCorporateType : corporateType) : undefined,
      selectedPurposes,
      groups: JSON.parse(JSON.stringify(groups)), // snapshot of documents at this moment!
      updatedAt: new Date().toISOString(),
    };

    const updated = [newEntry, ...savedList.filter((s) => s.id !== id)];
    setSavedList(updated);
    localStorage.setItem('vtb_loan_saved_checklists', JSON.stringify(updated));
    alert('Đã lưu checklist hồ sơ thành công vào hệ thống!');
  };

  // Load a saved checklist
  const handleLoadSavedChecklist = (saved: SavedChecklist) => {
    setCustomerName(saved.customerName);
    setSalutation(saved.salutation);
    setPhone(saved.phone || '');
    setCoBorrower(saved.coBorrower || '');
    setOfficer(saved.officer || '');
    setCreatedDate(saved.createdDate);
    setGeneralNote(saved.generalNote || '');
    setCustomerType(saved.customerType);
    if (saved.corporateType) setCorporateType(saved.corporateType);
    setSelectedPurposes(saved.selectedPurposes || []);
    setGroups(saved.groups);
    setActiveSubTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete a saved checklist
  const handleDeleteSaved = (id: string) => {
    if (confirm('Quý khách có chắc chắn muốn xóa checklist này?')) {
      const updated = savedList.filter((s) => s.id !== id);
      setSavedList(updated);
      localStorage.setItem('vtb_loan_saved_checklists', JSON.stringify(updated));
    }
  };

  // Clone a saved checklist to create a new one
  const handleCloneSaved = (saved: SavedChecklist) => {
    handleLoadSavedChecklist(saved);
    setCustomerName(`${saved.customerName} (Bản sao)`);
  };

  // Count selected documents
  const totalSelectedDocs = useMemo(() => {
    return groups.reduce((acc, g) => acc + g.items.filter((it) => it.selected).length, 0);
  }, [groups]);

  // Selected purposes label for header and PDF
  const purposeDisplayString = useMemo(() => {
    const list = customerType === 'personal'
      ? checklistData.personalPurposes
      : checklistData.corporatePurposes;

    const names = selectedPurposes
      .map((p) => {
        if (p === 'V08' || p === 'DN08') return customPurposeName || 'Mục đích khác';
        return list.find((item) => item.id === p)?.name;
      })
      .filter(Boolean);

    return names.join(', ');
  }, [selectedPurposes, customerType, customPurposeName]);

  // Format filename for PDF export per prompt: Checklist_HoSo_[TenKhachHang]_[NgayThangNam].pdf
  const pdfFileName = useMemo(() => {
    const cleanName = customerName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');
    const datePart = createdDate.replace(/-/g, '');
    return `Checklist_HoSo_${cleanName || 'KhachHang'}_${datePart}.pdf`;
  }, [customerName, createdDate]);

  // Native Print / PDF trigger
  const handlePrintPDF = () => {
    setPreviewMode(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Sub-tab Controls (Hidden in print) */}
      <div className="no-print space-y-4">
        <div className="p-6 bg-gradient-to-r from-[#003B70] via-[#004e92] to-[#003B70] text-white rounded-2xl shadow-sm border border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">
              Cấu phần 8 • Nghiệp Vụ Tín Dụng Quầy Giao Dịch
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              CHECKLIST HỒ SƠ TÍN DỤNG – VIETINBANK KIÊN GIANG
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
              Hỗ trợ lập danh mục hồ sơ vay vốn chuẩn hóa cho Khách hàng Cá nhân & Doanh nghiệp, xuất file PDF in ấn chuyên nghiệp khổ A4.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSaveCurrentChecklist}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu checklist</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="px-4 py-2 bg-[#ED1C24] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Xuất File PDF / In</span>
            </button>
          </div>
        </div>

        {/* 3 Sub-tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => {
              setActiveSubTab('create');
              setPreviewMode(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'create' && !previewMode
                ? 'bg-[#003B70] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Lập Checklist Mới ({totalSelectedDocs} giấy tờ đã chọn)</span>
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              previewMode
                ? 'bg-[#ED1C24] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem trước PDF A4 ({previewMode ? 'Đang bật' : 'Xem ngay'})</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('saved');
              setPreviewMode(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'saved'
                ? 'bg-[#003B70] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Checklist Đã Lập ({savedList.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('catalog');
              setPreviewMode(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'catalog'
                ? 'bg-[#003B70] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Quản Lý Danh Mục Mẫu</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 2: CHECKLIST ĐÃ LẬP (Quản lý các hồ sơ đã lưu) */}
      {activeSubTab === 'saved' && (
        <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Danh sách Checklist đã lập</h3>
              <p className="text-xs text-slate-500">Tra cứu, chỉnh sửa hoặc xuất lại PDF từ các bản ghi đã lưu.</p>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khách hàng..."
                value={savedSearchQuery}
                onChange={(e) => setSavedSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-[#003B70]"
              />
            </div>
          </div>

          {savedList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có checklist nào được lưu. Hãy lập checklist và bấm nút "Lưu checklist" ở trên.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedList
                .filter((s) => s.customerName.toLowerCase().includes(savedSearchQuery.toLowerCase()))
                .map((saved) => (
                  <div
                    key={saved.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-blue-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#003B70]">
                          {saved.customerType === 'personal' ? 'Cá nhân' : 'Doanh nghiệp'}
                        </span>
                        <span className="text-[11px] text-slate-400">{saved.createdDate}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">
                        {saved.salutation} {saved.customerName}
                      </h4>
                      <div className="text-xs text-slate-600 mb-2">
                        Cán bộ: <strong>{saved.officer || bankInfo.advisorName}</strong>
                      </div>
                      <div className="text-xs text-slate-500">
                        {saved.groups.reduce((acc, g) => acc + g.items.filter((i) => i.selected).length, 0)} giấy tờ được chọn
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleLoadSavedChecklist(saved)}
                        className="text-xs font-bold text-[#003B70] hover:underline cursor-pointer"
                      >
                        Chỉnh sửa / Mở
                      </button>
                      <button
                        onClick={() => handleCloneSaved(saved)}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(saved.id)}
                        className="text-xs text-red-600 hover:text-red-800 cursor-pointer p-1"
                        title="Xóa checklist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: QUẢN LÝ DANH MỤC HỒ SƠ MẪU */}
      {activeSubTab === 'catalog' && (
        <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Quản lý danh mục hồ sơ mẫu dùng chung</h3>
              <p className="text-xs text-slate-500">
                Xem toàn bộ danh mục hồ sơ mẫu, tùy chỉnh hoặc khôi phục danh mục mặc định ban đầu.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('Khôi phục danh mục mẫu về mặc định của VietinBank?')) {
                  localStorage.removeItem('vtb_loan_custom_catalog');
                  alert('Đã khôi phục danh mục mẫu mặc định!');
                }
              }}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Khôi phục mặc định</span>
            </button>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-slate-700 leading-relaxed">
            * Lưu ý: Không cho phép việc chỉnh sửa một hồ sơ mẫu làm thay đổi các checklist đã lập và lưu trước đó (dữ liệu các checklist đã lập được lưu trữ độc lập dưới dạng snapshot).
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Danh mục hồ sơ mẫu đã lưu ({catalogItems.length} mục)
            </h4>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl custom-scrollbar">
              {catalogItems.map((cat, i) => (
                <div key={cat.id || i} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#003B70]">{cat.group}</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-medium text-slate-800">{cat.name}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {cat.customerType === 'personal' ? 'Cá nhân' : 'Doanh nghiệp'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: LẬP CHECKLIST MỚI (Main Interactive Workspace) */}
      {activeSubTab === 'create' && !previewMode && (
        <div className="no-print space-y-6">
          {/* Section 1: Thông tin khách hàng & Phân loại mục đích */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#003B70]" />
                <span>1. Thông tin khách hàng & Nhu cầu vay vốn</span>
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                Mẫu chuẩn VietinBank Kiên Giang
              </span>
            </div>

            {/* Row 1: Loại khách hàng Selector */}
            <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-xl max-w-md">
              <button
                type="button"
                onClick={() => setCustomerType('personal')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  customerType === 'personal'
                    ? 'bg-[#003B70] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Khách hàng cá nhân</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('corporate')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  customerType === 'corporate'
                    ? 'bg-[#003B70] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Khách hàng doanh nghiệp</span>
              </button>
            </div>

            {/* Row 2: Customer Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Danh xưng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Danh xưng
                </label>
                <select
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#003B70]"
                >
                  {checklistData.salutations.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {salutation === 'Khác' && (
                  <input
                    type="text"
                    placeholder="Nhập danh xưng..."
                    value={customSalutation}
                    onChange={(e) => setCustomSalutation(e.target.value)}
                    className="mt-1.5 w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                )}
              </div>

              {/* Tên khách hàng */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {customerType === 'personal' ? 'Họ và tên khách hàng' : 'Tên doanh nghiệp / Công ty'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nhập họ tên hoặc tên doanh nghiệp"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#003B70]"
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Không bắt buộc"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#003B70]"
                />
              </div>
            </div>

            {/* Corporate Type Selector if corporate */}
            {customerType === 'corporate' && (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <label className="block text-xs font-bold text-[#003B70] uppercase tracking-wider">
                  Loại hình doanh nghiệp
                </label>
                <div className="flex flex-wrap gap-2">
                  {checklistData.corporateTypes.map((corp) => (
                    <button
                      key={corp}
                      type="button"
                      onClick={() => setCorporateType(corp)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        corporateType === corp
                          ? 'bg-[#003B70] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {corp}
                    </button>
                  ))}
                </div>
                {corporateType === 'Loại hình khác (nhập thủ công)' && (
                  <input
                    type="text"
                    placeholder="Nhập loại hình doanh nghiệp..."
                    value={customCorporateType}
                    onChange={(e) => setCustomCorporateType(e.target.value)}
                    className="w-full max-w-sm px-3 py-1.5 rounded-lg border border-slate-300 text-xs mt-2"
                  />
                )}
              </div>
            )}

            {/* Row 3: Mục đích vay vốn (Cho phép chọn nhiều mục đích) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Mục đích vay vốn (Cho phép chọn nhiều mục đích)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {(customerType === 'personal'
                  ? checklistData.personalPurposes
                  : checklistData.corporatePurposes
                ).map((purp) => {
                  const isChecked = selectedPurposes.includes(purp.id);
                  return (
                    <div
                      key={purp.id}
                      onClick={() => {
                        setSelectedPurposes((prev) =>
                          isChecked
                            ? prev.length > 1
                              ? prev.filter((p) => p !== purp.id)
                              : prev
                            : [...prev, purp.id]
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-start gap-2 ${
                        isChecked
                          ? 'border-[#003B70] bg-blue-50/60 text-[#003B70] font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 accent-[#003B70]"
                      />
                      <span className="leading-tight">{purp.name}</span>
                    </div>
                  );
                })}
              </div>

              {(selectedPurposes.includes('V08') || selectedPurposes.includes('DN08')) && (
                <div className="mt-2.5 max-w-md">
                  <input
                    type="text"
                    value={customPurposeName}
                    onChange={(e) => setCustomPurposeName(e.target.value)}
                    placeholder="Nhập tên mục đích vay khác..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Row 4: Officers, Co-borrowers, Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Người đồng vay / Người liên quan
                </label>
                <input
                  type="text"
                  value={coBorrower}
                  onChange={(e) => setCoBorrower(e.target.value)}
                  placeholder="Không bắt buộc"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cán bộ tín dụng phụ trách
                </label>
                <input
                  type="text"
                  value={officer}
                  onChange={(e) => setOfficer(e.target.value)}
                  placeholder="Huỳnh Thái Hào"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ngày lập danh mục
                </label>
                <input
                  type="date"
                  value={createdDate}
                  onChange={(e) => setCreatedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: 4 Groups of Documents with Interactive Checkboxes */}
          <div className="space-y-6">
            {groups.map((grp) => (
              <div
                key={grp.groupId}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Group Header */}
                <div className="bg-[#003B70] text-white px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24]" />
                    <h4 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
                      {grp.groupTitle}
                    </h4>
                  </div>
                  <span className="text-xs text-blue-200 font-semibold">
                    {grp.items.filter((it) => it.selected).length} / {grp.items.length} được chọn
                  </span>
                </div>

                {/* Table Header */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-12">Chọn</th>
                        <th className="py-2.5 px-3">Tên giấy tờ / Hồ sơ</th>
                        <th className="py-2.5 px-2 text-center w-24">Bản copy</th>
                        <th className="py-2.5 px-2 text-center w-24">Bản chính</th>
                        <th className="py-2.5 px-2 text-center w-24">Hình ảnh</th>
                        <th className="py-2.5 px-3 w-64">Ghi chú riêng</th>
                        <th className="py-2.5 px-2 text-center w-12">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grp.items.map((doc, docIdx) => (
                        <tr
                          key={doc.id}
                          className={`transition-colors ${
                            doc.selected ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Master checkbox for this row */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={doc.selected}
                              onChange={() => toggleItemSelect(grp.groupId, doc.id)}
                              className="w-4 h-4 rounded text-[#003B70] accent-[#003B70] cursor-pointer"
                            />
                          </td>

                          {/* Document Name */}
                          <td className="py-2.5 px-3">
                            <span
                              onClick={() => toggleItemSelect(grp.groupId, doc.id)}
                              className={`cursor-pointer ${
                                doc.selected ? 'font-bold text-slate-900' : 'text-slate-700'
                              }`}
                            >
                              {doc.name}
                            </span>
                            {doc.isCustom && (
                              <span className="ml-2 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                Thủ công
                              </span>
                            )}
                          </td>

                          {/* 3 Independent checkboxes: Copy */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={doc.copy}
                              onChange={() => toggleDocType(grp.groupId, doc.id, 'copy')}
                              className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                            />
                          </td>

                          {/* Original */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={doc.original}
                              onChange={() => toggleDocType(grp.groupId, doc.id, 'original')}
                              className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                            />
                          </td>

                          {/* Image */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={doc.image}
                              onChange={() => toggleDocType(grp.groupId, doc.id, 'image')}
                              className="w-4 h-4 rounded text-purple-600 accent-purple-600 cursor-pointer"
                            />
                          </td>

                          {/* Individual Note */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={doc.note}
                              onChange={(e) => changeItemNote(grp.groupId, doc.id, e.target.value)}
                              placeholder="Ví dụ: 03 tháng gần nhất, bản chụp rõ nét..."
                              className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#003B70]"
                            />
                          </td>

                          {/* Action */}
                          <td className="py-2.5 px-2 text-center">
                            {doc.isCustom && (
                              <button
                                onClick={() => handleRemoveManualDoc(grp.groupId, doc.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Xóa hồ sơ thủ công"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Manual Add Box at bottom of each group as required */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#003B70]" />
                    <span>Hồ sơ khác – Nhập thủ công vào nhóm này</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Nhập tên hồ sơ cần bổ sung..."
                        value={manualInputs[grp.groupId]?.name || ''}
                        onChange={(e) =>
                          setManualInputs((prev) => ({
                            ...prev,
                            [grp.groupId]: { ...prev[grp.groupId], name: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Ghi chú riêng cho hồ sơ này..."
                        value={manualInputs[grp.groupId]?.note || ''}
                        onChange={(e) =>
                          setManualInputs((prev) => ({
                            ...prev,
                            [grp.groupId]: { ...prev[grp.groupId], note: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>

                    <div className="sm:col-span-3 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={manualInputs[grp.groupId]?.saveToMaster || false}
                          onChange={(e) =>
                            setManualInputs((prev) => ({
                              ...prev,
                              [grp.groupId]: { ...prev[grp.groupId], saveToMaster: e.target.checked },
                            }))
                          }
                          className="accent-[#003B70]"
                        />
                        <span>Lưu vào mẫu</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleAddManualDoc(grp.groupId)}
                        className="px-3 py-1.5 bg-[#003B70] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                      >
                        Thêm hồ sơ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Floating Bar */}
          <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-300 shadow-xl flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-800">
                Tổng cộng: <strong className="text-[#ED1C24]">{totalSelectedDocs}</strong> giấy tờ được chọn
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600">
                Khách hàng: <strong>{customerName || 'Chưa nhập'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveCurrentChecklist}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu checklist này</span>
              </button>
              <button
                onClick={handlePrintPDF}
                className="px-5 py-2 bg-[#ED1C24] hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Xem & Xuất File PDF A4</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * OUTPUT PDF PREVIEW & PRINT ENGINE (Conforming strictly to XII. THIẾT KẾ FILE PDF ĐẦU RA)
       * ========================================================================= */}
      {previewMode && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="no-print p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm font-bold">
                Chế độ xem trước tài liệu PDF chuẩn A4 (Trang in chính thức)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(false)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Quay lại chỉnh sửa
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-[#ED1C24] hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In trang này (A4)</span>
              </button>
            </div>
          </div>

          {/* The Printable A4 Container */}
          <div className="print-container bg-white text-black p-8 sm:p-12 max-w-4xl mx-auto rounded-2xl shadow-xl border border-slate-200">
            {/* 1. Phần đầu PDF */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold tracking-wider text-slate-800 uppercase">
                    VIETINBANK
                  </div>
                  <div className="text-xs font-semibold text-slate-600 uppercase">
                    NGÂN HÀNG TMCP CÔNG THƯƠNG VIỆT NAM
                  </div>
                  <div className="text-xs font-bold text-[#003B70] uppercase">
                    CHI NHÁNH KIÊN GIANG
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono">
                  <div>Biểu mẫu: BM-CKL-01/VTB</div>
                  <div>Ngày xuất: {createdDate}</div>
                </div>
              </div>

              <div className="text-center mt-6">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#003B70] uppercase leading-snug">
                  DANH MỤC HỒ SƠ KHÁCH HÀNG CẦN CUNG CẤP
                </h1>
                <div className="text-xs font-bold tracking-wider uppercase text-[#ED1C24] mt-0.5">
                  PHỤC VỤ NHU CẦU VAY VỐN
                </div>
              </div>
            </div>

            {/* 2. Thông tin khách hàng */}
            <div className="bg-slate-50 border border-slate-300 p-4 rounded-lg mb-6 text-xs text-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Khách hàng: </span>
                  <strong className="text-slate-900 font-bold uppercase">
                    {salutation} {customerName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Loại khách hàng: </span>
                  <strong className="text-slate-900 font-semibold">
                    {customerType === 'personal' ? 'Khách hàng cá nhân' : 'Khách hàng doanh nghiệp'}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Mục đích vay vốn: </span>
                  <strong className="text-slate-900 font-semibold">{purposeDisplayString}</strong>
                </div>
                {customerType === 'corporate' && (
                  <div>
                    <span className="text-slate-500">Loại hình DN: </span>
                    <strong className="text-slate-900 font-semibold">{corporateType}</strong>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Số điện thoại: </span>
                  <span>{phone || 'Chưa cung cấp'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Người đồng vay/liên quan: </span>
                  <span>{coBorrower || 'Không có'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-200">
                <div>
                  <span className="text-slate-500">Ngày lập danh mục: </span>
                  <span className="font-semibold">{createdDate}</span>
                </div>
                <div>
                  <span className="text-slate-500">Nhân viên tín dụng phụ trách: </span>
                  <span className="font-bold text-[#003B70]">{officer || bankInfo.advisorName}</span>
                </div>
              </div>
            </div>

            {/* 3. Bảng danh mục hồ sơ (Chỉ hiện các giấy tờ được nhân viên tích chọn!) */}
            <div className="space-y-6">
              {groups.map((grp) => {
                const selectedItems = grp.items.filter((it) => it.selected);
                if (selectedItems.length === 0) return null;

                return (
                  <div key={grp.groupId} className="space-y-2">
                    {/* Header Nhóm */}
                    <div className="bg-blue-100 text-[#003B70] px-3 py-1.5 rounded font-extrabold text-xs uppercase tracking-wide border-l-4 border-[#003B70]">
                      {grp.groupTitle}
                    </div>

                    <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                      <thead className="bg-[#003B70] text-white uppercase text-[10px] font-bold">
                        <tr>
                          <th className="py-2 px-2 text-center border border-blue-900 w-10">STT</th>
                          <th className="py-2 px-3 border border-blue-900">Danh mục hồ sơ</th>
                          <th className="py-2 px-2 text-center border border-blue-900 w-20">Bản copy</th>
                          <th className="py-2 px-2 text-center border border-blue-900 w-20">Bản chính</th>
                          <th className="py-2 px-2 text-center border border-blue-900 w-20">Hình ảnh</th>
                          <th className="py-2 px-3 border border-blue-900 w-44">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {selectedItems.map((doc, idx) => (
                          <tr key={doc.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="py-1.5 px-2 text-center border border-slate-300 font-semibold">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-3 border border-slate-300 font-medium text-slate-900">
                              {doc.name}
                            </td>
                            <td className="py-1.5 px-2 text-center border border-slate-300">
                              {doc.copy ? '☑' : '☐'}
                            </td>
                            <td className="py-1.5 px-2 text-center border border-slate-300">
                              {doc.original ? '☑' : '☐'}
                            </td>
                            <td className="py-1.5 px-2 text-center border border-slate-300">
                              {doc.image ? '☑' : '☐'}
                            </td>
                            <td className="py-1.5 px-3 border border-slate-300 text-slate-600 text-[11px]">
                              {doc.note || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {totalSelectedDocs === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  Chưa có giấy tờ nào được tích chọn trong danh mục.
                </div>
              )}
            </div>

            {/* 4. Phần ghi chú cuối PDF - BẮT BUỘC THEO QUY ĐỊNH */}
            <div className="mt-8 pt-4 border-t border-slate-300">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 leading-relaxed italic">
                “{checklistData.disclaimer}”
              </div>
            </div>

            {/* Chân trang số trang */}
            <div className="mt-6 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200 pt-2 font-mono">
              <span>Tên tệp: {pdfFileName}</span>
              <span>VietinBank Kiên Giang • Hotline: 0919131021</span>
              <span>Trang 1/1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
