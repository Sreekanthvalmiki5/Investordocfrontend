import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  RouterProvider,
} from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

import { AppLayout } from '@/layouts/AppLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';
import { ForgotPasswordPage } from '@/pages/ForgotPassword';
import { DashboardPage } from '@/pages/Dashboard';
import { ChatPage } from '@/pages/Chat';
import { DocumentsPage } from '@/pages/Documents';
import { PdfViewerPage } from '@/pages/PdfViewer';
import { CompaniesPage } from '@/pages/Companies';
import { CompanyDetailPage } from '@/pages/CompanyDetail';
import { BookmarksPage } from '@/pages/Bookmarks';
import { SettingsPage } from '@/pages/Settings';
import { ProfilePage } from '@/pages/Profile';
import { NotFoundPage } from '@/pages/NotFound';
import { AccessDeniedPage } from '@/pages/AccessDenied';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboard';
import { AdminUploadPage } from '@/pages/admin/AdminUpload';
import { AdminDocumentsPage } from '@/pages/admin/AdminDocuments';
import { AdminCompaniesPage } from '@/pages/admin/AdminCompanies';
import { AdminUsersPage } from '@/pages/admin/AdminUsers';
import { AdminEmbeddingsPage } from '@/pages/admin/AdminEmbeddings';
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalytics';
import { AdminSettingsPage } from '@/pages/admin/AdminSettings';
import type { ReactNode } from 'react';
import { ResetPasswordPage } from '@/pages/ResetPassword';
import { VerifyEmailPage } from '@/pages/VerifyEmail';
import { GoogleCallbackPage } from '@/pages/GoogleCallback';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// Auth is initialized imperatively at app start (see App component below).
// Guards read from getState() which is always synchronous and never stale.
const requireAuth = () => {
  if (!useAuthStore.getState().user) throw redirect({ to: '/' });
};

// Admin-only guard - checks user role
const requireAdmin = () => {
  const user = useAuthStore.getState().user;
  // console.log(user);
  if (!user) throw redirect({ to: '/' });
  if (user.role !== 'admin') throw redirect({ to: '/access-denied' });
};

const guestOnly = () => {
  const user = useAuthStore.getState().user;
  // console.log(user);
  if (user) {
    if (user.role === 'admin') {
      throw redirect({ to: '/admin' });
    } else {
      throw redirect({ to: '/dashboard' });
    }
  }
};

function guard(Page: () => ReactNode) {
  return function Guarded() {
    return (
      <AppLayout>
        <Page />
      </AppLayout>
    );
  };
}

// Root component just renders children — no hooks, no side effects
const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: guestOnly,
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  beforeLoad: guestOnly,
  component: SignupPage,
});

const forgotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forgot-password',
  beforeLoad: guestOnly,
  component: ForgotPasswordPage,
});
const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  beforeLoad: guestOnly,
  component: ResetPasswordPage,
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/verify-email',
  beforeLoad: guestOnly,
  component: VerifyEmailPage,
});

const googleCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/google-callback',
  component: GoogleCallbackPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: requireAuth,
  component: guard(DashboardPage),
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/$chatId',
  beforeLoad: requireAuth,
  component: guard(ChatPage),
});

const documentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documents',
  beforeLoad: requireAuth,
  component: guard(DocumentsPage),
});

const pdfRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documents/$documentId',
  beforeLoad: requireAuth,
  component: guard(PdfViewerPage),
});

const companiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/companies',
  beforeLoad: requireAuth,
  component: guard(CompaniesPage),
});

const companyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/company/$companyId',
  beforeLoad: requireAuth,
  component: guard(CompanyDetailPage),
});

const bookmarksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bookmarks',
  beforeLoad: requireAuth,
  component: guard(BookmarksPage),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: requireAuth,
  component: guard(SettingsPage),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireAuth,
  component: guard(ProfilePage),
});

const accessDeniedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/access-denied',
  component: AccessDeniedPage,
});

// Admin routes with protection
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  beforeLoad: requireAdmin,
  component: AdminLayout,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: AdminDashboardPage,
});

const adminUploadRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/upload',
  component: AdminUploadPage,
});

const adminDocumentsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/documents',
  component: AdminDocumentsPage,
});

const adminCompaniesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/companies',
  component: AdminCompaniesPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/users',
  component: AdminUsersPage,
});

const adminEmbeddingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/embeddings',
  component: AdminEmbeddingsPage,
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/analytics',
  component: AdminAnalyticsPage,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/settings',
  component: AdminSettingsPage,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFoundPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  signupRoute,
  forgotRoute,
  dashboardRoute,
  chatRoute,
  documentsRoute,
  pdfRoute,
  companiesRoute,
  companyRoute,
  bookmarksRoute,
  settingsRoute,
  profileRoute,
  accessDeniedRoute,
    resetPasswordRoute,
    verifyEmailRoute,
    googleCallbackRoute,
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminUploadRoute,
    adminDocumentsRoute,
    adminCompaniesRoute,
    adminUsersRoute,
    adminEmbeddingsRoute,
    adminAnalyticsRoute,
    adminSettingsRoute,
  ]),
  notFoundRoute,
]);

const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  // Block render until auth state is hydrated from localStorage.
  // This prevents guards from firing before we know if a session exists.
  const [authReady, setAuthReady] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // init() reads localStorage synchronously via JSON.parse and sets store
    // No .then() needed: init() is sync (async marker only for interface compatibility)
    useAuthStore.getState().init();
    setAuthReady(true);
  }, []);

  if (!authReady) {
    return (
      <div className="h-screen w-full grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/20 grid place-items-center animate-pulse">
            <span className="size-5 rounded bg-primary/60" />
          </div>
          <p className="text-xs text-muted-foreground">Loading InvestorDocs AI…</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
