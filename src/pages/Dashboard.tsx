import { Link, useNavigate } from '@tanstack/react-router';
import { FileText, BarChart3, ArrowUpRight, Sparkles, Building2, TrendingUp } from 'lucide-react';
import { ChatInput } from '@/components/chat/ChatInput';
import { DashboardGreeting } from '@/components/chat/DashboardGreeting';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';
import { COMPANIES, SUGGESTIONS } from '@/services/mockData';
import { useShallow } from 'zustand/react/shallow';
import type { Conversation } from '@/types';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const send = useChatStore((s) => s.sendMessage);
  // useShallow prevents re-render when the array contents haven't changed
  const recentConversations = useChatStore(
    useShallow((s) => s.conversations.slice(0, 4))
  );

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 min-h-0 scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <DashboardGreeting name={user?.firstName} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <QuickAction to="/documents" icon={<FileText className="size-4" />} label="Browse docs" />
            <QuickAction to="/companies" icon={<Building2 className="size-4" />} label="Companies" />
            <QuickAction to="/bookmarks" icon={<Sparkles className="size-4" />} label="Bookmarks" />
            <QuickAction to="/profile" icon={<TrendingUp className="size-4" />} label="Insights" />
          </div>

          <section className="mt-10">
            <h3 className="text-sm font-semibold text-foreground mb-3">Try asking</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => send(s.prompt, (newId) => navigate({ to: '/chat/$chatId', params: { chatId: newId } }))}
                  className="group text-left p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{s.prompt}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-muted-foreground">
                      {s.companyId ? COMPANIES.find((c) => c.id === s.companyId)?.name : 'Cross-company'}
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary transition" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          <RecentActivity recent={recentConversations} />
        </div>
      </ScrollArea>
      <div className="shrink-0">
        <ChatInput showSuggestions={false} />
      </div>
    </div>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-start gap-2 p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-card/80 transition group"
    >
      <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">{icon}</div>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Link>
  );
}

function RecentActivity({ recent }: { recent: Conversation[] }) {
  if (recent.length === 0) return null;
  return (
    <section className="mt-10">
      <h3 className="text-sm font-semibold text-foreground mb-3">Recent conversations</h3>
      <div className="space-y-1.5">
        {recent.map((c) => (
          <Link
            key={c.id}
            to="/chat/$chatId"
            params={{ chatId: c.id }}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition group"
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{c.title}</span>
            </div>
            <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary transition" />
          </Link>
        ))}
      </div>
    </section>
  );
}
