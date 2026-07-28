import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAdminStore } from '@/store/admin.store';
import { useCompanyStore } from '@/store/company.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { documentService } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ReportType } from '@/types';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'annual_report', label: 'Annual Report' },
  { value: 'quarterly_report', label: 'Quarterly Report' },
  { value: 'investor_presentation', label: 'Investor Presentation' },
  { value: 'earnings_call', label: 'Earnings Call Transcript' },
  { value: 'press_release', label: 'Press Release' },
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const YEARS = Array.from({ length: 26 }, (_, i) => 2025 + i);

interface FileWithPreview {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

export function AdminUploadPage() {
  const companies = useCompanyStore((s) => s.companies);
  // const uploadDocuments = useAdminStore((s) => s.uploadDocuments);
  const uploadTasks = useAdminStore((s) => s.uploadTasks);
  // const formData = new FormData();


  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [reportType, setReportType] = useState<ReportType>('quarterly_report');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [quarter, setQuarter] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );

    const newFiles = droppedFiles.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files).filter(
      (f) => f.type === 'application/pdf'
    );

    const newFiles = selectedFiles.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select at least one PDF.");
      return;
    }

    if (!companyId) {
      alert("Please select a company.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      // Backend expects a single file via POST /api/documents/upload
      // Upload files sequentially for proper progress tracking
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f.file);
        fd.append("company_id", companyId);
        fd.append("report_type", reportType);
        fd.append("year", year);
        if (quarter) fd.append("quarter", quarter);

        await documentService.upload(fd);
      }

      alert(`All ${files.length} file(s) uploaded successfully.`);
      setFiles([]);
      setQuarter('');
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.detail ??
          "Failed to upload documents."
      );
    } finally {
      setIsUploading(false);
    }
  };
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Reports</h1>
        <p className="text-muted-foreground mt-1">
          Upload financial reports, earnings calls, and other PDF documents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                <div className="size-16 rounded-xl bg-primary/10 grid place-items-center">
                  <Upload className="size-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium">Drag & drop PDF files here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse • Supports multi-file upload
                  </p>
                </div>
                <Button variant="secondary" size="sm" className="mt-2">
                  <FileText className="size-4 mr-2" />
                  Select Files
                </Button>
              </div>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Files to Upload ({files.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="size-10 rounded-lg bg-red-500/10 grid place-items-center shrink-0">
                      <FileText className="size-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(f.file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(f.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upload Progress */}
          {uploadTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Upload Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {uploadTasks.map((task) => (
                  <div key={task.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {task.files.length} file(s) for {companies.find((c) => c.id === task.companyId)?.name || 'Company'}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          task.status === 'completed' && 'bg-emerald-500/15 text-emerald-600',
                          task.status === 'uploading' && 'bg-blue-500/15 text-blue-600'
                        )}
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="size-3 mr-1" />
                        ) : (
                          <Loader2 className="size-3 mr-1 animate-spin" />
                        )}
                        {task.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {task.progress.map((p) => (
                        <div key={p.fileId} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground flex-1 truncate">
                            {p.fileName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(p.progress)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Settings</CardTitle>
              <CardDescription>Configure document metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company */}
              <div className="space-y-2">
                <Label>Company *</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.ticker})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <Label>Report Type *</Label>
                <Select
                  value={reportType}
                  onValueChange={(v) => setReportType(v as ReportType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <Label>Year *</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quarter (for quarterly reports) */}
              {(reportType === 'quarterly_report' || reportType === 'earnings_call') && (
                <div className="space-y-2">
                  <Label>Quarter</Label>
                  <Select value={quarter} onValueChange={setQuarter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUARTERS.map((q) => (
                        <SelectItem key={q} value={q}>
                          {q}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Upload Button */}
              <Button
                className="w-full mt-4"
                disabled={files.length === 0 || !companyId || isUploading}
                onClick={handleUpload}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="size-4 mr-2" />
                    Upload {files.length} File{files.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="size-4 text-muted-foreground" />
                Supported Formats
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• PDF documents only</li>
                <li>• Maximum file size: 100 MB</li>
                <li>• Uploads are processed async</li>
                <li>• Embeddings auto-generated</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
