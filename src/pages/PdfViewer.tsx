import { useParams, Link } from '@tanstack/react-router';
import { useEffect, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  FileText,
  Layers,
  Download,
  Highlighter,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { documentService } from '@/services/api';
import { useChatStore } from '@/store/chat.store';
import type { DocumentItem } from '@/types';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfViewerPage() {
  const { documentId } = useParams({ from: '/documents/$documentId' });
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const pendingCitation = useChatStore((s) => s.pendingCitation);
  const clearPendingCitation = useChatStore((s) => s.clearPendingCitation);

  useEffect(() => {
    setLoading(true);
    documentService.get(documentId).then((d) => {
      setDoc(d ?? null);
      setLoading(false);
      const citedPage = pendingCitation?.documentId === documentId ? pendingCitation.page : 1;
      setPageNumber(Math.max(1, citedPage));
      clearPendingCitation();
    });
  }, [documentId, pendingCitation, clearPendingCitation]);

  const onDocLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const goPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goNext = () => setPageNumber((p) => Math.min(numPages || doc?.pageCount || 1, p + 1));

  if (loading) {
    return (
      <div className="h-full grid md:grid-cols-[1fr_320px]">
        <Skeleton className="m-4" />
        <Skeleton className="m-4" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="h-full grid place-items-center text-sm text-muted-foreground">
        Document not found.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:grid md:grid-cols-[1fr_320px]">
      {/* PDF area */}
      <div className="flex flex-col h-full min-h-0 border-r border-border">
        {/* Toolbar */}
        <div className="h-12 shrink-0 border-b border-border flex items-center gap-2 px-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to="/documents"><ArrowLeft className="size-4" /> Back</Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <p className="text-sm font-medium truncate flex-1">{doc.name}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={goPrev} disabled={pageNumber <= 1}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[70px] text-center">
              {pageNumber} / {numPages || doc.pageCount}
            </span>
            <Button variant="outline" size="icon" className="size-8" onClick={goNext} disabled={pageNumber >= (numPages || doc.pageCount)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 bg-[#1a1f2e] scrollbar-thin">
          <div className="flex justify-center py-6">
            <div className="relative">
              <Document file={doc.fileUrl} onLoadSuccess={onDocLoad} loading={<Skeleton className="w-[560px] h-[760px]" />} error={<div className="p-6 text-center text-sm text-muted-foreground max-w-md">Preview unavailable. The PDF source is not reachable in this sandbox. <a className="text-primary underline" href={doc.fileUrl} target="_blank" rel="noreferrer">Open source</a>.</div>}>
                <Page pageNumber={pageNumber} width={560} className="rounded-md shadow-2xl shadow-black/40" renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
              {pendingCitation && (
                <div className="absolute -left-3 top-4 h-[calc(100%-2rem)] w-0.5 bg-amber-400/80 animate-pulse" />
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Metadata panel */}
      <ScrollArea className="hidden md:block bg-panel h-full scrollbar-thin">
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <FileText className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm leading-tight">Document Metadata</p>
              <p className="text-[11px] text-muted-foreground truncate">{doc.quarter ?? 'Annual'} · FY{doc.year}</p>
            </div>
          </div>

          <div className="space-y-3">
            <MetaRow icon={<Building2 className="size-3.5" />} label="Company" value={doc.companyName} />
            <MetaRow icon={<FileText className="size-3.5" />} label="Type" value={doc.type.replace(/_/g, ' ')} />
            {doc.quarter && <MetaRow icon={<Calendar className="size-3.5" />} label="Quarter" value={doc.quarter} />}
            <MetaRow icon={<Calendar className="size-3.5" />} label="Year" value={`FY${doc.year}`} />
            <MetaRow icon={<Layers className="size-3.5" />} label="Pages" value={String(doc.pageCount)} />
            <MetaRow icon={<Calendar className="size-3.5" />} label="Uploaded" value={new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
          </div>

          <Separator className="my-4" />

          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-2">Status</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">Parsed</Badge>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">AI-ready</Badge>
          </div>

          <div className="space-y-2 mt-5">
            <Button variant="outline" className="w-full h-9 justify-start gap-2"><Download className="size-4" /> Download PDF</Button>
            {doc.sourceUrl && (
              <Button asChild variant="ghost" className="w-full h-9 justify-start gap-2 text-muted-foreground">
                <a href={doc.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> View source</a>
              </Button>
            )}
          </div>

          {pendingCitation && (
            <div className="mt-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium mb-1">
                <Highlighter className="size-3.5" /> Jumped to page {pendingCitation.page}
              </div>
              <p className="text-[11px] text-muted-foreground">Opened from a chat citation. Referenced section is highlighted.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-xs text-foreground font-medium capitalize">{value}</span>
    </div>
  );
}
