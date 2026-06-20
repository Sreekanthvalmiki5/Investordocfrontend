import { Sparkles } from 'lucide-react';

export function DashboardGreeting({ name }: { name?: string }) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] text-primary mb-3">
        <Sparkles className="size-3" />
        Powered by cited financial documents
      </div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
        Good {part}
        {name ? <span className="text-primary">, {name}</span> : null}
      </h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        Ask about quarterly results, risks, and growth across your documents — every answer is backed by source pages.
      </p>
    </div>
  );
}
