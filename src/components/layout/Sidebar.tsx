import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  MessageSquare,
  FileText,
  Building2,
  Bookmark,
  Settings,
  Search,
  Pin,
  Archive,
  Trash2,
  MoreHorizontal,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, UserCircle, Shield } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Admin Dashboard', icon: Shield },
];

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeConversationId);
  const newConversation = useChatStore((s) => s.newConversation);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const recent = conversations
    .filter((c) => !c.archived)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || +new Date(b.updatedAt) - +new Date(a.updatedAt));

  return (
    <aside
      className={cn(
        'h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-[280px]'
      )}
    >
      {/* Header */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-sidebar-border shrink-0">
        {collapsed ? <BrandLogo collapsed /> : <BrandLogo />}
        <button
          onClick={toggleSidebar}
          className="size-7 grid place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors hidden md:grid"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      {/* New chat */}
      <div className="p-2 pb-1">
        <button
          onClick={async () => {
            const id = await newConversation();
            navigate({ to: '/chat/$chatId', params: { chatId: id } });
          }}
          className={cn(
            'flex items-center gap-2.5 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm shadow-primary/20',
            collapsed ? 'justify-center py-2.5' : 'px-3 py-2.5'
          )}
        >
          <Plus className="size-4" />
          {!collapsed && <span>New chat</span>}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground">
            <Search className="size-3.5" />
            <input
              placeholder="Search conversations"
              className="bg-transparent flex-1 outline-none placeholder:text-muted-foreground/70 text-foreground"
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-2">
        <SectionLabel collapsed={collapsed}>Recent</SectionLabel>
        <div className="space-y-0.5 mt-1">
          {recent.length === 0 && !collapsed && (
            <p className="text-xs text-muted-foreground/70 px-2 py-4 text-center">No conversations yet.</p>
          )}
          {recent.map((c) => (
            <ConversationRow key={c.id} id={c.id} title={c.title} active={c.id === activeId} pinned={c.pinned} collapsed={collapsed} />
          ))}
        </div>

        <SectionLabel collapsed={collapsed} className="mt-5">Library</SectionLabel>
        <div className="space-y-0.5 mt-1">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.to} {...item} collapsed={collapsed} />
          ))}
        </div>

        {user?.role === 'admin' && (
          <>
            <SectionLabel collapsed={collapsed} className="mt-5">Admin</SectionLabel>
            <div className="space-y-0.5 mt-1">
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.to} {...item} collapsed={collapsed} />
              ))}
            </div>
          </>
        )}

        {!collapsed && (
          <div className="mt-5 p-3 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="size-4 text-primary" />
              <p className="text-xs font-medium text-foreground">Upgrade to Enterprise</p>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
              Unlimited documents, custom models, and team workspaces.
            </p>
            <button className="text-[11px] font-medium text-primary hover:underline">Learn more →</button>
          </div>
        )}
      </ScrollArea>

      <SidebarUserFooter collapsed={collapsed} />
    </aside>
  );
}

function SectionLabel({ children, collapsed, className }: { children: React.ReactNode; collapsed?: boolean; className?: string }) {
  if (collapsed) return <div className={cn('h-px bg-sidebar-border my-2 mx-2', className)} />;
  return (
    <p className={cn('px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60', className)}>
      {children}
    </p>
  );
}

function NavLink({ to, label, icon: Icon, collapsed }: NavItem & { collapsed?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to || path.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-sm transition-colors',
        collapsed ? 'justify-center py-2 px-2' : 'px-2.5 py-2',
        active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function ConversationRow({
  id,
  title,
  active,
  pinned,
  collapsed,
}: {
  id: string;
  title: string;
  active: boolean;
  pinned?: boolean;
  collapsed?: boolean;
}) {
  const rename = useChatStore((s) => s.renameConversation);
  const del = useChatStore((s) => s.deleteConversation);
  const pin = useChatStore((s) => s.pinConversation);
  const archive = useChatStore((s) => s.archiveConversation);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  if (collapsed) {
    return (
      <Link
        to="/chat/$chatId"
        params={{ chatId: id }}
        className={cn(
          'flex justify-center py-2 rounded-md',
          active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
        )}
        title={title}
      >
        <MessageSquare className="size-4" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-1 rounded-md pr-1 transition-colors',
        active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
      )}
    >
      {pinned && <Pin className="size-3 ml-2 text-primary shrink-0" />}
      {!pinned && <MessageSquare className="size-3.5 ml-2 shrink-0 opacity-70" />}
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            rename(id, draft || title);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              rename(id, draft || title);
              setEditing(false);
            }
            if (e.key === 'Escape') {
              setDraft(title);
              setEditing(false);
            }
          }}
          className="flex-1 bg-transparent outline-none text-sm py-2 min-w-0"
        />
      ) : (
        <Link
          to="/chat/$chatId"
          params={{ chatId: id }}
          className="flex-1 text-sm py-2 truncate"
        >
          {title}
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="opacity-0 group-hover:opacity-100 size-6 grid place-items-center rounded hover:bg-background/60 transition"
            aria-label="Conversation actions"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => { setDraft(title); setEditing(true); }}>
            <span className="flex items-center gap-2"><ChevronRight className="size-3.5" /> Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => pin(id)}>
            <span className="flex items-center gap-2"><Pin className="size-3.5" /> {pinned ? 'Unpin' : 'Pin'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => archive(id)}>
            <span className="flex items-center gap-2"><Archive className="size-3.5" /> Archive</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => del(id)} className="text-destructive focus:text-destructive">
            <span className="flex items-center gap-2"><Trash2 className="size-3.5" /> Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SidebarUserFooter({ collapsed }: { collapsed?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const initials = (user?.fullName ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="border-t border-sidebar-border p-2">
      {collapsed ? (
        <Link to="/profile" className="grid place-items-center py-1.5">
          <Avatar className="size-8 border border-border">
            <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 p-1.5 rounded-md hover:bg-secondary/60 transition-colors">
              <Avatar className="size-8 border border-border shrink-0">
                <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.fullName ?? 'Investor'}</p>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="h-4 px-1 text-[9px] uppercase tracking-wide bg-primary/15 text-primary border-primary/20">
                    {user?.plan ?? 'pro'}
                  </Badge>
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52 mb-2">
            <DropdownMenuLabel className="truncate">{user?.email ?? 'user@investordocs.ai'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile"><span className="flex items-center gap-2"><UserCircle className="size-4" /> Profile</span></Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings"><span className="flex items-center gap-2"><Settings className="size-4" /> Settings</span></Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user?.role === 'admin' && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/admin"><span className="flex items-center gap-2"><Shield className="size-4" /> Admin Dashboard</span></Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
              <span className="flex items-center gap-2"><LogOut className="size-4" /> Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
