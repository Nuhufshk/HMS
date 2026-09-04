import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

export type MetricTone = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'processing';

const TONE_CLASSES: Record<MetricTone, string> = {
  primary: 'bg-primary-soft text-primary-strong',
  info: 'bg-info-soft text-info-strong',
  success: 'bg-success-soft text-success-strong',
  warning: 'bg-warning-soft text-warning-strong',
  danger: 'bg-destructive-soft text-destructive-strong',
  processing: 'bg-processing-soft text-processing-strong',
};

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: MetricTone;
  description?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  loading?: boolean;
}

export function MetricCard({ label, value, icon: Icon, tone = 'primary', description, trend, loading }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" aria-hidden />
          ) : (
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          )}
          {description && <p className="mt-1 truncate text-xs text-muted-foreground">{description}</p>}
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', TONE_CLASSES[tone])}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend.direction === 'up' && <TrendingUp className="h-3.5 w-3.5 text-success" aria-hidden />}
          {trend.direction === 'down' && <TrendingDown className="h-3.5 w-3.5 text-destructive" aria-hidden />}
          <span
            className={cn(
              'font-semibold',
              trend.direction === 'up' ? 'text-success-strong' : trend.direction === 'down' ? 'text-destructive-strong' : 'text-muted-foreground',
            )}
          >
            {trend.value}
          </span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      )}
    </Card>
  );
}
