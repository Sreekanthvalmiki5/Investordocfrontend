import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: Theme;
  notifications: {
    newReports: boolean;
    aiInsights: boolean;
    mentions: boolean;
  };
  defaultModel: string;
  defaultCompanyId: string;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setNotification: (key: keyof UIState['notifications'], value: boolean) => void;
  setDefaultModel: (model: string) => void;
  setDefaultCompany: (id: string) => void;
}

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: 'dark',
  notifications: { newReports: true, aiInsights: true, mentions: false },
  defaultModel: 'gpt-5',
  defaultCompanyId: 'tcs',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
  setNotification: (key, value) =>
    set((s) => ({ notifications: { ...s.notifications, [key]: value } })),
  setDefaultModel: (model) => set({ defaultModel: model }),
  setDefaultCompany: (id) => set({ defaultCompanyId: id }),
}));

// Apply default theme on import
if (prefersDark()) applyTheme('dark');
else applyTheme('dark');
