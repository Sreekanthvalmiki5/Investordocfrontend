import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AiInsight } from '@/types';

const sentimentMap = {
  positive: { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', label: 'Positive' },
  negative: { icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', label: 'Negative' },
  neutral: { icon: Minus, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: 'Neutral' },
};

export function InsightCard({ insight }: { insight: AiInsight }) {
  const meta = sentimentMap[insight.sentiment];
  const SentIcon = meta.icon;
  return (
    <div className={cn('p-4 rounded-xl bg-card border transition hover:border-primary/30', meta.border)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('size-7 rounded-lg grid place-items-center', meta.bg, meta.color)}>
            <Sparkles className="size-3.5" />
          </div>
          <h4 className="text-sm font-semibold">{insight.title}</h4>
        </div>
        <Badge variant="outline" className={cn('text-[9px] gap-1', meta.color, meta.bg, meta.border)}>
          <SentIcon className="size-2.5" /> {meta.label}
        </Badge>
      </div>
      <p className="text-xs text-foreground/90 mt-2 leading-relaxed">{insight.summary}</p>
      <ul className="mt-3 space-y-1.5">
        {insight.details.map((d, i) => (
          <li key={i} className="text-[11px] text-muted-foreground flex gap-2 leading-relaxed">
            <span className="text-primary">•</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Confidence</span>
          <span className="font-medium text-foreground">{Math.round(insight.confidence * 100)}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full', meta.color.replace('text-', 'bg-'))} style={{ width: `${insight.confidence * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
