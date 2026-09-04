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
import { ChartTooltip, useChartTheme } from './ChartTooltip';

export interface AppointmentTrendChartProps {
  data: Array<{ day: string; label: string; scheduled: number; completed: number; cancelled: number }>;
}

export function AppointmentTrendChart({ data }: AppointmentTrendChartProps) {
  const theme = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gradScheduled" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: theme.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: theme.axis, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: theme.cursor }} />
        <Area
          type="monotone"
          dataKey="scheduled"
          name="Scheduled"
          stroke={CHART_COLORS.teal}
          strokeWidth={2}
          fill="url(#gradScheduled)"
        />
        <Area
          type="monotone"
          dataKey="completed"
          name="Completed"
          stroke={CHART_COLORS.blue}
          strokeWidth={2}
          fill="url(#gradCompleted)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

