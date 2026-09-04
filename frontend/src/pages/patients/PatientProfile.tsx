import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  Pencil,
  Receipt,
  ShieldPlus,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MetricCard } from '@/components/common/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, EmptyState, LoadingState } from '@/components/ui/States';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { prescriptionService } from '@/services/prescriptionService';
import { laboratoryService } from '@/services/laboratoryService';
import { medicalRecordService } from '@/services/medicalRecordService';
import { billingService } from '@/services/billingService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { PatientFormModal } from './PatientForm';
import { ageFromDateOfBirth, formatDate, formatTime } from '@/utils/date';
import { formatCurrency } from '@/utils/format';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

const RECORD_TYPE_META: Record<string, { label: string; className: string }> = {
  diagnosis: { label: 'Diagnosis', className: 'bg-destructive-soft text-destructive-strong' },
  vitals: { label: 'Vital signs', className: 'bg-info-soft text-info-strong' },
  treatment: { label: 'Treatment plan', className: 'bg-primary-soft text-primary-strong' },
  note: { label: 'Clinical note', className: 'bg-muted text-muted-foreground' },
  history: { label: 'History', className: 'bg-processing-soft text-processing-strong' },
};

export function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState('overview');
  const [editOpen, setEditOpen] = useState(false);

  const patientReq = useAsyncData(() => patientService.getPatientById(id ?? ''), [id]);
  const recordsReq = useAsyncData(() => medicalRecordService.getMedicalRecordsByPatient(id ?? ''), [id]);
  const appointmentsReq = useAsyncData(() => appointmentService.getAppointmentsByPatient(id ?? ''), [id]);
  const prescriptionsReq = useAsyncData(() => prescriptionService.getPrescriptionsByPatient(id ?? ''), [id]);
  const labsReq = useAsyncData(() => laboratoryService.getLabTestsByPatient(id ?? ''), [id]);
  const invoicesReq = useAsyncData(() => billingService.getInvoicesByPatient(id ?? ''), [id]);
  const doctorReq = useAsyncData(
    () => (patientReq.data?.assignedDoctorId ? doctorService.getDoctorById(patientReq.data.assignedDoctorId) : Promise.resolve(null)),
    [patientReq.data?.assignedDoctorId],
  );

  const patient = patientReq.data;
  const loading = patientReq.loading;
  const error = patientReq.error;

  const stats = useMemo(() => {
    if (!patient) return null;
    return {
      appointments: appointmentsReq.data?.length ?? 0,
      prescriptions: prescriptionsReq.data?.length ?? 0,
      labTests: labsReq.data?.length ?? 0,
      invoices: invoicesReq.data?.length ?? 0,
      outstanding: (invoicesReq.data ?? []).reduce((s, i) => s + i.balance, 0),
    };
  }, [patient, appointmentsReq.data, prescriptionsReq.data, labsReq.data, invoicesReq.data]);

  if (loading) return <LoadingState label="Loading patient profile…" />;
  if (error || !patient) {
    return (
      <div>
        <PageHeader title="Patient profile" />
        <ErrorState title="Patient not found" message={error ?? `No patient exists with ID ${id}.`} onRetry={patientReq.reload} />
      </div>
    );
  }

  const fullName = `${patient.firstName} ${patient.lastName}`;
  const age = ageFromDateOfBirth(patient.dateOfBirth);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Medical History', count: recordsReq.data?.length },
    { id: 'appointments', label: 'Appointments', count: appointmentsReq.data?.length },
    { id: 'prescriptions', label: 'Prescriptions', count: prescriptionsReq.data?.length },
    { id: 'lab', label: 'Laboratory Results', count: labsReq.data?.length },
    { id: 'billing', label: 'Billing', count: invoicesReq.data?.length },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div>
      <PageHeader
        title="Patient profile"
        backTo="/patients"
        backLabel="All patients"
        actions={
          <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
            Edit patient
          </Button>
        }
      />

      {/* Profile header */}
      <Card className="mb-5">
        <CardContent className="pt-8">
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-start">
            <Avatar name={fullName} size="xl" className="shrink-0" />
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{fullName}</h2>
              <StatusBadge status={patient.status} />
              <Badge variant="outline" className="font-mono">{patient.id}</Badge>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 md:grid-cols-2">
              <DetailRow label="Patient ID" value={patient.id} />
              <DetailRow label="Gender" value={patient.gender} />
              <DetailRow label="Age" value={`${age} years`} />
              <DetailRow label="Date of birth" value={formatDate(patient.dateOfBirth)} />
              <DetailRow label="Nationality" value={patient.nationality} />
              <DetailRow label="Blood group" value={patient.bloodGroup} />
              <DetailRow label="Genotype" value={patient.genotype} />
              <DetailRow label="Phone" value={patient.phone} />
              {patient.email && <DetailRow label="Email" value={patient.email} />}
              <DetailRow label="City" value={patient.city} />
              <DetailRow label="Address" value={`${patient.address}, ${patient.city}`} />
              <DetailRow
                label="Insurance"
                value={patient.insurance ? `${patient.insurance.provider} · ${patient.insurance.number}` : 'Self-pay (no insurance)'}
              />
              <DetailRow label="Patient type" value={patient.type === 'new' ? 'New patient' : 'Returning patient'} />
              <DetailRow label="Registered" value={formatDate(patient.registrationDate)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Appointments" value={stats?.appointments ?? '—'} icon={CalendarDays} tone="primary" />
        <MetricCard label="Prescriptions" value={stats?.prescriptions ?? '—'} icon={ClipboardList} tone="info" />
        <MetricCard label="Lab tests" value={stats?.labTests ?? '—'} icon={FlaskConical} tone="processing" />
        <MetricCard label="Outstanding" value={stats ? formatCurrency(stats.outstanding) : '—'} icon={Receipt} tone="warning" />
      </div>

      {/* Allergies alert */}
      {patient.allergies.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-strong" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-warning-strong">Allergy alert</p>
            <p className="text-sm text-warning-strong/90">
              This patient is allergic to: {patient.allergies.join(', ')}.
            </p>
          </div>
        </div>
      )}

      <Tabs items={tabs} value={tab} onChange={setTab} className="mb-5" />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Clinical summary</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <section>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Stethoscope className="h-3.5 w-3.5" aria-hidden /> Conditions
                </h4>
                {patient.conditions.length ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.conditions.map((c) => <Badge key={c} variant="warning">{c}</Badge>)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No chronic conditions on record.</p>
                )}
              </section>
              <section>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ShieldPlus className="h-3.5 w-3.5" aria-hidden /> Insurance
                </h4>
                {patient.insurance ? (
                  <p className="text-sm text-foreground">
                    {patient.insurance.provider} — policy {patient.insurance.number}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No insurance — patient pays out of pocket.</p>
                )}
              </section>
              <section>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" aria-hidden /> Emergency contact
                </h4>
                <p className="text-sm text-foreground">
                  {patient.emergencyContact.name}
                  <span className="text-muted-foreground"> ({patient.emergencyContact.relationship})</span> —{' '}
                  <span className="font-medium">{patient.emergencyContact.phone}</span>
                </p>
              </section>
              <section>
                <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Assigned doctor
                </h4>
                {doctorReq.data ? (
                  <Link to={`/doctors/${doctorReq.data.id}`} className="text-sm font-medium text-primary-strong hover:text-primary-hover">
                    {doctorReq.data.name} — {doctorReq.data.specialization}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">No doctor assigned yet.</p>
                )}
              </section>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'history' && (
        <Card>
          <CardContent className="pt-5">
            {recordsReq.loading ? (
              <LoadingState />
            ) : recordsReq.data?.length ? (
              <ol className="relative space-y-5 border-l border-border pl-5">
                {recordsReq.data.map((r) => (
                  <li key={r.id} className="relative">
                    <span className="absolute -left-[26.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" aria-hidden />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={RECORD_TYPE_META[r.type]?.className}>{RECORD_TYPE_META[r.type]?.label ?? r.type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(r.date.slice(0, 10))} · {r.doctorName}</span>
                    </div>
                    <h4 className="mt-1.5 text-sm font-semibold text-foreground">{r.title}</h4>
                    <p className="mt-0.5 text-sm text-muted-foreground">{r.description}</p>
                    {r.diagnosis && (
                      <p className="mt-1.5 text-sm"><span className="font-medium text-foreground">Diagnosis:</span> <span className="text-muted-foreground">{r.diagnosis}</span></p>
                    )}
                    {r.symptoms && r.symptoms.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {r.symptoms.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                      </div>
                    )}
                    {r.treatmentPlan && (
                      <p className="mt-1.5 text-sm"><span className="font-medium text-foreground">Plan:</span> <span className="text-muted-foreground">{r.treatmentPlan}</span></p>
                    )}
                    {r.notes && <p className="mt-1.5 text-sm italic text-muted-foreground">“{r.notes}”</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="No medical history" description="Diagnoses, notes and treatment plans will appear here." />
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'appointments' && (
        <Card>
          <CardContent className="pt-5">
            {appointmentsReq.loading ? (
              <LoadingState />
            ) : appointmentsReq.data?.length ? (
              <ul className="divide-y divide-border">
                {appointmentsReq.data.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="w-40 shrink-0 text-sm font-medium text-foreground">{formatDate(a.date)}</span>
                    <span className="w-16 shrink-0 text-sm text-muted-foreground">{formatTime(a.time)}</span>
                    <span className="min-w-0 flex-1 text-sm text-muted-foreground">{a.doctorName} · {a.departmentName}</span>
                    <span className="hidden text-xs text-muted-foreground md:inline">{a.reason}</span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No appointments" description="Book an appointment for this patient to see it here." />
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'prescriptions' && (
        <Card>
          <CardContent className="pt-5">
            {prescriptionsReq.loading ? (
              <LoadingState />
            ) : prescriptionsReq.data?.length ? (
              <ul className="divide-y divide-border">
                {prescriptionsReq.data.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {p.id} <span className="font-normal text-muted-foreground">· {formatDate(p.date)} · {p.doctorName}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{p.diagnosis}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.medications.map((m) => m.name).join('; ')}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="No prescriptions" description="Prescriptions written for this patient will appear here." />
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'lab' && (
        <Card>
          <CardContent className="pt-5">
            {labsReq.loading ? (
              <LoadingState />
            ) : labsReq.data?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Test</th>
                      <th className="px-3 py-2">Ordered</th>
                      <th className="px-3 py-2">Priority</th>
                      <th className="px-3 py-2">Result</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labsReq.data.map((t) => (
                      <tr key={t.id} className="border-b border-border/70 last:border-0">
                        <td className="px-3 py-2.5 text-sm text-foreground">{t.testName}</td>
                        <td className="px-3 py-2.5 text-sm text-muted-foreground">{formatDate(t.orderedDate)}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={t.priority} /></td>
                        <td className="px-3 py-2.5">
                          {t.result ? (
                            <span className={cn('text-sm font-medium', t.abnormal ? 'text-destructive-strong' : 'text-success-strong')}>
                              {t.result} {t.unit}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={<FlaskConical className="h-6 w-6" />} title="No laboratory tests" description="Tests ordered for this patient will appear here." />
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'billing' && (
        <Card>
          <CardContent className="pt-5">
            {invoicesReq.loading ? (
              <LoadingState />
            ) : invoicesReq.data?.length ? (
              <ul className="divide-y divide-border">
                {invoicesReq.data.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{inv.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(inv.date)} · {inv.items.length} item{inv.items.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(inv.total)}</span>
                    {inv.balance > 0 && (
                      <span className="text-xs text-muted-foreground">Balance {formatCurrency(inv.balance)}</span>
                    )}
                    <StatusBadge status={inv.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<Receipt className="h-6 w-6" />} title="No invoices" description="Invoices for this patient will appear here." />
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'notes' && (
        <Card>
          <CardContent className="pt-5">
            {(recordsReq.data ?? []).filter((r) => r.type === 'note').length ? (
              <ul className="divide-y divide-border">
                {recordsReq.data?.filter((r) => r.type === 'note').map((r) => (
                  <li key={r.id} className="py-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {r.title}
                      <span className="text-xs font-normal text-muted-foreground">{formatDate(r.date.slice(0, 10))} · {r.doctorName}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                    {r.notes && <p className="mt-1 text-sm italic text-muted-foreground">“{r.notes}”</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<Activity className="h-6 w-6" />} title="No clinical notes" description="Notes added by doctors and nurses will appear here." />
            )}
          </CardContent>
        </Card>
      )}

      <PatientFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        patient={patient}
        onSaved={() => {
          patientReq.reload();
        }}
      />
    </div>
  );
}

/* ------------------------------ Detail row ------------------------------ */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border/70 py-1.5 last:border-0">
      <span className="text-sm font-semibold text-foreground">{label}: </span>
      <span className="text-sm text-muted-foreground">{value || '—'}</span>
    </div>
  );
}
