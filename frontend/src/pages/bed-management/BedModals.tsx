import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRightLeft,
  BedDouble,
  DoorOpen,
  History,
  KeyRound,
  Plus,
  UserRoundPlus,
  Wrench,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { FormField, Input, Select, Textarea } from '@/components/ui/Form';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { bedService } from '@/services/bedService';
import { useToast } from '@/context/ToastContext';
import type { Department, EnrichedBed, EnrichedBedAssignment, WardInput, WardStats } from '@/types';
import { formatCurrency } from '@/utils/format';
import { formatDateTime } from '@/utils/date';

/* --------------------------- Bed detail modal --------------------------- */

interface BedDetailModalProps {
  bed: EnrichedBed | null;
  onClose: () => void;
  onAssign?: (bed: EnrichedBed) => void;
  onTransfer?: (bed: EnrichedBed) => void;
  onDischarge?: (bed: EnrichedBed) => void;
  onMaintenance?: (bed: EnrichedBed) => void;
  onRestore?: (bed: EnrichedBed) => void;
}

export function BedDetailModal({ bed, onClose, onAssign, onTransfer, onDischarge, onMaintenance, onRestore }: BedDetailModalProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<EnrichedBedAssignment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!bed) return;
    setHistory([]);
    setLoadingHistory(true);
    bedService
      .getBedHistory(bed.id)
      .then(setHistory)
      .catch((err) => toast({ title: 'Could not load history', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' }))
      .finally(() => setLoadingHistory(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bed?.id, bed?.status]);

  if (!bed) return null;

  return (
    <Modal
      open={!!bed}
      onClose={onClose}
      title={`Bed ${bed.number}`}
      description={bed.wardName}
      size="lg"
      footer={
        <div className="flex w-full flex-wrap justify-between gap-2">
          <div className="flex items-center gap-2">
            {bed.status === 'available' && onMaintenance && (
              <Button variant="outline" icon={<Wrench className="h-4 w-4" />} onClick={() => onMaintenance(bed)}>
                Put out of service
              </Button>
            )}
            {bed.status === 'maintenance' && onRestore && (
              <Button variant="outline" icon={<KeyRound className="h-4 w-4" />} onClick={() => onRestore(bed)}>
                Restore to service
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="destructive" onClick={onClose}>Close</Button>
            {bed.status === 'available' && onAssign && (
              <Button icon={<Plus className="h-4 w-4" />} onClick={() => onAssign(bed)}>
                Assign patient
              </Button>
            )}
            {bed.status === 'occupied' && onTransfer && (
              <Button variant="outline" icon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => onTransfer(bed)}>
                Transfer
              </Button>
            )}
            {bed.status === 'occupied' && onDischarge && (
              <Button variant="destructive" icon={<DoorOpen className="h-4 w-4" />} onClick={() => onDischarge(bed)}>
                Discharge patient
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Overview */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <BedDouble className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-bold text-foreground">{bed.number}</p>
              <p className="text-xs text-muted-foreground">{bed.wardName}</p>
            </div>
          </div>
          <StatusBadge status={bed.status} />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {[
            ['Ward', bed.wardName],
            ['Bed type', bed.type],
            ['Rate / night', formatCurrency(bed.ratePerDay)],
            ['Bed ID', bed.id],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-border/70 pb-2">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>

        {/* Current patient */}
        <div className="rounded-lg bg-muted/60 p-3.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current patient</p>
          {bed.status === 'occupied' && bed.patientName ? (
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={bed.patientName} size="md" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{bed.patientName}</p>
                <p className="font-mono text-[11px] text-muted-foreground">{bed.patientId}</p>
                {bed.occupiedSince && <p className="text-xs text-muted-foreground">Admitted {formatDateTime(bed.occupiedSince)}</p>}
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {bed.status === 'maintenance' ? 'Bed is out of service for maintenance.' : 'No patient currently assigned.'}
            </p>
          )}
        </div>

        {/* History */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <History className="h-3.5 w-3.5" aria-hidden />
            Admission history
          </div>
          {loadingHistory ? (
            <LoadingState label="Loading history…" />
          ) : history.length === 0 ? (
            <EmptyState icon={<History className="h-5 w-5" />} title="No admissions yet" />
          ) : (
            <ul className="max-h-52 space-y-2.5 overflow-y-auto pr-1">
              {history.map((a) => (
                <li key={a.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{a.patientName}</p>
                    <StatusBadge status={a.releasedAt ? 'discharged' : 'occupied'} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(a.assignedAt)}
                    {a.releasedAt ? ` → ${formatDateTime(a.releasedAt)}` : ' · currently admitted'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* --------------------------- Assign patient modal --------------------------- */

interface AssignPatientModalProps {
  bed: EnrichedBed | null;
  patients: { id: string; firstName: string; lastName: string }[];
  onClose: () => void;
  onSaved: () => void;
}

export function AssignPatientModal({ bed, patients, onClose, onSaved }: AssignPatientModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bed) return;
    setPatientId('');
    setNotes('');
    setError('');
  }, [bed]);

  if (!bed) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError('Select a patient to assign.');
      return;
    }
    setSaving(true);
    try {
      const result = await bedService.assignBed(bed.id, patientId, notes || undefined);
      toast({ title: 'Patient admitted', description: `${result.patientName} is now on ${bed.number}.`, variant: 'success' });
      onSaved();
    } catch (err) {
      toast({ title: 'Could not assign bed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!bed}
      onClose={onClose}
      title={`Assign patient — ${bed.number}`}
      description={bed.wardName}
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="assign-bed-form" loading={saving} icon={<UserRoundPlus className="h-4 w-4" />}>
            Assign patient
          </Button>
        </>
      }
    >
      <form id="assign-bed-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4">
        <FormField label="Patient" required error={error}>
          <Select value={patientId} onChange={(e) => { setPatientId(e.target.value); setError(''); }} error={!!error}>
            <option value="" disabled>Select patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.id})</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Admission notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Reason for admission…" />
        </FormField>
      </form>
    </Modal>
  );
}

/* --------------------------- Transfer bed modal --------------------------- */

interface TransferBedModalProps {
  bed: EnrichedBed | null;
  beds: EnrichedBed[];
  wards?: WardStats[];
  onClose: () => void;
  onSaved: () => void;
}

export function TransferBedModal({ bed, beds, onClose, onSaved }: TransferBedModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bed) return;
    setTargetId('');
    setError('');
  }, [bed]);

  const targets = (beds ?? []).filter((b) => b.status === 'available' && b.id !== bed?.id);

  if (!bed) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetId) {
      setError('Select a target bed.');
      return;
    }
    setSaving(true);
    try {
      const result = await bedService.transferBed(bed.id, targetId);
      toast({
        title: 'Patient transferred',
        description: `${bed.patientName ?? 'Patient'} moved from ${bed.number} to ${result.number}.`,
        variant: 'success',
      });
      onSaved();
    } catch (err) {
      toast({ title: 'Could not transfer bed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!bed}
      onClose={onClose}
      title={`Transfer patient — ${bed.number}`}
      description={bed.patientName ? `Moving ${bed.patientName}` : undefined}
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="transfer-bed-form" loading={saving} icon={<ArrowRightLeft className="h-4 w-4" />}>
            Transfer patient
          </Button>
        </>
      }
    >
      <form id="transfer-bed-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4">
        <FormField label="Target bed" required error={error} hint="Only available beds are shown.">
          <Select value={targetId} onChange={(e) => { setTargetId(e.target.value); setError(''); }} error={!!error}>
            <option value="" disabled>Select target bed…</option>
            {targets.map((b) => (
              <option key={b.id} value={b.id}>{b.number} — {b.wardName}</option>
            ))}
          </Select>
        </FormField>
      </form>
    </Modal>
  );
}

/* --------------------------- Maintenance modal --------------------------- */

interface MaintenanceBedModalProps {
  bed: EnrichedBed | null;
  onClose: () => void;
  onSaved: () => void;
}

export function MaintenanceBedModal({ bed, onClose, onSaved }: MaintenanceBedModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (!bed) return;
    setSaving(true);
    try {
      await bedService.setMaintenance(bed.id, true);
      toast({ title: 'Bed out of service', description: `${bed.number} is now under maintenance.`, variant: 'success' });
      onSaved();
    } catch (err) {
      toast({ title: 'Could not update bed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!bed}
      onClose={onClose}
      title={`Put ${bed?.number ?? ''} out of service?`}
      size="sm"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="outline" onClick={confirm} loading={saving} icon={<Wrench className="h-4 w-4" />}>
            Put out of service
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        Bed {bed?.number} ({bed?.wardName}) will be marked as under maintenance and cannot be assigned until it is restored to service.
      </p>
    </Modal>
  );
}

/* ------------------------------ Add ward modal ------------------------------ */

interface AddWardModalProps {
  open: boolean;
  departments: Department[];
  onClose: () => void;
  onSaved: (ward: WardStats) => void;
}

export function AddWardModal({ open, departments, onClose, onSaved }: AddWardModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<WardInput & { name: string }>({
    name: '',
    location: '',
    departmentId: '',
    totalBeds: 10,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm({ name: '', location: '', departmentId: departments[0]?.id ?? '', totalBeds: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, departments]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Ward name is required';
    if (!form.departmentId) errs.departmentId = 'Department is required';
    if (!form.totalBeds || form.totalBeds < 1) errs.totalBeds = 'Enter at least 1 bed';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const ward = await bedService.createWard({
        name: form.name.trim(),
        location: form.location.trim(),
        departmentId: form.departmentId,
        totalBeds: Number(form.totalBeds),
      });
      onSaved(ward);
    } catch (err) {
      toast({ title: 'Could not create ward', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add ward"
      description="Create a ward and its beds in one step."
      size="lg"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="add-ward-form" loading={saving} icon={<Plus className="h-4 w-4" />}>
            Create ward
          </Button>
        </>
      }
    >
      <form id="add-ward-form" onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Ward name" required error={errors.name} className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Renal Dialysis Unit" error={!!errors.name} />
        </FormField>
        <FormField label="Location" className="sm:col-span-2">
          <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Second Floor, Block B" />
        </FormField>
        <FormField label="Department" required error={errors.departmentId}>
          <Select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} error={!!errors.departmentId}>
            <option value="" disabled>Select department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Number of beds" required error={errors.totalBeds}>
          <Input type="number" min={1} value={form.totalBeds} onChange={(e) => setForm((f) => ({ ...f, totalBeds: Number(e.target.value) }))} error={!!errors.totalBeds} />
        </FormField>
      </form>
    </Modal>
  );
}
