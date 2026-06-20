import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Bookmark as BookmarkIcon, FileText, Building2, MessageSquare, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bookmarkService } from '@/services/api';
import type { Bookmark } from '@/types';

export function BookmarksPage() {
  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkService.list,
  });

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 min-h-0 scrollbar-thin">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          <PageHeader title="Bookmarks" description="Saved messages, documents, and companies for quick access." />
          <div className="mt-4 text-xs text-muted-foreground">{bookmarks.length} bookmark(s)</div>

          {isLoading ? (
            <div className="space-y-2 mt-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : bookmarks.length === 0 ? (
            <EmptyState icon={<BookmarkIcon className="size-6" />} title="No bookmarks yet" description="Bookmark messages, documents, or companies to find them here." />
          ) : (
            <div className="space-y-2 mt-4">
              {bookmarks.map((b) => <BookmarkRow key={b.id} bookmark={b} />)}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function BookmarkRow({ bookmark }: { bookmark: Bookmark }) {
  const { kind, title, subtitle, refId } = bookmark;
  const Icon = kind === 'document' ? FileText : kind === 'company' ? Building2 : MessageSquare;
  return (
    <div className="group flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition">
      <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0"><Icon className="size-4" /></div>
      <div className="flex-1 min-w-0">
        {kind === 'document' && (
          <Link to="/documents/$documentId" params={{ documentId: refId }} className="block">
            <p className="text-sm font-medium text-foreground truncate">{title}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
          </Link>
        )}
        {kind === 'company' && (
          <Link to="/company/$companyId" params={{ companyId: refId }} className="block">
            <p className="text-sm font-medium text-foreground truncate">{title}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
          </Link>
        )}
        {kind === 'message' && (
          <Link to="/chat/$chatId" params={{ chatId: refId }} className="block">
            <p className="text-sm font-medium text-foreground truncate">{title}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
          </Link>
        )}
      </div>
      <Badge variant="secondary" className="text-[9px] capitalize">{kind}</Badge>
      <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
