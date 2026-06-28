import { useState } from 'react';
import {
  Search,
  FileText,
  MoreVertical,
  Trash2,
  Eye,
  Upload,
  Filter,
  Download,
  Brain,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAdminStore } from '@/store/admin.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { AdminDocument } from '@/types';

const DOCUMENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'annual_report', label: 'Annual Report' },
  { value: 'quarterly_report', label: 'Quarterly Report' },
  { value: 'investor_presentation', label: 'Investor Presentation' },
  { value: 'earnings_call', label: 'Earnings Call' },
  { value: 'press_release', label: 'Press Release' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'processed', label: 'Processed' },
  { value: 'failed', label: 'Failed' },
];

export function AdminDocumentsPage() {
  const documents = useAdminStore((s) => s.documents);
  const deleteDocument = useAdminStore((s) => s.deleteDocument);
  const rebuildEmbedding = useAdminStore((s) => s.rebuildEmbedding);
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<AdminDocument | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.companyName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDelete = () => {
    if (selectedDoc) {
      deleteDocument(selectedDoc.id);
      toast({
        title: 'Document deleted',
        description: `${selectedDoc.name} has been removed.`,
      });
      setDeleteDialogOpen(false);
      setSelectedDoc(null);
    }
  };

  const handleRebuildEmbedding = (doc: AdminDocument) => {
    rebuildEmbedding(doc.id);
    toast({
      title: 'Rebuilding embeddings',
      description: `Embedding regeneration started for ${doc.name}.`,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDocType = (type: string) => {
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Documents</h1>
          <p className="text-muted-foreground mt-1">
            View, filter, and manage all uploaded documents.
          </p>
        </div>
        <Button>
          <Upload className="size-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="size-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Embedding</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-red-500/10 grid place-items-center shrink-0">
                        <FileText className="size-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.pageCount} pages • {doc.sizeMb} MB
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{doc.companyName}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {formatDocType(doc.type)}
                    </Badge>
                    {doc.quarter && (
                      <span className="text-xs text-muted-foreground ml-1">
                        {doc.quarter}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell>
                    <EmbeddingBadge status={doc.embeddingStatus} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(doc.uploadedAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>
                          <Eye className="size-4 mr-2" />
                          View Document
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="size-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Upload className="size-4 mr-2" />
                          Replace Document
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRebuildEmbedding(doc)}>
                          <Brain className="size-4 mr-2" />
                          Rebuild Embeddings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="size-10 text-muted-foreground/40" />
                      <p className="text-muted-foreground">No documents found</p>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDoc?.name}"? This action cannot be undone
              and will remove all associated embeddings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    pending: {
      icon: <Clock className="size-3" />,
      label: 'Pending',
      className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20',
    },
    processing: {
      icon: <Loader2 className="size-3 animate-spin" />,
      label: 'Processing',
      className: 'bg-blue-500/15 text-blue-600 border-blue-500/20',
    },
    processed: {
      icon: <CheckCircle2 className="size-3" />,
      label: 'Processed',
      className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
    },
    failed: {
      icon: <AlertCircle className="size-3" />,
      label: 'Failed',
      className: 'bg-red-500/15 text-red-600 border-red-500/20',
    },
  };
  const c = config[status] || config.pending;
  return (
    <Badge variant="outline" className={cn('text-[10px] gap-1', c.className)}>
      {c.icon}
      {c.label}
    </Badge>
  );
}

function EmbeddingBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-gray-500/15 text-gray-600' },
    processing: { label: 'Processing', className: 'bg-blue-500/15 text-blue-600' },
    completed: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-600' },
    failed: { label: 'Failed', className: 'bg-red-500/15 text-red-600' },
  };
  const c = config[status] || config.pending;
  return (
    <Badge variant="secondary" className={cn('text-[10px] border-0', c.className)}>
      {c.label}
    </Badge>
  );
}
