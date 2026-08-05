import { useParams, Link } from '@tanstack/react-router';
import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Layers,
  Download,
  Highlighter,
  ExternalLink,
  ExternalLinkIcon,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { documentService } from '@/services/api';
import { useChatStore } from '@/store/chat.store';
import type { DocumentItem } from '@/types';

// ─── Preview URL cache (10-minute TTL) ────────────────────────────────────────

interface CacheEntry {
  url: string;
  fetchedAt: number;
  expiresIn: number; // seconds from backend
}

const PREVIEW_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const previewCache = new Map<string, CacheEntry>();

function getCachedPreview(id: string): string | null {
  const entry = previewCache.get(id);
  if (!entry) return null;
  const elapsed = Date.now() - entry.fetchedAt;
  // Stale if cache TTL exceeded or backend expiration is near
  if (elapsed > PREVIEW_CACHE_TTL_MS || elapsed > entry.expiresIn * 800) {
    previewCache.delete(id);
    return null;
  }
  return entry.url;
}

function setCachedPreview(id: string, url: string, expiresIn: number): void {
  previewCache.set(id, { url, fetchedAt: Date.now(), expiresIn });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PdfViewerPage() {
  const { documentId } = useParams({ from: '/documents/$documentId' });
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  // The cached preview is only used as the initial value; rendering uses the
  // doc's own preview URL once resolved.
  const [, setPreviewUrl] = useState<string | null>(() =>
    getCachedPreview(documentId)
  );
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const pendingCitation = useChatStore((s) => s.pendingCitation);
  const clearPendingCitation = useChatStore((s) => s.clearPendingCitation);

  // ── Load document metadata ──
  useEffect(() => {
    setLoading(true);

    documentService.get(documentId).then((d) => {
      setDoc(d ?? null);
      setLoading(false);

      clearPendingCitation();
    });
  }, [documentId, pendingCitation, clearPendingCitation]);

  // ── Fetch preview URL and open in new tab ──
  const handleOpenPdf = useCallback(async () => {
    // Check cache first
    const cached = getCachedPreview(documentId);
    if (cached) {
      window.open(cached, '_blank', 'noopener,noreferrer');
      return;
    }

    setPreviewLoading(true);
    setPreviewError(false);

    try {
      const result = await documentService.preview(documentId);
      if (result?.url) {
        setCachedPreview(documentId, result.url, result.expiresIn);
        setPreviewUrl(result.url);
        window.open(result.url, '_blank', 'noopener,noreferrer');
      } else {
        setPreviewError(true);
      }
    } catch {
      setPreviewError(true);
    } finally {
      setPreviewLoading(false);
    }
  }, [documentId]);

  // Autofetch preview URL on mount but don't auto-open
  useEffect(() => {
    const cached = getCachedPreview(documentId);
    if (cached) {
      setPreviewUrl(cached);
    } else {
      // Silently pre-fetch and cache so it's ready when user clicks
      documentService.preview(documentId).then((result) => {
        if (result?.url) {
          setCachedPreview(documentId, result.url, result.expiresIn);
          setPreviewUrl(result.url);
        }
      });
    }
  }, [documentId]);

  // ── Download handler ──
  const handleDownload = useCallback(async () => {
    const result = await documentService.download(documentId);
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  }, [documentId]);

  // ── Render ──

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
      {/* PDF preview area */}
      <div className="flex flex-col h-full min-h-0 border-r border-border">
        {/* Toolbar */}
        <div className="h-12 shrink-0 border-b border-border flex items-center gap-2 px-3">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link to="/documents"><ArrowLeft className="size-4" /> Back</Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <p className="text-sm font-medium truncate flex-1">{doc.name}</p>
        </div>

        <div className="flex-1 min-h-0 bg-[#1a1f2e] grid place-items-center p-8">
          {previewLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="size-10 rounded-full border-[3px] border-primary/30 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Generating secure preview URL…</p>
            </div>
          ) : previewError ? (
            <div className="flex flex-col items-center gap-4 max-w-sm text-center">
              <FileText className="size-14 text-muted-foreground/30" />
              <div>
                <p className="text-base font-medium text-foreground mb-1">Unable to preview this document</p>
                <p className="text-sm text-muted-foreground">
                  The preview URL could not be generated. This may happen if the document hasn't been processed yet.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleOpenPdf}>
                  <RefreshCw className="size-3.5" /> Retry
                </Button>
                <Button variant="default" size="sm" className="gap-1.5" onClick={handleDownload}>
                  <Download className="size-3.5" /> Download instead
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 max-w-md text-center">
              <div className="size-16 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                <FileText className="size-8" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground mb-1">{doc.name}</p>
                <p className="text-sm text-muted-foreground">
                  {doc.companyName} · {doc.quarter ?? 'Annual'} FY{doc.year} · {doc.pageCount} pages
                </p>
              </div>
              <div className="flex gap-3">
                <Button size="lg" className="gap-2 h-11 px-6" onClick={handleOpenPdf}>
                  <ExternalLinkIcon className="size-4.5" />
                  Open PDF in new tab
                </Button>
                <Button variant="outline" size="lg" className="gap-2 h-11 px-6" onClick={handleDownload}>
                  <Download className="size-4.5" />
                  Download
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/60">
                PDF opens in a new tab. If your browser blocks it, check your pop-up settings.
              </p>
            </div>
          )}
        </div>
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
            <Button variant="outline" className="w-full h-9 justify-start gap-2" onClick={handleDownload}>
              <Download className="size-4" /> Download PDF
            </Button>
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
