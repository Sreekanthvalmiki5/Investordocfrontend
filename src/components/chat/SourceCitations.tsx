import { Link } from '@tanstack/react-router';
import { FileText, ExternalLink } from 'lucide-react';
import type { SourceCitation as SourceCitationType } from '@/types';
import { useChatStore } from '@/store/chat.store';

export function SourceCitations({ sources }: { sources: SourceCitationType[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-2">Sources</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((s, i) => (
          <CitationChip key={s.id ?? i} source={s} index={i} />
        ))}
      </div>
    </div>
  );
}

function CitationChip({ source, index }: { source: SourceCitationType; index: number }) {
  const openCitation = useChatStore((s) => s.openCitation);
  return (
    <Link
      to="/documents/$documentId"
      params={{ documentId: source.documentId }}
      onClick={() => openCitation(source)}
      className="group flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary/70 hover:bg-secondary border border-border text-xs transition-colors max-w-[280px]"
    >
      <span className="size-5 rounded bg-primary/15 text-primary grid place-items-center text-[10px] font-semibold shrink-0">
        {index + 1}
      </span>
      <FileText className="size-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="truncate text-foreground/90 max-w-[220px]">{source.title}</p>
        <p className="text-[10px] text-muted-foreground">Page {source.page}</p>
      </div>
      <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0" />
    </Link>
  );
}
