import { useParams, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  FileText,
  TrendingUp,
  Sparkles,
  MessageSquare,
  Calendar,
  Layers,
  DollarSign,
  Factory,
  Send,
} from 'lucide-react';
import { companyService, insightService, documentService, chatService } from '@/services/api';
import { FinancialCharts } from '@/components/companies/FinancialCharts';
import { InsightCard } from '@/components/companies/InsightCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrencyCr } from '@/services/mockData';
import type { AiInsight, Company, DocumentItem } from '@/types';

export function CompanyDetailPage() {
  const { companyId } = useParams({ from: '/company/$companyId' });
  const [tab, setTab] = useState('overview');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.get(companyId),
  });

  const { data: insights = [] } = useQuery({
    queryKey: ['insights', companyId],
    queryFn: () => insightService.forCompany(companyId),
  });

  if (isLoading || !company) {
    return (
      <div className="h-full overflow-auto p-6">
        <Skeleton className="h-8 w-48 mb-3" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-border bg-gradient-to-br from-card to-background px-4 md:px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-3 text-muted-foreground">
            <Link to="/companies"><ArrowLeft className="size-4" /> Companies</Link>
          </Button>
          <div className="flex items-start gap-4">
            <Avatar className="size-14 rounded-xl border border-border" style={{ backgroundColor: company.color + '22' }}>
              <AvatarFallback className="rounded-xl font-bold text-lg" style={{ color: company.color }}>
                {company.ticker.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{company.name}</h1>
                <Badge variant="outline" className="text-[10px]">{company.ticker}</Badge>
                <Badge variant="secondary" className="text-[10px]">{company.sector}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl line-clamp-2">{company.description}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col">
        <div className="shrink-0 border-b border-border px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <TabsList className="bg-transparent h-12 p-0 gap-1">
              <TabTrigger value="overview" icon={<Building2 className="size-3.5" />} label="Overview" />
              <TabTrigger value="reports" icon={<FileText className="size-3.5" />} label="Reports" />
              <TabTrigger value="metrics" icon={<TrendingUp className="size-3.5" />} label="Financial Metrics" />
              <TabTrigger value="insights" icon={<Sparkles className="size-3.5" />} label="AI Insights" />
              <TabTrigger value="conversations" icon={<MessageSquare className="size-3.5" />} label="Conversations" />
            </TabsList>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 scrollbar-thin">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
            <TabsContent value="overview" className="mt-0">
              <OverviewTab company={company} insights={insights} />
            </TabsContent>
            <TabsContent value="reports" className="mt-0">
              <ReportsTab companyId={company.id} />
            </TabsContent>
            <TabsContent value="metrics" className="mt-0">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Last 6 quarters of reported financials.</p>
                <FinancialCharts metrics={company.metrics} />
              </div>
            </TabsContent>
            <TabsContent value="insights" className="mt-0">
              <InsightsTab insights={insights} />
            </TabsContent>
            <TabsContent value="conversations" className="mt-0">
              <ConversationsTab companyId={company.id} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function TabTrigger({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return (
    <TabsTrigger value={value} className="gap-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-md text-muted-foreground data-[state=active]:text-foreground border-b-2 border-transparent data-[state=active]:border-primary rounded-none">
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </TabsTrigger>
  );
}

function OverviewTab({ company, insights }: { company: Company; insights: AiInsight[] }) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold mb-3">Company Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={<Building2 className="size-3.5" />} label="Sector" value={company.sector} />
            <InfoRow icon={<Factory className="size-3.5" />} label="Industry" value={company.industry} />
            <InfoRow icon={<DollarSign className="size-3.5" />} label="Market Cap" value={formatCurrencyCr(company.marketCapCr)} />
            <InfoRow icon={<FileText className="size-3.5" />} label="Total Reports" value={String(company.totalReports)} />
            <InfoRow icon={<Calendar className="size-3.5" />} label="Latest Filing" value={new Date(company.latestFilingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
            <InfoRow icon={<Layers className="size-3.5" />} label="Ticker" value={company.ticker} />
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground leading-relaxed">{company.description}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Financial Metrics</h3>
          <FinancialCharts metrics={company.metrics} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Top AI Insight</h3>
        {insights[0] && <InsightCard insight={insights[0]} />}
        <Button asChild className="w-full gap-2">
          <Link to="/dashboard"><Send className="size-4" /> Ask about {company.ticker}</Link>
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground ml-auto">{value}</span>
    </div>
  );
}

function ReportsTab({ companyId }: { companyId: string }) {
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['docs-company', companyId],
    queryFn: () => documentService.filter({ companyId }),
    select: (res) => res.items,
  });
  if (isLoading) return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  if (docs.length === 0) return <p className="text-sm text-muted-foreground">No reports indexed for this company yet.</p>;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {docs.map((d) => <ReportMiniCard key={d.id} doc={d} />)}
    </div>
  );
}

function ReportMiniCard({ doc }: { doc: DocumentItem }) {
  return (
    <Link to="/documents/$documentId" params={{ documentId: doc.id }} className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition block">
      <div className="flex items-center gap-2.5">
        <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0"><FileText className="size-4" /></div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{doc.name}</p>
          <p className="text-[11px] text-muted-foreground">{doc.quarter ?? 'Annual'} · FY{doc.year} · {doc.pageCount}p</p>
        </div>
      </div>
    </Link>
  );
}

function InsightsTab({ insights }: { insights: AiInsight[] }) {
  if (insights.length === 0) return <p className="text-sm text-muted-foreground">No AI insights generated yet.</p>;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {insights.map((i) => <InsightCard key={i.id} insight={i} />)}
    </div>
  );
}

function ConversationsTab({ companyId }: { companyId: string }) {
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations-company', companyId],
    queryFn: async () => {
      const all = await chatService.listConversations();
      return all.filter((c) => c.companyId === companyId);
    },
  });
  if (conversations.length === 0) return <p className="text-sm text-muted-foreground">No conversations yet for this company.</p>;
  return (
    <div className="space-y-2">
      {conversations.map((c) => (
        <Link key={c.id} to="/chat/$chatId" params={{ chatId: c.id }} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition group">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-foreground">{c.title}</p>
              <p className="text-[11px] text-muted-foreground">{c.messageCount} messages</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100">Open <ArrowLeft className="size-3 rotate-180" /></Button>
        </Link>
      ))}
    </div>
  );
}
