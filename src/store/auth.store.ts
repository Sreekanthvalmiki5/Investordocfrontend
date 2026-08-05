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
  /** Verify the email using the token from the emailed link. */
  verifyEmail: (token: string) => Promise<void>;
  /** Resend the verification email for the current (or given) email address. */
  resendVerification: (email?: string) => Promise<void>;
  /** Persist a session obtained from the Google redirect callback. */
  completeRedirectSession: (token: string) => Promise<void>;
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

  verifyEmail: async (token) => {
    set({ loading: true, error: null });
    try {
      await authService.verifyEmail(token);
      set((state) => ({
        loading: false,
        user: state.user ? { ...state.user, emailVerified: true } : state.user,
      }));
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  resendVerification: async (email) => {
    set({ loading: true, error: null });
    try {
      const target = email ?? useAuthStore.getState().user?.email;
      if (!target) throw new Error('No email address to verify');
      await authService.resendVerification(target);
      set({ loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  completeRedirectSession: async (token) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.fetchCurrentUser(token);
      set({ user, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },

  clearError: () => set({ error: null }),
}));
