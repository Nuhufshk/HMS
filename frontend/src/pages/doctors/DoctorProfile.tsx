import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, Clock, Mail, Phone, Stethoscope, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/States';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { patientService } from '@/services/patientService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { formatDate, formatTime, todayISO } from '@/utils/date';
import { formatNumber } from '@/utils/format';

export function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const doctorReq = useAsyncData(() => doctorService.getDoctorById(id ?? ''), [id]);
  const appointmentsReq = useAsyncData(() => appointmentService.getAppointmentsByDoctor(id ?? ''), [id]);
  const patientsReq = useAsyncData(() => doctorService.getAssignedPatients(id ?? ''), [id]);

  const doctor = doctorReq.data;
  const loading = doctorReq.loading;

  // Count patients by status
  const activePatients = (patientsReq.data ?? []).filter((p) => p.status === 'active' || p.status === 'admitted').length;
  const today = todayISO();
  const todaysAppts = (appointmentsReq.data ?? []).filter((a) => a.date === today);
  const completedAppts = (appointmentsReq.data ?? []).filter((a) => a.status === 'completed').length;

  useEffect(() => {
    setTab('overview');
  }, [id]);

  if (loading) return <LoadingState label="Loading doctor profile…" />;
  if (!doctor) {
    return (
      <div>
        <PageHeader title="Doctor profile" />
        <ErrorState title="Doctor not found" message={doctorReq.error ?? `No doctor exists with ID ${id}.`} onRetry={doctorReq.reload} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Doctor profile" backTo="/doctors" backLabel="All doctors" />

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={doctor.name} size="xl" className="mx-auto sm:mx-0" />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{doctor.name}</h2>
              <StatusBadge status={doctor.status} />
              <Badge variant={doctor.availability === 'available' ? 'success' : doctor.availability === 'busy' ? 'warning' : 'neutral'} dot>
                {doctor.availability === 'available' ? 'Available' : doctor.availability === 'busy' ? 'Busy' : 'Away'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{doctor.specialization} · {doctor.departmentName}</p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground sm:justify-start">
              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" aria-hidden />{doctor.phone}</span>
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" aria-hidden />{doctor.email}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden />Joined {formatDate(doctor.joinedDate)}</span>
            </div>
          </div>
          <dl className="grid shrink-0 grid-cols-3 gap-3">
            {[
              { label: 'Patients', value: formatNumber(activePatients), icon: Users },
              { label: "Today's appts", value: formatNumber(todaysAppts.length), icon: CalendarDays },
              { label: 'Completed', value: formatNumber(completedAppts), icon: Stethoscope },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-muted px-4 py-2.5 text-center">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</dt>
                <dd className="text-lg font-bold text-foreground">{s.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'appointments', label: 'Appointments', count: appointmentsReq.data?.length },
          { id: 'patients', label: 'Assigned patients', count: patientsReq.data?.length },
        ]}
      />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>About</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{doctor.about}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Weekly schedule</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {doctor.schedule.map((slot) => (
                  <li key={slot.day} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-foreground">{slot.day}</span>
                    <span className="text-muted-foreground">{slot.hours}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'appointments' && (
        <Card>
          <CardContent className="pt-5">
            {appointmentsReq.loading ? (
              <LoadingState />
            ) : (appointmentsReq.data?.length ?? 0) === 0 ? (
              <EmptyState title="No appointments" description="Appointments for this doctor will appear here." />
            ) : (
              <ul className="divide-y divide-border">
                {appointmentsReq.data?.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => navigate(`/patients/${a.patientId}`)}
                        className="text-sm font-medium text-foreground transition-colors hover:text-primary-strong"
                      >
                        {a.patientName}
                      </button>
                      <p className="text-xs text-muted-foreground">{a.reason} · {a.departmentName}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(a.date)} · {formatTime(a.time)}</span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'patients' && (
        <Card>
          <CardContent className="pt-5">
            {patientsReq.loading ? (
              <LoadingState />
            ) : (patientsReq.data?.length ?? 0) === 0 ? (
              <EmptyState title="No assigned patients" description="Patients assigned to this doctor will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Patient</th>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Blood</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientsReq.data?.map((p) => (
                      <tr key={p.id} className="border-b border-border/70 last:border-0">
                        <td className="px-3 py-2.5">
                          <Link to={`/patients/${p.id}`} className="text-sm font-medium text-primary-strong hover:text-primary-hover">
                            {p.firstName} {p.lastName}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{p.id}</td>
                        <td className="px-3 py-2.5 text-sm text-muted-foreground">{p.phone}</td>
                        <td className="px-3 py-2.5 text-sm text-muted-foreground">{p.bloodGroup}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
