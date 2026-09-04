import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/constants';
import { ChartTooltip, useChartTheme } from './ChartTooltip';

export interface DepartmentPerformanceChartProps {
  data: Array<{ department: string; appointments: number; patients: number }>;
}

export function DepartmentPerformanceChart({ data }: DepartmentPerformanceChartProps) {
  const theme = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
        <XAxis type="number" tick={{ fill: theme.axis, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="department"
          width={104}
          tick={{ fill: theme.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: theme.cursor }} />
        <Bar dataKey="appointments" name="Appointments" fill={CHART_COLORS.teal} radius={[0, 4, 4, 0]} maxBarSize={14} />
        <Bar dataKey="patients" name="Patients" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
