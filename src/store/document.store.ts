import { create } from 'zustand';
import type { DocumentItem, DocumentType } from '@/types';
import { documentService } from '@/services/api';

interface DocumentFilters {
  query: string;
  companyId: string | 'all';
  type: DocumentType | 'all';
  year: number | 'all';
  quarter: string | 'all';
  view: 'grid' | 'list';
}

interface DocumentState extends DocumentFilters {
  documents: DocumentItem[];
  loading: boolean;
  error: string | null;
  setFilter: <K extends keyof DocumentFilters>(key: K, value: DocumentFilters[K]) => void;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  query: '',
  companyId: 'all',
  type: 'all',
  year: 'all',
  quarter: 'all',
  view: 'grid',
  documents: [],
  loading: false,
  error: null,
  setFilter: (key, value) => {
    set({ [key]: value } as Partial<DocumentState>);
    get().refresh();
  },
  init: async () => {
    await get().refresh();
  },
  refresh: async () => {
    const { query, companyId, type, year, quarter } = get();
    set({ loading: true, error: null });
    try {
      const documents = await documentService.filter({ query, companyId, type, year, quarter });
      set({ documents, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
}));
