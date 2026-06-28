import { create } from 'zustand';
import type { AdminUser, AdminDocument, AdminCompany, UploadProgress, ReportType } from '@/types';
import { ADMIN_USERS, ADMIN_DOCUMENTS, COMPANIES } from '@/services/mockData';

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
  init: () => void;
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

  init: () => {
    const companies: AdminCompany[] = COMPANIES.map((c) => ({
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

    set({
      users: ADMIN_USERS,
      documents: ADMIN_DOCUMENTS,
      companies,
      stats: {
        totalDocuments: ADMIN_DOCUMENTS.length,
        totalCompanies: companies.length,
        totalUsers: ADMIN_USERS.length,
        processedToday: 12,
        embeddingQueue: 3,
        storageUsedGb: 156.8,
      },
    });
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

  updateUser: (id, updates) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    }));
  },

  deleteUser: (id) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
      stats: { ...state.stats, totalUsers: state.stats.totalUsers - 1 },
    }));
  },

  addCompany: (company) => {
    const newCompany: AdminCompany = {
      ...company,
      id: `c-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      companies: [...state.companies, newCompany],
      stats: { ...state.stats, totalCompanies: state.stats.totalCompanies + 1 },
    }));
  },

  updateCompany: (id, updates) => {
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }));
  },

  deleteCompany: (id) => {
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== id),
      stats: { ...state.stats, totalCompanies: state.stats.totalCompanies - 1 },
    }));
  },
}));
