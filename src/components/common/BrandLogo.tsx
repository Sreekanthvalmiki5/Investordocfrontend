import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandLogo({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="size-8 rounded-lg bg-primary grid place-items-center shadow-md shadow-primary/30 shrink-0">
        <BarChart3 className="size-4.5 text-white" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="font-semibold text-sm text-sidebar-foreground tracking-tight">InvestorDocs</p>
          <p className="text-[10px] text-muted-foreground -mt-0.5 tracking-wider uppercase">AI Intelligence</p>
        </div>
      )}
    </div>
  );
}
