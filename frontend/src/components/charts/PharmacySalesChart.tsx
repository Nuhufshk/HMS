import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/constants';
import { formatCurrency } from '@/utils/format';
import { ChartTooltip, useChartTheme } from './ChartTooltip';

export interface PharmacySalesChartProps {
  data: Array<{ category: string; sales: number }>;
}

export function PharmacySalesChart({ data }: PharmacySalesChartProps) {
  const theme = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis
          dataKey="category"
          tick={{ fill: theme.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-28}
          textAnchor="end"
          height={64}
        />
        <YAxis
          tick={{ fill: theme.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `GH₵${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<ChartTooltip formatter={(v) => formatCurrency(Number(v))} />} cursor={{ fill: theme.cursor }} />
        <Bar dataKey="sales" name="Sales" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}
