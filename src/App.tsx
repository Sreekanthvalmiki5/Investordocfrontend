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
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// Auth is initialized imperatively at app start (see App component below).
// Guards read from getState() which is always synchronous and never stale.
const requireAuth = () => {
  if (!useAuthStore.getState().user) throw redirect({ to: '/' });
};

const guestOnly = () => {
  if (useAuthStore.getState().user) throw redirect({ to: '/dashboard' });
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
    useAuthStore.getState().init().then(() => {
      setAuthReady(true);
    });
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
    </QueryClientProvider>
  );
}

export default App;
