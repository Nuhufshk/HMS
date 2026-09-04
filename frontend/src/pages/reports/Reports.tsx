import { useMemo, useState } from 'react';
import { CalendarDays, FlaskConical, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { FormField, Input } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { ChartCard } from '@/components/charts/ChartCard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { AppointmentTrendChart } from '@/components/charts/AppointmentTrendChart';
import { PatientStatsChart } from '@/components/charts/PatientStatsChart';
import { DepartmentPerformanceChart } from '@/components/charts/DepartmentPerformanceChart';
import { PharmacySalesChart } from '@/components/charts/PharmacySalesChart';
import { LabTestsChart } from '@/components/charts/LabTestsChart';
import { getReportData, type ReportPeriod } from '@/data/analytics';
import { formatCurrency, formatNumber } from '@/utils/format';

const PERIODS: Array<{ id: ReportPeriod; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' },
  { id: 'custom', label: 'Custom range' },
];

export function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const data = useMemo(() => getReportData(period, customStart || undefined, customEnd || undefined), [period, customStart, customEnd]);

  return (
    <div>
      <PageHeader
        title="Reports & analytics"
        description={`Operational performance for ${data.label.toLowerCase()}.`}
        actions={
          <div className="flex items-center gap-2">
            <Tabs
              variant="pills"
              value={period}
              onChange={(p) => setPeriod(p as ReportPeriod)}
              items={PERIODS.map((p) => ({ id: p.id, label: p.label }))}
            />
          </div>
        }
      />

      {period === 'custom' && (
        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-end gap-3 pt-5">
            <FormField label="From">
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} max={customEnd || undefined} />
            </FormField>
            <FormField label="To">
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} min={customStart || undefined} />
            </FormField>
            <Button variant="outline" size="md" onClick={() => { setCustomStart(''); setCustomEnd(''); }}>
              Clear range
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI row */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'New patients', value: formatNumber(data.kpis.newPatients), icon: Users, tone: 'text-primary-strong bg-primary-soft' },
          { label: 'Appointments completed', value: formatNumber(data.kpis.appointments), icon: CalendarDays, tone: 'text-info-strong bg-info-soft' },
          { label: 'Revenue', value: formatCurrency(data.kpis.revenue), icon: TrendingUp, tone: 'text-success-strong bg-success-soft' },
          { label: 'Lab tests completed', value: formatNumber(data.kpis.testsCompleted), icon: FlaskConical, tone: 'text-processing-strong bg-processing-soft' },
        ].map((k) => (
          <Card key={k.label} className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.tone}`}>
                <k.icon className="h-4.5 w-4.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none text-foreground">{k.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{k.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Patient registrations" description="New vs returning patients per month">
          <PatientStatsChart data={data.patientRegistrations as Array<{ month: string; new: number; returning: number }>} />
        </ChartCard>

        <ChartCard title="Appointments" description="Completed vs cancelled appointments per month">
          <AppointmentTrendChart data={data.appointments.map((p) => ({ day: p.month as string, label: p.month as string, scheduled: Number(p.completed), completed: Number(p.completed), cancelled: Number(p.cancelled) }))} />
        </ChartCard>

        <ChartCard title="Revenue" description="Monthly revenue trend (GHS)">
          <RevenueChart data={data.revenue as Array<{ month: string; revenue: number }>} />
        </ChartCard>

        <ChartCard title="Department performance" description="Appointments and patient load by department">
          <DepartmentPerformanceChart data={data.departmentPerformance} />
        </ChartCard>

        <ChartCard title="Pharmacy sales" description="Sales by medicine category (GHS)">
          <PharmacySalesChart data={data.pharmacySales} />
        </ChartCard>

        <ChartCard title="Laboratory tests" description="Tests requested vs completed per month">
          <LabTestsChart data={data.labTests as Array<{ month: string; requested: number; completed: number }>} />
        </ChartCard>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Operational highlights</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Average patient wait time', value: `${data.kpis.avgWaitMinutes} min` },
            { label: 'Bed occupancy rate', value: `${data.kpis.bedOccupancy}%` },
            { label: 'Cancellation rate', value: `${((data.kpis.appointments > 0 ? Number(data.appointments.reduce((a, p) => a + Number(p.cancelled), 0)) : 0) / Math.max(1, data.kpis.appointments) * 100).toFixed(1)}%` },
          ].map((h) => (
            <div key={h.label} className="rounded-lg border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{h.label}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{h.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
