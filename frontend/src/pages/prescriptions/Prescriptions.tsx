import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, ClipboardPlus, Eye, Pill, Plus, Trash2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { FormField, Input, Select, Textarea } from '@/components/ui/Form';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select as SelectFilter } from '@/components/ui/Form';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { prescriptionService } from '@/services/prescriptionService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { FREQUENCIES } from '@/constants/options';
import type { EnrichedPrescription, PrescriptionMedication } from '@/types';
import { formatDate, todayISO } from '@/utils/date';

export function Prescriptions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data: prescriptions, loading, error, reload } = useAsyncData(() => prescriptionService.getPrescriptions(), []);
  const [viewing, setViewing] = useState<EnrichedPrescription | null>(null);
  const [cancelling, setCancelling] = useState<EnrichedPrescription | null>(null);
  const [dispensing, setDispensing] = useState<EnrichedPrescription | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canCreate = user?.role === 'doctor' || user?.role === 'admin';
  const canDispense = user?.role === 'pharmacist' || user?.role === 'admin';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (prescriptions ?? []).filter((p) => {
      const matchesQuery = !q || p.id.toLowerCase().includes(q) || p.patientName.toLowerCase().includes(q) || p.diagnosis.toLowerCase().includes(q);
      const matchesStatus = !status || p.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [prescriptions, search, status]);

  const confirmCancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      await prescriptionService.cancelPrescription(cancelling.id);
      toast({ title: 'Prescription cancelled', description: `${cancelling.id} was cancelled.`, variant: 'info' });
      reload();
      setCancelling(null);
    } catch (err) {
      toast({ title: 'Could not cancel', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const confirmDispense = async () => {
    if (!dispensing) return;
    setBusy(true);
    try {
      await prescriptionService.dispensePrescription(dispensing.id);
      toast({ title: 'Prescription dispensed', description: `${dispensing.id} was dispensed to ${dispensing.patientName}.`, variant: 'success' });
      reload();
      setDispensing(null);
    } catch (err) {
      toast({ title: 'Could not dispense', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<EnrichedPrescription>[] = [
    { key: 'id', header: 'Prescription ID', sortable: true, render: (p) => <span className="font-mono text-xs text-muted-foreground">{p.id}</span> },
    {
      key: 'patientName',
      header: 'Patient',
      sortable: true,
      render: (p) => (
        <button onClick={() => navigate(`/patients/${p.patientId}`)} className="font-medium text-foreground transition-colors hover:text-primary-strong">
          {p.patientName}
        </button>
      ),
    },
    { key: 'doctorName', header: 'Doctor', sortable: true, render: (p) => <span className="text-muted-foreground">{p.doctorName}</span> },
    { key: 'date', header: 'Date', sortable: true, render: (p) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(p.date)}</span> },
    { key: 'diagnosis', header: 'Diagnosis', sortable: true, render: (p) => <span className="max-w-44 truncate text-muted-foreground">{p.diagnosis}</span> },
    {
      key: 'meds',
      header: 'Medications',
      render: (p) => (
        <div className="leading-tight">
          <p className="text-foreground">{p.medications.length} item{p.medications.length === 1 ? '' : 's'}</p>
          <p className="max-w-56 truncate text-xs text-muted-foreground">{p.medications.map((m) => m.name).join('; ')}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', sortable: true, render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="outline" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setViewing(p)}>
            View
          </Button>
          {canDispense && p.status === 'active' && (
            <Button size="sm" icon={<ClipboardCheck className="h-3.5 w-3.5" />} onClick={() => setDispensing(p)}>
              Dispense
            </Button>
          )}
          {(canCreate || canDispense) && p.status === 'active' && (
            <Button size="sm" variant="destructive" icon={<XCircle className="h-3.5 w-3.5" />} onClick={() => setCancelling(p)} aria-label={`Cancel ${p.id}`}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        description="Medication orders written by doctors, ready for pharmacy dispensing."
        actions={
          canCreate ? (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              New prescription
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <div className="flex w-full flex-wrap items-center gap-3">
            <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search by ID, patient or diagnosis…" className="w-full sm:w-72" />
            <SelectFilter value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="dispensed">Dispensed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </SelectFilter>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(p) => p.id}
              loading={loading}
              pageSize={9}
              empty={<EmptyState icon={<ClipboardPlus className="h-6 w-6" />} title="No prescriptions found" description="Try adjusting your search or filters." />}
            />
          )}
        </CardContent>
      </Card>

      {/* View modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={`Prescription ${viewing?.id ?? ''}`}
        description={viewing ? `${viewing.patientName} · ${viewing.doctorName} · ${formatDate(viewing.date)}` : undefined}
        size="lg"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={viewing.status} />
              <span className="text-sm text-muted-foreground">{viewing.diagnosis}</span>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {viewing.medications.map((m, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3">
                  <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.dosage} · {m.frequency} · {m.duration}</p>
                    {m.instructions && <p className="mt-1 text-xs italic text-muted-foreground">“{m.instructions}”</p>}
                  </div>
                </li>
              ))}
            </ul>
            {viewing.notes && <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">Notes:</span> {viewing.notes}</p>}
          </div>
        )}
      </Modal>

      <PrescriptionFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={reload} />

      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={confirmCancel}
        loading={busy}
        title="Cancel prescription"
        confirmLabel="Yes, cancel prescription"
        message={cancelling ? `Cancelling ${cancelling.id} for ${cancelling.patientName}. The pharmacy will not dispense this prescription.` : ''}
      />
      <ConfirmDialog
        open={!!dispensing}
        onClose={() => setDispensing(null)}
        onConfirm={confirmDispense}
        loading={busy}
        destructive={false}
        title="Dispense prescription"
        confirmLabel="Yes, dispense"
        message={dispensing ? `Dispense ${dispensing.id} for ${dispensing.patientName}?` : ''}
      />
    </div>
  );
}

/* --------------------------- New prescription form -------------------------- */

function PrescriptionFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const { data: patients } = useAsyncData(() => patientService.getPatients(), []);
  const { data: doctors } = useAsyncData(() => doctorService.getDoctors(), []);

  const emptyMed: PrescriptionMedication = { name: '', dosage: '', frequency: 'Twice daily', duration: '', instructions: '' };
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState<PrescriptionMedication[]>([{ ...emptyMed }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setPatientId('');
    setDoctorId(doctors?.[0]?.id ?? '');
    setDiagnosis('');
    setNotes('');
    setMedications([{ ...emptyMed }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateMed = (index: number, patch: Partial<PrescriptionMedication>) => {
    setMedications((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!patientId) errs.patientId = 'Select a patient';
    if (!diagnosis.trim()) errs.diagnosis = 'Diagnosis is required';
    const invalidMeds = medications.map((m, i) => (!m.name.trim() || !m.dosage.trim() || !m.duration.trim() ? i : -1)).filter((i) => i >= 0);
    if (medications.length === 0 || medications.every((m) => !m.name.trim())) errs.medications = 'Add at least one medication';
    else if (invalidMeds.length > 0) errs.medications = `Medication row ${invalidMeds[0] + 1} is incomplete — name, dosage and duration are required.`;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await prescriptionService.createPrescription({
        patientId,
        doctorId,
        date: todayISO(),
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || undefined,
        medications: medications.filter((m) => m.name.trim()),
      });
      toast({ title: 'Prescription created', description: 'The prescription is ready for the pharmacy to dispense.', variant: 'success' });
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Could not create prescription', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New prescription"
      description="Write a prescription with one or more medications. Every medication row must be complete."
      size="xl"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="prescription-form" loading={saving} icon={<ClipboardPlus className="h-4 w-4" />}>
            Create prescription
          </Button>
        </>
      }
    >
      <form id="prescription-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Patient" required error={errors.patientId}>
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Select patient" error={!!errors.patientId}>
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>{p.id} — {p.firstName} {p.lastName}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Doctor" required>
            <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              {doctors?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Diagnosis" required error={errors.diagnosis}>
            <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Uncomplicated malaria" error={!!errors.diagnosis} />
          </FormField>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medications</p>
            <Button type="button" variant="outline" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setMedications((list) => [...list, { ...emptyMed }])}>
              Add medication
            </Button>
          </div>
          {errors.medications && (
            <p className="mb-2 rounded-md bg-destructive-soft px-3 py-2 text-xs font-medium text-destructive-strong" role="alert">
              {errors.medications}
            </p>
          )}
          <div className="space-y-3">
            {medications.map((med, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <FormField label="Medication" required className="lg:col-span-2">
                    <Input value={med.name} onChange={(e) => updateMed(i, { name: e.target.value })} placeholder="e.g. Coartem" />
                  </FormField>
                  <FormField label="Dosage" required>
                    <Input value={med.dosage} onChange={(e) => updateMed(i, { dosage: e.target.value })} placeholder="e.g. 1 tablet" />
                  </FormField>
                  <FormField label="Frequency" required>
                    <Select value={med.frequency} onChange={(e) => updateMed(i, { frequency: e.target.value })}>
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Duration" required>
                    <Input value={med.duration} onChange={(e) => updateMed(i, { duration: e.target.value })} placeholder="e.g. 5 days" />
                  </FormField>
                  <FormField label="Instructions" className="sm:col-span-2 lg:col-span-4">
                    <Input value={med.instructions} onChange={(e) => updateMed(i, { instructions: e.target.value })} placeholder="e.g. Take with food" />
                  </FormField>
                  <div className="flex items-end justify-end">
                    <Button type="button" variant="ghost" size="sm" className="text-destructive-strong hover:bg-destructive-soft" icon={<Trash2 className="h-4 w-4" />} onClick={() => setMedications((list) => list.filter((_, idx) => idx !== i))} disabled={medications.length === 1}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <FormField label="Notes">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for the pharmacist" />
        </FormField>
      </form>
    </Modal>
  );
}
