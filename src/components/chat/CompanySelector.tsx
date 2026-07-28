import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCompanyStore } from '@/store/company.store';
import { useChatStore } from '@/store/chat.store';
import { cn } from '@/lib/utils';

export function CompanySelector() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = useChatStore((s) => s.selectedCompanyId);
  const setCompany = useChatStore((s) => s.setCompany);

  const companies = useCompanyStore((s) => s.companies);
  const current = companies.find((c) => c.id === selected);
  const filtered = companies.filter(
    (c) => !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.ticker.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-9 px-2.5 bg-secondary/40 border-border hover:bg-secondary gap-2 text-sm font-normal"
        >
          {current ? (
            <>
              <span className="size-2 rounded-full" style={{ backgroundColor: current.color }} />
              <span className="truncate max-w-[120px]">{current.ticker}</span>
            </>
          ) : (
            <span className="text-muted-foreground">All companies</span>
          )}
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies"
            className="bg-transparent flex-1 outline-none text-sm placeholder:text-muted-foreground"
          />
          {!selected || filtered.length === 0}
        </div>
        <ScrollArea className="h-64">
          <div className="p-1">
            <button
              onClick={() => { setCompany(undefined); setOpen(false); }}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-2 rounded-md text-sm hover:bg-secondary/60',
                !selected && 'bg-secondary'
              )}
            >
              <span className="text-muted-foreground">All companies</span>
              {!selected && <Check className="size-4 text-primary" />}
            </button>
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCompany(c.id); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm hover:bg-secondary/60 transition',
                  selected === c.id && 'bg-secondary'
                )}
              >
                <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <div className="flex-1 text-left min-w-0">
                  <p className="truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.sector}</p>
                </div>
                <Badge variant="outline" className="text-[9px]">{c.ticker}</Badge>
                {selected === c.id && <Check className="size-4 text-primary" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
