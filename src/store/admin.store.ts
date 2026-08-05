import { create } from 'zustand';
import type { AdminUser, AdminDocument, AdminCompany, UploadProgress, ReportType } from '@/types';
import { ADMIN_DOCUMENTS, COMPANIES as MOCK_COMPANIES } from '@/services/mockData';
import { companyService, documentService, userService } from '@/services/api';

interface UploadTask {
  id: string;
  files: File[];
  companyId: string;
  reportType: ReportType;
  year: number;
  quarter?: string;
  progress: UploadProgress[];
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

interface AdminState {
  users: AdminUser[];
  documents: AdminDocument[];
  companies: AdminCompany[];
  uploadTasks: UploadTask[];
  stats: {
    totalDocuments: number;
    totalCompanies: number;
    totalUsers: number;
    processedToday: number;
    embeddingQueue: number;
    storageUsedGb: number;
  };
  loading: boolean;
  /** User list pagination & filters (server-side) */
  usersPage: number;
  usersLimit: number;
  usersTotal: number;
  loadingUsers: boolean;
  usersSearch: string;
  usersRoleFilter: string;
  usersPlanFilter: string;
  usersSortBy: string;
  usersSortOrder: string;
  init: () => void;
  loadUsers: () => Promise<void>;
  setUsersSearch: (search: string) => void;
  setUsersRoleFilter: (role: string) => void;
  setUsersPlanFilter: (plan: string) => void;
  setUsersPage: (page: number) => void;
  uploadDocuments: (task: Omit<UploadTask, 'id' | 'progress' | 'status'>) => string;
  updateUploadProgress: (taskId: string, progress: UploadProgress[]) => void;
  deleteDocument: (id: string) => void;
  rebuildEmbedding: (id: string) => void;
  addUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<AdminUser>) => void;
  deleteUser: (id: string) => void;
  addCompany: (company: Omit<AdminCompany, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCompany: (id: string, updates: Partial<AdminCompany>) => void;
  deleteCompany: (id: string) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  documents: [],
  companies: [],
  uploadTasks: [],
  stats: {
    totalDocuments: 0,
    totalCompanies: 0,
    totalUsers: 0,
    processedToday: 0,
    embeddingQueue: 0,
    storageUsedGb: 0,
  },
  loading: false,
  usersPage: 1,
  usersLimit: 20,
  usersTotal: 0,
  loadingUsers: false,
  usersSearch: '',
  usersRoleFilter: 'all',
  usersPlanFilter: 'all',
  usersSortBy: '',
  usersSortOrder: '',

  init: async () => {
    // Load companies from API with populated mock fallback
    let apiCompanies: AdminCompany[] = [];
    try {
      const fetched = await companyService.list();
      apiCompanies = fetched.map((c) => ({
        id: c.id,
        name: c.name,
        ticker: c.ticker,
        logoUrl: c.logoUrl,
        sector: c.sector,
        industry: c.industry,
        marketCapCr: c.marketCapCr,
        description: c.description,
        color: c.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentCount: c.totalReports,
      }));
    } catch {
      // Fallback: convert populated COMPANIES mock data to AdminCompany format
      apiCompanies = MOCK_COMPANIES.map((c) => ({
        id: c.id,
        name: c.name,
        ticker: c.ticker,
        sector: c.sector,
        industry: c.industry,
        marketCapCr: c.marketCapCr,
        description: c.description,
        color: c.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentCount: c.totalReports,
      }));
    }

    // Load documents from API with populated mock fallback
    let apiDocuments: AdminDocument[] = [];
    try {
      const result = await documentService.filter({});
      const docs = result.items;
      apiDocuments = docs.map((d) => ({
        id: d.id,
        name: d.name,
        companyId: d.companyId,
        companyName: d.companyName,
        type: d.type,
        quarter: d.quarter,
        year: d.year,
        pageCount: d.pageCount,
        sizeMb: d.sizeMb,
        fileUrl: d.fileUrl,
        sourceUrl: d.sourceUrl,
        status: 'processed' as const,
        embeddingStatus: 'completed' as const,
        uploadedAt: d.uploadedAt,
      }));
    } catch {
      // Use populated ADMIN_DOCUMENTS mock data as fallback
      apiDocuments = ADMIN_DOCUMENTS;
    }

    const totalDocs = apiDocuments.length;
    const totalCo = apiCompanies.length;

    set({
      documents: apiDocuments,
      companies: apiCompanies,
      stats: {
        totalDocuments: totalDocs,
        totalCompanies: totalCo,
        totalUsers: 0,
        processedToday: 12,
        embeddingQueue: apiDocuments.filter((d) => d.embeddingStatus === 'processing').length,
        storageUsedGb: 156.8,
      },
    });

    // Load users from API
    get().loadUsers();
  },

  loadUsers: async () => {
    const state = get();
    set({ loadingUsers: true });
    try {
      const result = await userService.listUsers({
        page: state.usersPage,
        limit: state.usersLimit,
        search: state.usersSearch,
        role: state.usersRoleFilter,
        plan: state.usersPlanFilter,
        sort_by: state.usersSortBy,
        sort_order: state.usersSortOrder,
      });
      set({
        users: result.items,
        usersTotal: result.total,
        stats: { ...get().stats, totalUsers: result.total },
      });
    } catch (error) {
      console.error('Failed to load users:', error);
      // Don't crash the page — keep existing users and show empty
      set({ users: [], usersTotal: 0 });
    } finally {
      set({ loadingUsers: false });
    }
  },

  setUsersSearch: (search) => {
    set({ usersSearch: search, usersPage: 1 });
    get().loadUsers();
  },

  setUsersRoleFilter: (role) => {
    set({ usersRoleFilter: role, usersPage: 1 });
    get().loadUsers();
  },

  setUsersPlanFilter: (plan) => {
    set({ usersPlanFilter: plan, usersPage: 1 });
    get().loadUsers();
  },

  setUsersPage: (page) => {
    set({ usersPage: page });
    get().loadUsers();
  },

  uploadDocuments: (task) => {
    const id = `upload-${Date.now()}`;
    const progress: UploadProgress[] = task.files.map((f) => ({
      fileId: `${id}-${f.name}`,
      fileName: f.name,
      progress: 0,
      status: 'pending',
    }));

    set((state) => ({
      uploadTasks: [...state.uploadTasks, { ...task, id, progress, status: 'uploading' }],
    }));

    // Simulate upload progress
    const interval = setInterval(() => {
      const task = get().uploadTasks.find((t) => t.id === id);
      if (!task || task.status === 'completed') {
        clearInterval(interval);
        return;
      }

      const newProgress = task.progress.map((p) => {
        const newProg = Math.min(p.progress + Math.random() * 20, 100);
        return {
          ...p,
          progress: newProg,
          status: newProg >= 100 ? 'completed' as const : 'uploading' as const,
        };
      });

      const allComplete = newProgress.every((p) => p.status === 'completed');

      set((state) => ({
        uploadTasks: state.uploadTasks.map((t) =>
          t.id === id ? { ...t, progress: newProgress, status: allComplete ? 'completed' as const : 'uploading' as const } : t
        ),
      }));

      if (allComplete) {
        clearInterval(interval);
      }
    }, 300);

    return id;
  },

  updateUploadProgress: (taskId, progress) => {
    set((state) => ({
      uploadTasks: state.uploadTasks.map((t) => (t.id === taskId ? { ...t, progress } : t)),
    }));
  },

  deleteDocument: (id) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      stats: {
        ...state.stats,
        totalDocuments: state.stats.totalDocuments - 1,
      },
    }));
  },

  rebuildEmbedding: (id) => {
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, embeddingStatus: 'processing' as const } : d
      ),
    }));
  },

  addUser: (user) => {
    const newUser: AdminUser = {
      ...user,
      id: `u-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      users: [...state.users, newUser],
      stats: { ...state.stats, totalUsers: state.stats.totalUsers + 1 },
    }));
  },

  updateUser: async (id, updates) => {
    // Optimistic local update
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    }));

    try {
      await userService.updateUser(id, updates);
    } catch (error) {
      console.error('Failed to update user via API:', error);
      // Re-fetch to restore correct state
      get().loadUsers();
      throw error;
    }
  },

  deleteUser: async (id) => {
    // Optimistic removal
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
      stats: { ...state.stats, totalUsers: Math.max(0, state.stats.totalUsers - 1) },
    }));

    try {
      await userService.deleteUser(id);
    } catch (error) {
      console.error('Failed to delete user via API:', error);
      // Re-fetch to restore correct state
      get().loadUsers();
      throw error;
    }
  },

  addCompany: async (company) => {
    const created = await companyService.create(company);
    const newCompany: AdminCompany = {
      id: created.id,
      name: created.name,
      ticker: created.ticker,
      logoUrl: created.logoUrl,
      sector: created.sector,
      industry: created.industry,
      marketCapCr: created.marketCapCr,
      description: created.description,
      color: created.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documentCount: created.totalReports,
    };
    set((state) => ({
      companies: [...state.companies, newCompany],
      stats: { ...state.stats, totalCompanies: state.stats.totalCompanies + 1 },
    }));
  },

  updateCompany: async (id, updates) => {
    // Optimistic local update
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }));

    try {
      await companyService.update(id, updates);
    } catch (error) {
      console.error('Failed to update company via API:', error);
      // Re-fetch companies to restore correct state
      const apiCompanies = await companyService.list();
      const companies: AdminCompany[] = apiCompanies.map((c) => ({
        id: c.id,
        name: c.name,
        ticker: c.ticker,
        logoUrl: c.logoUrl,
        sector: c.sector,
        industry: c.industry,
        marketCapCr: c.marketCapCr,
        description: c.description,
        color: c.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentCount: c.totalReports,
      }));
      set({ companies });
      // Re-throw so the UI can show an error toast
      throw error;
    }
  },

  deleteCompany: async (id) => {
    // Optimistic removal
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== id),
      stats: { ...state.stats, totalCompanies: state.stats.totalCompanies - 1 },
    }));

    try {
      await companyService.delete(id);
    } catch (error) {
      console.error('Failed to delete company via API:', error);
      // Re-fetch to restore correct state
      const apiCompanies = await companyService.list();
      const companies: AdminCompany[] = apiCompanies.map((c) => ({
        id: c.id,
        name: c.name,
        ticker: c.ticker,
        logoUrl: c.logoUrl,
        sector: c.sector,
        industry: c.industry,
        marketCapCr: c.marketCapCr,
        description: c.description,
        color: c.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentCount: c.totalReports,
      }));
      set({ companies });
      // Re-throw so the UI can show an error toast
      throw error;
    }
  },
}));
