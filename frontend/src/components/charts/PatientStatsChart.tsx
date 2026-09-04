import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/constants';
import { ChartTooltip, useChartTheme } from './ChartTooltip';

export interface PatientStatsChartProps {
  data: Array<{ month: string; new: number; returning: number }>;
}

export function PatientStatsChart({ data }: PatientStatsChartProps) {
  const theme = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis dataKey="month" tick={{ fill: theme.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: theme.axis, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: theme.cursor }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value: string) => <span style={{ color: theme.axis }}>{value}</span>}
        />
        <Bar dataKey="new" name="New patients" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar dataKey="returning" name="Returning" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}
