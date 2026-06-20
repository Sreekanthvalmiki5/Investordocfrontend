import { create } from 'zustand';
import type { Company, Sector } from '@/types';
import { companyService } from '@/services/api';

interface CompanyFilters {
  query: string;
  sector: Sector | 'all';
  marketCapMin: number;
}

interface CompanyState extends CompanyFilters {
  companies: Company[];
  loading: boolean;
  setFilter: <K extends keyof CompanyFilters>(key: K, value: CompanyFilters[K]) => void;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  query: '',
  sector: 'all',
  marketCapMin: 0,
  companies: [],
  loading: false,
  setFilter: (key, value) => {
    set({ [key]: value } as Partial<CompanyState>);
    get().refresh();
  },
  init: async () => {
    await get().refresh();
  },
  refresh: async () => {
    const { query, sector } = get();
    set({ loading: true });
    const companies = await companyService.searchCompanies(query, sector);
    set({ companies, loading: false });
  },
}));
