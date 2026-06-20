import { Check, ChevronsUpDown, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MODELS } from '@/services/mockData';
import { useChatStore } from '@/store/chat.store';
import { cn } from '@/lib/utils';

export function ModelSelector() {
  const selected = useChatStore((s) => s.selectedModel);
  const setModel = useChatStore((s) => s.setModel);
  const current = MODELS.find((m) => m.id === selected) ?? MODELS[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 px-3 bg-secondary/40 border-border hover:bg-secondary gap-2 text-sm font-normal">
          <Sparkles className="size-3.5 text-primary" />
          <span className="hidden sm:inline">{current.label}</span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        <p className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">Default model</p>
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => setModel(m.id)}
            className={cn(
              'w-full flex items-start gap-2 px-2.5 py-2 rounded-md text-sm hover:bg-secondary/60 transition text-left',
              selected === m.id && 'bg-secondary'
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{m.label}</span>
                <span className="text-[10px] text-muted-foreground">· {m.vendor}</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{m.description}</p>
            </div>
            {selected === m.id && <Check className="size-4 text-primary mt-0.5 shrink-0" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
