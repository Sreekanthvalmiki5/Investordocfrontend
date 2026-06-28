import { useState } from 'react';
import {
  Brain,
  RefreshCw,
  Play,
  Pause,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { useAdminStore } from '@/store/admin.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function AdminEmbeddingsPage() {
  const documents = useAdminStore((s) => s.documents);
  const rebuildEmbedding = useAdminStore((s) => s.rebuildEmbedding);

  const [processingAll, setProcessingAll] = useState(false);

  const embeddingStats = {
    completed: documents.filter((d) => d.embeddingStatus === 'completed').length,
    processing: documents.filter((d) => d.embeddingStatus === 'processing').length,
    pending: documents.filter((d) => d.embeddingStatus === 'pending').length,
    failed: documents.filter((d) => d.embeddingStatus === 'failed').length,
  };

  const filteredDocs = documents.filter(
    (d) => d.embeddingStatus !== 'completed' || d.status === 'processed'
  );

  const handleRebuildAll = () => {
    setProcessingAll(true);
    documents
      .filter((d) => d.embeddingStatus !== 'processing')
      .forEach((d) => rebuildEmbedding(d.id));
    setTimeout(() => setProcessingAll(false), 2000);
  };

  const getProgressPercentage = () => {
    const total = documents.length;
    if (total === 0) return 100;
    return Math.round((embeddingStats.completed / total) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Embeddings</h1>
          <p className="text-muted-foreground mt-1">
            Manage vector embeddings for document search and AI features.
          </p>
        </div>
        <Button onClick={handleRebuildAll} disabled={processingAll}>
          {processingAll ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="size-4 mr-2" />
          )}
          Rebuild All
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{embeddingStats.completed}</p>
              </div>
              <div className="size-12 rounded-xl bg-emerald-500/10 grid place-items-center">
                <CheckCircle2 className="size-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{embeddingStats.processing}</p>
              </div>
              <div className="size-12 rounded-xl bg-blue-500/10 grid place-items-center">
                <Loader2 className="size-6 text-blue-500 animate-spin" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{embeddingStats.pending}</p>
              </div>
              <div className="size-12 rounded-xl bg-yellow-500/10 grid place-items-center">
                <Clock className="size-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{embeddingStats.failed}</p>
              </div>
              <div className="size-12 rounded-xl bg-red-500/10 grid place-items-center">
                <AlertCircle className="size-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="size-4" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{embeddingStats.completed} of {documents.length} documents embedded</span>
              <span className="font-medium">{getProgressPercentage()}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Embedding Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Embedding Queue</CardTitle>
          <CardDescription>
            Documents waiting for or currently processing embeddings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
              >
                <div className="size-10 rounded-lg bg-red-500/10 grid place-items-center shrink-0">
                  <FileText className="size-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <EmbeddingStatusBadge status={doc.embeddingStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">{doc.companyName}</p>
                </div>
                <div className="text-right">
                  {doc.embeddingStatus === 'processing' && (
                    <div className="flex items-center gap-2">
                      <Progress value={65} className="w-20 h-1.5" />
                      <span className="text-xs text-muted-foreground">65%</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => rebuildEmbedding(doc.id)}
                  disabled={doc.embeddingStatus === 'processing'}
                >
                  {doc.embeddingStatus === 'processing' ? (
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4" />
                  )}
                </Button>
              </div>
            ))}
            {filteredDocs.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8">
                <CheckCircle2 className="size-10 text-emerald-500/40" />
                <p className="text-muted-foreground">All documents have been embedded</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Model Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="size-4" />
              Embedding Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Model</span>
                <span className="text-sm font-medium">text-embedding-3-large</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dimensions</span>
                <span className="text-sm font-medium">3072</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Max Tokens</span>
                <span className="text-sm font-medium">8,191</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <span className="text-sm font-medium">OpenAI</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vector Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <span className="text-sm font-medium">Supabase pgvector</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Index Type</span>
                <span className="text-sm font-medium">IVFFlat</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lists</span>
                <span className="text-sm font-medium">100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Distance Metric</span>
                <span className="text-sm font-medium">Cosine</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmbeddingStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
    pending: { label: 'Pending', className: 'bg-gray-500/15 text-gray-600' },
    processing: {
      label: 'Processing',
      className: 'bg-blue-500/15 text-blue-600',
      icon: <Loader2 className="size-3 animate-spin mr-1" />,
    },
    completed: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-600' },
    failed: { label: 'Failed', className: 'bg-red-500/15 text-red-600' },
  };
  const c = config[status] || config.pending;
  return (
    <Badge variant="secondary" className={cn('text-[10px] border-0', c.className)}>
      {c.icon}
      {c.label}
    </Badge>
  );
}
