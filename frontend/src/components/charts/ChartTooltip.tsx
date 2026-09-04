import { cn } from '@/utils/cn';

export interface TooltipRow {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipRow[];
  /** Format each value, e.g. currency. */
  formatter?: (value: number | string, name: string) => string;
  labelFormatter?: (label: string | number) => string;
}

/** Shared, theme-aware tooltip for all charts. */
export function ChartTooltip({ active, label, payload, formatter, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-chart-tooltip-border bg-chart-tooltip-bg px-3 py-2 text-xs shadow-md">
      {label !== undefined && (
        <p className="mb-1.5 font-semibold text-chart-tooltip-text">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((row, i) => {
          const name = row.name ?? String(row.dataKey ?? '');
          const value = row.value ?? 0;
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: row.color ?? '#10B878' }}
                  aria-hidden
                />
                {name}
              </span>
              <span className="font-semibold text-chart-tooltip-text">
                {formatter ? formatter(value, name) : value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Shared axis/grid colours derived from the active theme. */
export function useChartTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    grid: isDark ? '#334155' : '#E2E8F0',
    axis: isDark ? '#94A3B8' : '#64748B',
    cursor: isDark ? 'rgba(148,163,184,0.14)' : 'rgba(100,116,139,0.10)',
  };
}

export const chartBaseProps = {
  tick: { fontSize: 12 },
  tickLine: false as const,
  axisLine: false as const,
};
