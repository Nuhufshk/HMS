import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  Activity,
  ClipboardPlus,
  FileText,
  HeartPulse,
  History,
  Plus,
  Stethoscope,
  Thermometer,
  UserRound,
  Wind,
  Droplets,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select, Textarea } from '@/components/ui/Form';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { Avatar } from '@/components/ui/Avatar';
import { medicalRecordService } from '@/services/medicalRecordService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import type { MedicalRecordInput, RecordType, VitalSigns } from '@/types';
import { ageFromDateOfBirth, dateTimeFromToday, formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';

const TYPE_META: Record<RecordType, { label: string; icon: typeof FileText; className: string }> = {
  diagnosis: { label: 'Diagnosis', icon: Stethoscope, className: 'bg-destructive-soft text-destructive-strong' },
  vitals: { label: 'Vital signs', icon: Activity, className: 'bg-info-soft text-info-strong' },
  treatment: { label: 'Treatment plan', icon: ClipboardPlus, className: 'bg-primary-soft text-primary-strong' },
  note: { label: 'Clinical note', icon: FileText, className: 'bg-muted text-muted-foreground' },
  history: { label: 'Medical history', icon: History, className: 'bg-processing-soft text-processing-strong' },
};

export function PatientMedicalRecord() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);

  const patientReq = useAsyncData(() => patientService.getPatientById(id ?? ''), [id]);
  const recordsReq = useAsyncData(() => medicalRecordService.getMedicalRecordsByPatient(id ?? ''), [id]);
  const { data: doctors } = useAsyncData(() => doctorService.getDoctors(), []);

  const patient = patientReq.data;
  const canCreate = user?.role === 'doctor' || user?.role === 'admin';

  const doctorId = useMemo(
    () => doctors?.find((d) => d.name === user?.name)?.id ?? doctors?.[0]?.id ?? '',
    [doctors, user?.name],
  );

  if (patientReq.loading) return <LoadingState label="Loading patient record…" />;
  if (patientReq.error || !patient) {
    return (
      <div>
        <PageHeader title="Medical record" backTo="/medical-records" backLabel="All patients" />
        <ErrorState title="Patient not found" message={patientReq.error ?? `No patient exists with ID ${id}.`} onRetry={patientReq.reload} />
      </div>
    );
  }

  const fullName = `${patient.firstName} ${patient.lastName}`;

  return (
    <div>
      <PageHeader
        title=""
        backTo="/medical-records"
        backLabel="All patients"
        actions={
          canCreate ? (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Add record
            </Button>
          ) : undefined
        }
      />

      {/* Patient summary */}
      <Card className="mb-5">
        <CardContent className="pt-8">
          <div className="mb-8 flex items-center justify-center gap-4 sm:justify-start">
            <Avatar name={fullName} size="xl" />
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{fullName}</h2>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 md:grid-cols-2">
              <DetailRow label="Patient ID" value={patient.id} />
              <DetailRow label="Gender" value={patient.gender} />
              <DetailRow label="Blood group" value={patient.bloodGroup} />
              <DetailRow label="Genotype" value={patient.genotype} />
              <DetailRow label="Status" value={patient.status} />
              <DetailRow label="Date of birth" value={formatDate(patient.dateOfBirth)} />
              <DetailRow label="Age" value={`${ageFromDateOfBirth(patient.dateOfBirth)} years`} />
              <DetailRow label="Nationality" value={patient.nationality} />
              <DetailRow label="Phone" value={patient.phone} />
              {patient.email && <DetailRow label="Email" value={patient.email} />}
              <DetailRow label="City" value={patient.city} />
              <DetailRow label="Address" value={`${patient.address}, ${patient.city}`} />
              <DetailRow
                label="Insurance"
                value={patient.insurance ? `${patient.insurance.provider} · ${patient.insurance.number}` : 'Self-pay (no insurance)'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Clinical timeline</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {recordsReq.data?.length ? `${recordsReq.data.length} record${(recordsReq.data?.length ?? 0) === 1 ? '' : 's'} for this patient.` : 'No records yet.'}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {recordsReq.loading ? (
            <LoadingState />
          ) : recordsReq.error ? (
            <ErrorState message={recordsReq.error} onRetry={recordsReq.reload} />
          ) : (recordsReq.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No records yet"
              description={canCreate ? 'Add the first diagnosis, note or vitals entry for this patient.' : 'Diagnoses, notes and treatment plans will appear here.'}
            />
          ) : (
            <ol className="relative space-y-6 border-l border-border pl-5">
              {recordsReq.data?.map((r) => {
                const meta = TYPE_META[r.type];
                const Icon = meta?.icon ?? FileText;
                return (
                  <li key={r.id} className="relative">
                    <span className={cn('absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background', meta?.className ?? 'bg-muted text-muted-foreground')}>
                      <Icon className="h-2.5 w-2.5" aria-hidden />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={meta?.className}>{meta?.label ?? r.type}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(r.date.slice(0, 10))} · {r.doctorName}</span>
                    </div>
                    <h4 className="mt-1.5 text-sm font-semibold text-foreground">{r.title}</h4>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{r.description}</p>

                    {r.diagnosis && (
                      <p className="mt-2 text-sm"><span className="font-medium text-foreground">Diagnosis:</span> <span className="text-muted-foreground">{r.diagnosis}</span></p>
                    )}

                    {r.symptoms && r.symptoms.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.symptoms.map((s) => (
                          <Badge key={s} variant="outline">{s}</Badge>
                        ))}
                      </div>
                    )}

                    {r.vitals && <VitalsGrid vitals={r.vitals} />}

                    {r.treatmentPlan && (
                      <p className="mt-2 text-sm"><span className="font-medium text-foreground">Treatment plan:</span> <span className="text-muted-foreground">{r.treatmentPlan}</span></p>
                    )}
                    {r.notes && <p className="mt-2 text-sm italic text-muted-foreground">“{r.notes}”</p>}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <RecordFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        patientId={id ?? ''}
        doctorId={doctorId}
        onSaved={() => {
          recordsReq.reload();
          toast({ title: 'Record added', description: 'The patient timeline has been updated.', variant: 'success' });
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

/* ------------------------------ Vitals grid ------------------------------ */

function VitalsGrid({ vitals }: { vitals: VitalSigns }) {
  const items = [
    { icon: Activity, label: 'Blood pressure', value: vitals.bloodPressure, unit: 'mmHg' },
    { icon: HeartPulse, label: 'Heart rate', value: vitals.heartRate, unit: 'bpm' },
    { icon: Thermometer, label: 'Temperature', value: vitals.temperature, unit: '°C' },
    { icon: Wind, label: 'Respiratory rate', value: vitals.respiratoryRate, unit: '/min' },
    { icon: Droplets, label: 'SpO₂', value: vitals.oxygenSaturation, unit: '%' },
    { icon: UserRound, label: 'Weight', value: vitals.weight, unit: 'kg' },
    { icon: UserRound, label: 'Height', value: vitals.height, unit: 'cm' },
  ];
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {items.map(({ icon: Icon, label, value, unit }) => (
        <div key={label} className="rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-center">
          <Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">{unit}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- Add record modal --------------------------- */

function RecordFormModal({
  open,
  onClose,
  onSaved,
  patientId,
  doctorId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  patientId: string;
  doctorId: string;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'note' as RecordType,
    title: '',
    description: '',
    diagnosis: '',
    symptoms: '',
    treatmentPlan: '',
    notes: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm({ type: 'note', title: '', description: '', diagnosis: '', symptoms: '', treatmentPlan: '', notes: '', bloodPressure: '', heartRate: '', temperature: '', respiratoryRate: '', oxygenSaturation: '', weight: '', height: '' });
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim() && !form.diagnosis.trim()) errs.description = 'Add a description or diagnosis';
    if (form.type === 'vitals') {
      if (!form.bloodPressure.trim()) errs.bloodPressure = 'Required for vitals';
      if (!form.heartRate.trim()) errs.heartRate = 'Required for vitals';
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const vitals =
        form.type === 'vitals'
          ? {
              bloodPressure: form.bloodPressure.trim(),
              heartRate: Number(form.heartRate),
              temperature: Number(form.temperature || 0),
              respiratoryRate: Number(form.respiratoryRate || 0),
              oxygenSaturation: Number(form.oxygenSaturation || 0),
              weight: Number(form.weight || 0),
              height: Number(form.height || 0),
            }
          : undefined;

      const input: MedicalRecordInput = {
        patientId,
        doctorId,
        date: dateTimeFromToday(0),
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        diagnosis: form.diagnosis.trim() || undefined,
        symptoms: form.symptoms.split(',').map((s) => s.trim()).filter(Boolean),
        treatmentPlan: form.treatmentPlan.trim() || undefined,
        notes: form.notes.trim() || undefined,
        vitals,
      };
      await medicalRecordService.createMedicalRecord(input);
      toast({ title: 'Record added', description: `“${form.title}” was added to the patient timeline.`, variant: 'success' });
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Could not add record', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add medical record"
      description="Document a diagnosis, clinical note, vitals entry or treatment plan."
      size="lg"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="record-form" loading={saving} icon={<FileText className="h-4 w-4" />}>
            Add record
          </Button>
        </>
      }
    >
      <form id="record-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Record type" required>
          <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RecordType }))}>
            <option value="diagnosis">Diagnosis</option>
            <option value="vitals">Vital signs</option>
            <option value="treatment">Treatment plan</option>
            <option value="note">Clinical note</option>
            <option value="history">Medical history</option>
          </Select>
        </FormField>
        <FormField label="Title" required error={errors.title}>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Hypertension review" error={!!errors.title} />
        </FormField>
        <FormField label="Description" required error={errors.description} className="sm:col-span-2">
          <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief summary of the encounter" error={!!errors.description} />
        </FormField>
        <FormField label="Diagnosis" className="sm:col-span-2">
          <Input value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} placeholder="Formal diagnosis, if applicable" />
        </FormField>
        <FormField label="Symptoms" hint="Comma-separated" className="sm:col-span-2">
          <Input value={form.symptoms} onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))} placeholder="e.g. Headache, Dizziness" />
        </FormField>

        {form.type === 'vitals' && (
          <>
            <FormField label="Blood pressure (mmHg)" required error={errors.bloodPressure}>
              <Input value={form.bloodPressure} onChange={(e) => setForm((f) => ({ ...f, bloodPressure: e.target.value }))} placeholder="120/80" error={!!errors.bloodPressure} />
            </FormField>
            <FormField label="Heart rate (bpm)" required error={errors.heartRate}>
              <Input type="number" value={form.heartRate} onChange={(e) => setForm((f) => ({ ...f, heartRate: e.target.value }))} placeholder="72" error={!!errors.heartRate} />
            </FormField>
            <FormField label="Temperature (°C)">
              <Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))} placeholder="36.7" />
            </FormField>
            <FormField label="Respiratory rate (/min)">
              <Input type="number" value={form.respiratoryRate} onChange={(e) => setForm((f) => ({ ...f, respiratoryRate: e.target.value }))} placeholder="16" />
            </FormField>
            <FormField label="SpO₂ (%)">
              <Input type="number" value={form.oxygenSaturation} onChange={(e) => setForm((f) => ({ ...f, oxygenSaturation: e.target.value }))} placeholder="98" />
            </FormField>
            <FormField label="Weight (kg)">
              <Input type="number" step="0.1" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} placeholder="70.5" />
            </FormField>
            <FormField label="Height (cm)">
              <Input type="number" value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} placeholder="168" />
            </FormField>
          </>
        )}

        <FormField label="Treatment plan" className="sm:col-span-2">
          <Textarea rows={2} value={form.treatmentPlan} onChange={(e) => setForm((f) => ({ ...f, treatmentPlan: e.target.value }))} placeholder="Planned interventions and follow-up" />
        </FormField>
        <FormField label="Notes" className="sm:col-span-2">
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional additional notes" />
        </FormField>
      </form>
    </Modal>
  );
}
