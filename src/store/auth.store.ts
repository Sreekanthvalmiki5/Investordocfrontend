import { create } from 'zustand';
import type { AppUser } from '@/types';
import { authService } from '@/services/api';

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  init: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<AppUser>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  // Reads localStorage synchronously so auth state is available immediately
  // before any route guards fire.
  init: async () => {
    const raw = localStorage.getItem('idf_user');
    const user = raw ? (JSON.parse(raw) as AppUser) : null;
    set({ user });
  },

  signInWithPassword: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.signInWithPassword(email, password);
      set({ user, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  signUpWithEmail: async (email, password, firstName, lastName) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.signUpWithEmail(email, password, firstName, lastName);
      set({ user, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const user = await authService.signInWithGoogle();
      set({ user, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null });
  },

  updateProfile: async (patch) => {
    const user = await authService.updateProfile(patch);
    set({ user });
  },

  clearError: () => set({ error: null }),
}));
