import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  Plus,
  Stethoscope,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dashboardService } from '@/services/dashboardService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { MetricCard, type MetricTone } from '@/components/common/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { AppointmentTrendChart } from '@/components/charts/AppointmentTrendChart';
import { PatientStatsChart } from '@/components/charts/PatientStatsChart';
import { formatCurrency, formatNumber } from '@/utils/format';
import { formatTime, timeAgo, todayLong } from '@/utils/date';
import { cn } from '@/utils/cn';
import { canAccess } from '@/constants/navigation';

const ACTIVITY_ICON: Record<string, string> = {
  lab: 'bg-info-soft text-info-strong',
  payment: 'bg-success-soft text-success-strong',
  patient: 'bg-primary-soft text-primary-strong',
  prescription: 'bg-processing-soft text-processing-strong',
  appointment: 'bg-info-soft text-info-strong',
  pharmacy: 'bg-warning-soft text-warning-strong',
  billing: 'bg-success-soft text-success-strong',
  system: 'bg-muted text-muted-foreground',
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsyncData(() => dashboardService.getDashboardData(user), [user?.id]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = user?.name.replace(/^Dr\.\s*/i, '').split(' ')[0] ?? 'there';

  const metrics = useMemo(
    () =>
      data
        ? [
            {
              label: 'Total Patients',
              value: formatNumber(data.metrics.totalPatients),
              icon: Users,
              tone: 'primary' as MetricTone,
              description: 'Registered in the system',
              trend: { value: '+8.2%', direction: 'up' as const },
            },
            {
              label: "Today's Appointments",
              value: formatNumber(data.metrics.todaysAppointments),
              icon: CalendarDays,
              tone: 'info' as MetricTone,
              description: 'Across all departments',
              trend: { value: '+4.5%', direction: 'up' as const },
            },
            {
              label: 'Available Doctors',
              value: formatNumber(data.metrics.availableDoctors),
              icon: Stethoscope,
              tone: 'success' as MetricTone,
              description: 'On duty right now',
              trend: { value: 'Stable', direction: 'neutral' as const },
            },
            {
              label: 'Pending Lab Tests',
              value: formatNumber(data.metrics.pendingLabTests),
              icon: FlaskConical,
              tone: 'warning' as MetricTone,
              description: 'Awaiting results',
              trend: { value: '-2.1%', direction: 'down' as const },
            },
            {
              label: 'Pending Prescriptions',
              value: formatNumber(data.metrics.pendingPrescriptions),
              icon: ClipboardList,
              tone: 'processing' as MetricTone,
              description: 'Awaiting dispensing',
              trend: { value: '+1.8%', direction: 'up' as const },
            },
            {
              label: "Today's Revenue",
              value: formatCurrency(data.metrics.todayRevenue),
              icon: Wallet,
              tone: 'primary' as MetricTone,
              description: 'Payments collected today',
              trend: { value: '+12.4%', direction: 'up' as const },
            },
          ]
        : [],
    [data],
  );

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {todayLong()} · Here's what's happening at Adom Medical Centre today.
          </p>
        </div>
        {user && canAccess(user.role, '/appointments') && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/appointments?new=1')}>
            New appointment
          </Button>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} loading={loading} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Appointment overview</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">Scheduled vs completed — last 7 days</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {loading ? (
                <div className="h-full animate-pulse rounded-lg bg-muted" aria-hidden />
              ) : (
                <AppointmentTrendChart data={data?.appointmentTrend ?? []} />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Patient statistics</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">New vs returning patients — last 6 months</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {loading ? (
                <div className="h-full animate-pulse rounded-lg bg-muted" aria-hidden />
              ) : (
                <PatientStatsChart data={data?.patientStats ?? []} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's appointments + recent patients + activity */}
      {/* <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Today's appointments</CardTitle>
              {user && canAccess(user.role, '/appointments') && (
                <Link to="/appointments" className="inline-flex items-center gap-1 text-xs font-medium text-primary-strong hover:text-primary-hover">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" aria-hidden />
                ))}
              </div>
            ) : (data?.todaysAppointments.length ?? 0) === 0 ? (
              <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No appointments today" description="New bookings will appear here." />
            ) : (
              <ul className="divide-y divide-border">
                {data?.todaysAppointments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-3">
                    <span className="w-12 shrink-0 text-sm font-semibold text-foreground">{formatTime(a.time)}</span>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => navigate(`/patients/${a.patientId}`)}
                        className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary-strong"
                      >
                        {a.patientName}
                      </button>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.doctorName} · {a.departmentName}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent patients</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" aria-hidden />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data?.recentPatients.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => navigate(`/patients/${p.id}`)}
                      className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <Avatar name={p.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.id} · {p.bloodGroup} · {p.phone}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgo(`${p.registrationDate}T09:00:00`)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" aria-hidden />
                ))}
              </div>
            ) : (
              <ul className="space-y-4">
                {data?.recentActivity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3">
                    <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', ACTIVITY_ICON[a.type] ?? ACTIVITY_ICON.system)}>
                      <Activity className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                        {a.user} · {timeAgo(a.time)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div> */}

      {/* Error banner (retry) */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive-strong">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={reload}>
            Retry
          </Button>
        </div>
      )}

      {/* <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-success" aria-hidden />
        Figures update as you use the system — all data is stored in memory for this demo.
      </p> */}
    </div>
  );
}
