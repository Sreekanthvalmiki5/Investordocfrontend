import { Building2, Search, FileText, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { companyService } from '@/services/api';
import { formatCurrencyCr } from '@/services/mockData';
import type { Sector } from '@/types';

const SECTORS: (Sector | 'all')[] = ['all', 'Technology', 'Energy', 'Finance', 'Healthcare', 'Consumer', 'Industrial', 'Materials'];

export function CompaniesPage() {
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState<Sector | 'all'>('all');
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies', query, sector],
    queryFn: () => companyService.searchCompanies(query, sector),
  });

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 min-h-0 scrollbar-thin">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          <PageHeader
            title="Company Explorer"
            description="Browse companies with indexed financial documents and AI insights."
          />

          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name or ticker…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={sector} onValueChange={(v) => setSector(v as Sector | 'all')}>
              <SelectTrigger className="h-10 w-full sm:w-48"><SelectValue placeholder="Sector" /></SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s} value={s}>{s === 'all' ? 'All sectors' : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">{companies.length} companies</div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
            </div>
          ) : companies.length === 0 ? (
            <EmptyState icon={<Building2 className="size-6" />} title="No companies found" description="Try a different search or sector filter." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {companies.map((c) => (
                <Link
                  key={c.id}
                  to="/company/$companyId"
                  params={{ companyId: c.id }}
                  className="group p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-11 rounded-lg border border-border" style={{ backgroundColor: c.color + '20' }}>
                      <AvatarFallback className="rounded-lg font-semibold text-sm" style={{ color: c.color }}>
                        {c.ticker.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm text-foreground truncate">{c.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{c.sector} · {c.industry}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{c.ticker}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{c.description}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <Stat label="Market Cap" value={formatCurrencyCr(c.marketCapCr)} />
                    <Stat label="Reports" value={String(c.totalReports)} icon={<FileText className="size-3" />} />
                    <Stat label="Latest Filing" value={new Date(c.latestFilingDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} icon={<Calendar className="size-3" />} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-secondary/40 rounded-md py-1.5 px-1">
      <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground uppercase tracking-wide">{icon}{label}</div>
      <div className="text-[11px] font-medium text-foreground mt-0.5">{value}</div>
    </div>
  );
}
