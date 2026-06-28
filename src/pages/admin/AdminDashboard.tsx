import { Link } from '@tanstack/react-router';
import {
  FileText,
  Building2,
  Users,
  HardDrive,
  Brain,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Upload,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { useAdminStore } from '@/store/admin.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function AdminDashboardPage() {
  const stats = useAdminStore((s) => s.stats);
  const documents = useAdminStore((s) => s.documents);
  const users = useAdminStore((s) => s.users);

  const recentDocs = documents.slice(0, 5);
  const recentUsers = users.slice(0, 4);

  const statCards = [
    {
      title: 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Companies',
      value: stats.totalCompanies,
      icon: Building2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Storage Used',
      value: `${stats.storageUsedGb} GB`,
      icon: HardDrive,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  const quickActions = [
    {
      title: 'Upload Reports',
      description: 'Add new PDF documents to the system',
      icon: Upload,
      to: '/admin/upload',
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Documents',
      description: 'View, edit, or delete documents',
      icon: FileText,
      to: '/admin/documents',
      color: 'bg-emerald-500',
    },
    {
      title: 'Manage Companies',
      description: 'Add or update company profiles',
      icon: Building2,
      to: '/admin/companies',
      color: 'bg-purple-500',
    },
    {
      title: 'View Analytics',
      description: 'Platform usage statistics',
      icon: TrendingUp,
      to: '/admin/analytics',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's an overview of your platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={cn('size-12 rounded-xl grid place-items-center', stat.bg)}>
                  <stat.icon className={cn('size-6', stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4" />
            Processing Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="size-10 rounded-lg bg-emerald-500/10 grid place-items-center">
                <CheckCircle2 className="size-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.processedToday}</p>
                <p className="text-xs text-muted-foreground">Processed Today</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="size-10 rounded-lg bg-blue-500/10 grid place-items-center">
                <Clock className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.embeddingQueue}</p>
                <p className="text-xs text-muted-foreground">Embedding Queue</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="size-10 rounded-lg bg-red-500/10 grid place-items-center">
                <AlertCircle className="size-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {documents.filter((d) => d.status === 'failed').length}
                </p>
                <p className="text-xs text-muted-foreground">Failed Uploads</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className={cn('size-10 rounded-lg grid place-items-center', action.color)}>
                  <action.icon className="size-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Documents</CardTitle>
              <CardDescription>Latest uploaded reports</CardDescription>
            </div>
            <Link to="/admin/documents">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="size-10 rounded-lg bg-blue-500/10 grid place-items-center shrink-0">
                    <FileText className="size-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.companyName} • {doc.pageCount} pages
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.status} />
                    <EmbeddingBadge status={doc.embeddingStatus} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Users */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Active Users</CardTitle>
            <CardDescription>Recently active platform users</CardDescription>
          </div>
          <Link to="/admin/users">
            <Button variant="ghost" size="sm">
              Manage users
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 grid place-items-center text-white text-sm font-medium shrink-0">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'h-4 px-1 text-[9px]',
                        user.role === 'admin' ? 'bg-primary/15 text-primary' : ''
                      )}
                    >
                      {user.role}
                    </Badge>
                    <Badge variant="outline" className="h-4 px-1 text-[9px]">
                      {user.plan}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Embedding Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="size-4" />
            Embedding Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents
              .filter((d) => d.embeddingStatus !== 'completed')
              .slice(0, 3)
              .map((doc) => (
                <div key={doc.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{doc.name}</span>
                    <span className="text-muted-foreground">
                      {doc.embeddingStatus === 'processing' ? '65%' : doc.embeddingStatus}
                    </span>
                  </div>
                  <Progress
                    value={doc.embeddingStatus === 'processing' ? 65 : 0}
                    className="h-1.5"
                  />
                </div>
              ))}
            {documents.filter((d) => d.embeddingStatus !== 'completed').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                All documents have been embedded successfully.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20' },
    processing: { label: 'Processing', className: 'bg-blue-500/15 text-blue-600 border-blue-500/20' },
    processed: { label: 'Processed', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' },
    failed: { label: 'Failed', className: 'bg-red-500/15 text-red-600 border-red-500/20' },
  };
  const c = config[status] || config.pending;
  return (
    <Badge variant="outline" className={cn('text-[10px]', c.className)}>
      {c.label}
    </Badge>
  );
}

function EmbeddingBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: 'Embedding: Pending', className: 'bg-gray-500/15 text-gray-600' },
    processing: { label: 'Embedding...', className: 'bg-blue-500/15 text-blue-600' },
    completed: { label: 'Embedded', className: 'bg-emerald-500/15 text-emerald-600' },
    failed: { label: 'Embed Failed', className: 'bg-red-500/15 text-red-600' },
  };
  const c = config[status] || config.pending;
  return (
    <Badge variant="secondary" className={cn('text-[10px] border-0', c.className)}>
      {c.label}
    </Badge>
  );
}
