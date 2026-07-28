import { useCallback } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  FileText,
  Download,
  Eye,
  Star,
  Calendar,
  Building2,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDocumentStore } from '@/store/document.store';
import { useCompanyStore } from '@/store/company.store';
import { documentService } from '@/services/api';
import { cn } from '@/lib/utils';
import type { DocumentItem, DocumentType } from '@/types';

const DOC_TYPES: { value: DocumentType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'annual_report', label: 'Annual Report' },
  { value: 'quarterly_report', label: 'Quarterly Report' },
  { value: 'investor_presentation', label: 'Investor Presentation' },
  { value: 'earnings_call', label: 'Earnings Call' },
  { value: 'prospectus', label: 'Prospectus' },
  { value: 'filing', label: 'Filing' },
];

const YEARS = [2025, 2024, 2023];

export function DocumentsPage() {
  const {
    documents,
    loading,
    query,
    companyId,
    type,
    year,
    view,
    setFilter,
  } = useDocumentStore();
  const companies = useCompanyStore((s) => s.companies);

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 min-h-0 scrollbar-thin">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          <PageHeader
            title="Documents Library"
            description="Search and filter across earnings reports, filings, and investor presentations."
          />

          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 mt-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search documents…"
                value={query}
                onChange={(e) => setFilter('query', e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="grid grid-cols-3 md:flex gap-2">
              <Select value={companyId} onValueChange={(v) => setFilter('companyId', v)}>
                <SelectTrigger className="h-10 w-full md:w-44"><SelectValue placeholder="Company" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={type} onValueChange={(v) => setFilter('type', v as DocumentType | 'all')}>
                <SelectTrigger className="h-10 w-full md:w-44"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(year)} onValueChange={(v) => setFilter('year', v === 'all' ? 'all' : Number(v))}>
                <SelectTrigger className="h-10 w-full md:w-32"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden md:flex items-center rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setFilter('view', 'grid')}
                className={cn('p-2 transition', view === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60')}
                aria-label="Grid view"
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setFilter('view', 'list')}
                className={cn('p-2 transition', view === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60')}
                aria-label="List view"
              >
                <List className="size-4" />
              </button>
            </div>
          </div>

          <div className="md:hidden flex gap-2 mt-2">
            <Button variant={view === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('view', 'grid')}><LayoutGrid className="size-3.5" /></Button>
            <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('view', 'list')}><List className="size-3.5" /></Button>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">{documents.length} document(s)</div>

          {/* Content */}
          {loading ? (
            <div className={cn('grid gap-3 mt-4', view === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-6" />}
              title="No documents found"
              description="Try adjusting your filters or search query."
            />
          ) : view === 'grid' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {documents.map((d) => <DocumentCard key={d.id} doc={d} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              {documents.map((d) => <DocumentRow key={d.id} doc={d} />)}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function DocumentTypeLabel({ type }: { type: DocumentType }) {
  const map: Record<DocumentType, { label: string; cls: string }> = {
    annual_report: { label: 'Annual', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    quarterly_report: { label: 'Quarterly', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    investor_presentation: { label: 'Presentation', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    earnings_call: { label: 'Earnings Call', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
    press_release: { label: 'Press Release', cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
    prospectus: { label: 'Prospectus', cls: 'bg-pink-500/15 text-pink-400 border-pink-500/20' },
    filing: { label: 'Filing', cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
  };
  const meta = map[type];
  return <Badge variant="outline" className={cn('text-[10px] font-medium border', meta.cls)}>{meta.label}</Badge>;
}

function DocumentCard({ doc }: { doc: DocumentItem }) {
  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await documentService.download(doc.id);
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  }, [doc.id]);

  return (
    <div className="group p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
          <FileText className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground leading-snug line-clamp-2">{doc.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Building2 className="size-3" /> {doc.companyName}
          </p>
        </div>
        {doc.starred && <Star className="size-3.5 text-amber-400 fill-amber-400 shrink-0" />}
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <DocumentTypeLabel type={doc.type} />
        {doc.quarter && <Badge variant="secondary" className="text-[10px]">{doc.quarter}</Badge>}
        <Badge variant="secondary" className="text-[10px]">FY{doc.year % 100 + 2000}</Badge>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2">
        <Calendar className="size-3" /> {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        <span className="mx-1">·</span>
        {doc.pageCount} pages
        <span className="mx-1">·</span>
        {doc.sizeMb} MB
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <Button asChild size="sm" className="h-8 flex-1 gap-1.5">
          <Link to="/documents/$documentId" params={{ documentId: doc.id }}><Eye className="size-3.5" /> View</Link>
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" title="Download" onClick={handleDownload}>
          <Download className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function DocumentRow({ doc }: { doc: DocumentItem }) {
  const handleDownload = useCallback(async () => {
    const result = await documentService.download(doc.id);
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  }, [doc.id]);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition group">
      <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
        <FileText className="size-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-foreground truncate">{doc.name}</h3>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
          <span className="flex items-center gap-1"><Building2 className="size-3" /> {doc.companyName}</span>
          {doc.quarter && <Badge variant="secondary" className="text-[9px] h-4">{doc.quarter}</Badge>}
          <span>· FY{doc.year}</span>
          <span>· {doc.pageCount}p</span>
        </div>
      </div>
      <DocumentTypeLabel type={doc.type} />
      <div className="hidden sm:block text-[11px] text-muted-foreground w-24 text-right">
        {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </div>
      <div className="flex items-center gap-1.5">
        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
          <Link to="/documents/$documentId" params={{ documentId: doc.id }}><Eye className="size-3.5" /> Open</Link>
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" title="Download" onClick={handleDownload}>
          <Download className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
