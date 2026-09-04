import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS } from '@/constants';
import { formatCurrency } from '@/utils/format';
import { ChartTooltip, useChartTheme } from './ChartTooltip';

export interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const theme = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis dataKey="month" tick={{ fill: theme.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fill: theme.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `GH₵${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(Number(v))} />} cursor={{ stroke: theme.cursor }} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke={CHART_COLORS.teal}
          strokeWidth={2}
          fill="url(#gradRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
