import { useRouterState, Link } from '@tanstack/react-router';
import { Menu, Search, Bell, X } from 'lucide-react';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { CompanySelector } from '@/components/chat/CompanySelector';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUIStore } from '@/store/ui.store';
import { useChatStore } from '@/store/chat.store';
import { useDocumentStore } from '@/store/document.store';
import { useCompanyStore } from '@/store/company.store';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { AppUser } from '@/types';

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const mobileOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const user = useAuthStore((s) => s.user);

  // Re-initialise data stores whenever the authenticated user changes.
  // This ensures conversations/documents/companies are fetched after login
  // and stale data from a previous session is replaced.
  useEffect(() => {
    if (!user) return;
    // Reset stores from the previous session
    useChatStore.getState().reset();
    // Re-fetch from the backend
    useChatStore.getState().init();
    useDocumentStore.getState().init();
    useCompanyStore.getState().init();
  }, [user?.id]);

  const path = useRouterState({ select: (s) => s.location.pathname });
  const isChatRoute = path === '/dashboard' || path.startsWith('/chat');
  const initials = (user?.fullName ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-[280px] h-full bg-sidebar border-r border-sidebar-border animate-fade-in-up">
            <Sidebar />
          </div>
          <button
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="size-5 text-white absolute top-4 right-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Topbar isChatRoute={isChatRoute} onMenu={() => setMobileSidebarOpen(true)} initials={initials} user={user} />
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function Topbar({
  onMenu,
  initials,
  isChatRoute,
  user,
}: {
  onMenu: () => void;
  initials: string;
  isChatRoute: boolean;
  user: AppUser | null;
}) {
  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center gap-3 px-3 md:px-4 shrink-0 z-20">
      <button
        onClick={onMenu}
        className="md:hidden size-9 grid place-items-center rounded-md hover:bg-secondary transition"
        aria-label="Open sidebar"
      >
        <Menu className="size-4.5" />
      </button>

      <Link to="/dashboard" className="md:hidden">
        <BrandLogo collapsed />
      </Link>

      <div className="hidden md:flex items-center gap-2">
        <span className="text-sm font-medium text-foreground/90">InvestorDocs AI</span>
        {user?.role === 'admin' && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
            ADMIN
          </Badge>
        )}
      </div>

      {isChatRoute && (
        <div className="flex items-center gap-2 ml-1">
          <span className="text-xs text-muted-foreground hidden sm:inline">Company:</span>
          <CompanySelector />
        </div>
      )}

      <div className="flex-1" />

      <button
        className="hidden md:flex items-center gap-2 h-9 px-3 rounded-md bg-secondary/50 text-muted-foreground hover:bg-secondary transition text-sm w-56"
        aria-label="Search"
      >
        <Search className="size-4" />
        <span className="text-xs">Search docs, companies…</span>
        <kbd className="ml-auto text-[10px] bg-background px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
      </button>

      {isChatRoute && (
        <div className="hidden sm:flex">
          <ModelSelector />
        </div>
      )}

      <button className="size-9 grid place-items-center rounded-md hover:bg-secondary transition text-muted-foreground relative" aria-label="Notifications">
        <Bell className="size-4.5" />
        <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
      </button>

      <Link to="/profile">
        <Avatar className={cn('size-8 border border-border hover:opacity-90 transition')}>
          <AvatarFallback className="bg-secondary text-[11px] font-medium">{initials}</AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
