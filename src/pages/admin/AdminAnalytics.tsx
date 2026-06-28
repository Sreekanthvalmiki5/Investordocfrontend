import {
  Users,
  FileText,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAdminStore } from '@/store/admin.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function AdminAnalyticsPage() {
  const stats = useAdminStore((s) => s.stats);
  const documents = useAdminStore((s) => s.documents);
  const users = useAdminStore((s) => s.users);

  const metrics = [
    {
      title: 'Total Queries',
      value: '12,847',
      change: '+18.2%',
      trend: 'up',
      period: 'vs last month',
    },
    {
      title: 'Avg Response Time',
      value: '1.3s',
      change: '-12.5%',
      trend: 'up',
      period: 'vs last month',
    },
    {
      title: 'Tokens Used',
      value: '8.2M',
      change: '+25.4%',
      trend: 'up',
      period: 'vs last month',
    },
    {
      title: 'Active Users',
      value: '234',
      change: '+8.7%',
      trend: 'up',
      period: 'this week',
    },
  ];

  const topCompanies = documents.reduce((acc, doc) => {
    acc[doc.companyName] = (acc[doc.companyName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCompanies = Object.entries(topCompanies)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topUsers = [...users]
    .sort((a, b) => (b.conversationCount || 0) - (a.conversationCount || 0))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Platform usage and performance metrics.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <div className="flex items-end justify-between mt-1">
                <p className="text-2xl font-bold">{metric.value}</p>
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm',
                    metric.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                  )}
                >
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="size-4" />
                  ) : (
                    <ArrowDownRight className="size-4" />
                  )}
                  {metric.change}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{metric.period}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents by Company</CardTitle>
            <CardDescription>Top 5 companies by document count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedCompanies.map(([name, count], index) => {
              const percentage = (count / documents.length) * 100;
              const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500'];
              return (
                <div key={name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{name}</span>
                    <span className="text-muted-foreground">{count} docs</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', colors[index % colors.length])}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Active Users</CardTitle>
            <CardDescription>Top 5 users by conversation count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 grid place-items-center text-white text-xs font-medium shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.conversationCount || 0}</p>
                    <p className="text-xs text-muted-foreground">conversations</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Used</span>
                  <span className="text-sm font-medium">{stats.storageUsedGb} GB</span>
                </div>
                <Progress value={(stats.storageUsedGb / 500) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">of 500 GB limit</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Documents</p>
                  <p className="text-lg font-semibold">{stats.totalDocuments}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Size</p>
                  <p className="text-lg font-semibold">8.2 MB</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="size-4" />
              API Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Latency</span>
                <span className="text-sm font-medium">245ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 border-0">
                  99.97%
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Error Rate</span>
                <span className="text-sm font-medium">0.03%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Requests Today</span>
                <span className="text-sm font-medium">45,231</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4" />
              User Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <span className="text-sm font-medium">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Admins</span>
                <span className="text-sm font-medium">
                  {users.filter((u) => u.role === 'admin').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pro Users</span>
                <span className="text-sm font-medium">
                  {users.filter((u) => u.plan === 'pro').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Enterprise</span>
                <span className="text-sm font-medium">
                  {users.filter((u) => u.plan === 'enterprise').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
