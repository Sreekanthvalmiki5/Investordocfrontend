import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Building2,
  Users,
  Brain,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  Shield,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useAuthStore } from '@/store/auth.store';
import { useAdminStore } from '@/store/admin.store';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/upload', label: 'Upload Reports', icon: Upload },
  { to: '/admin/documents', label: 'Manage Documents', icon: FileText, badge: 'New' },
  { to: '/admin/companies', label: 'Manage Companies', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/embeddings', label: 'Embeddings', icon: Brain, badge: '3' },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const init = useAdminStore((s) => s.init);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    init();
  }, [init]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <AdminHeader />
        <main className="flex-1 min-h-0 overflow-auto bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border shrink-0">
        <BrandLogo />
      </div>

      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/10 text-primary">
          <Shield className="size-4" />
          <span className="text-sm font-medium">Admin Panel</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-0.5">
          {ADMIN_NAV.map((item) => {
            const active = path === item.to || (item.to !== '/admin' && path.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2.5 rounded-md text-sm transition-colors px-3 py-2',
                  active
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/15 text-primary border-0">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border">
        <Link to="/dashboard">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <ChevronLeft className="size-4" />
            Back to App
          </Button>
        </Link>
      </div>
    </aside>
  );
}

function AdminHeader() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const initials = (user?.fullName ?? 'A')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center gap-3 px-4 shrink-0 z-20">
      <div className="flex items-center gap-2">
        <Shield className="size-5 text-primary" />
        <h1 className="text-sm font-semibold">Admin Dashboard</h1>
      </div>

      <div className="flex-1" />

      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
        Admin
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:opacity-80 transition">
            <Avatar className="size-8 border border-border">
              <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium">{user?.fullName ?? 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? 'admin@investordocs.ai'}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
            <span className="flex items-center gap-2">
              <LogOut className="size-4" /> Sign out
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
