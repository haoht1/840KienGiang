export interface StepItem {
  step: number;
  text: string;
  image?: string;
}

export interface FaqItem {
  id: string;
  title: string;
  summary: string;
  type: 'steps' | 'video_direct';
  videoUrl?: string;
  embedVideoUrl?: string;
  description?: string;
  steps?: StepItem[];
}

export interface ProductItem {
  id: string;
  category: 'personal' | 'hkd' | 'corporate' | 'promotions' | 'auction';
  title: string;
  badge?: string;
  imageUrl: string;
  description: string;
}

export interface BranchItem {
  id: number;
  name: string;
  address: string;
  mapsUrl: string;
  hours: string;
  imageUrl: string;
  phone: string;
}

export interface ChecklistDocItem {
  id: string;
  name: string;
  selected: boolean;
  copy: boolean;
  original: boolean;
  image: boolean;
  note: string;
  isCustom?: boolean;
}

export interface ChecklistGroup {
  groupId: string;
  groupTitle: string;
  items: ChecklistDocItem[];
}

export interface SavedChecklist {
  id: string;
  customerName: string;
  salutation: string;
  phone: string;
  coBorrower: string;
  officer: string;
  createdDate: string;
  generalNote: string;
  customerType: 'personal' | 'corporate';
  corporateType?: string;
  selectedPurposes: string[];
  groups: ChecklistGroup[];
  updatedAt: string;
}
