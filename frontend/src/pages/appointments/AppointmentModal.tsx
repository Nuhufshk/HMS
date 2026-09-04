import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarPlus, CalendarClock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Textarea } from '@/components/ui/Form';
import { DatePicker } from '@/components/ui/DatePicker';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { appointmentService } from '@/services/appointmentService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { APPOINTMENT_TYPES, TIME_SLOTS } from '@/constants/options';
import type { Appointment, AppointmentType } from '@/types';
import { todayISO } from '@/utils/date';

export interface AppointmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  appointment?: Appointment | null;
  defaultPatientId?: string;
  defaultDate?: string;
}

interface FormState {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type: AppointmentType | '';
  reason: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export function AppointmentFormModal({ open, onClose, onSaved, appointment, defaultPatientId, defaultDate }: AppointmentFormModalProps) {
  const { toast } = useToast();
  const { data: patients } = useAsyncData(() => patientService.getPatients(), []);
  const { data: doctors } = useAsyncData(() => doctorService.getDoctors(), []);

  const [form, setForm] = useState<FormState>({
    patientId: '',
    doctorId: '',
    date: '',
    time: '09:00',
    type: '',
    reason: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (appointment) {
      setForm({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        date: appointment.date,
        time: appointment.time,
        type: appointment.type,
        reason: appointment.reason,
        notes: appointment.notes ?? '',
      });
    } else {
      setForm({
        patientId: defaultPatientId ?? '',
        doctorId: '',
        date: defaultDate ?? todayISO(),
        time: '09:00',
        type: '',
        reason: '',
        notes: '',
      });
    }
  }, [open, appointment, defaultPatientId, defaultDate]);

  const selectedDoctor = useMemo(() => doctors?.find((d) => d.id === form.doctorId), [doctors, form.doctorId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.patientId) next.patientId = 'Select a patient';
    if (!form.doctorId) next.doctorId = 'Select a doctor';
    if (!form.date) next.date = 'Pick a date';
    else if (form.date < todayISO() && !appointment) next.date = 'Date cannot be in the past';
    if (!form.time) next.time = 'Pick a time';
    if (!form.type) next.type = 'Select an appointment type';
    if (!form.reason.trim()) next.reason = 'Reason is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const fields = {
        patientId: form.patientId,
        doctorId: form.doctorId,
        departmentId: selectedDoctor?.departmentId ?? 'GEN',
        date: form.date,
        time: form.time,
        type: form.type as AppointmentType,
        reason: form.reason.trim(),
        notes: form.notes.trim() || undefined,
      };
      if (appointment) {
        await appointmentService.updateAppointment(appointment.id, fields);
        toast({ title: 'Appointment updated', description: `${appointment.id} was updated successfully.`, variant: 'success' });
      } else {
        const created = await appointmentService.createAppointment({ ...fields, status: 'scheduled' });
        toast({ title: 'Appointment scheduled', description: `${created.id} booked for ${created.date} at ${created.time}.`, variant: 'success' });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Could not save appointment', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={appointment ? 'Edit appointment' : 'Schedule appointment'}
      description={appointment ? `Updating ${appointment.id}` : 'Book a new appointment for a patient'}
      size="lg"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="appointment-form" loading={saving} icon={appointment ? <CalendarClock className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}>
            {appointment ? 'Save changes' : 'Schedule appointment'}
          </Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Patient" required error={errors.patientId} className="sm:col-span-2">
          <Select value={form.patientId} onChange={(e) => set('patientId', e.target.value)} placeholder="Select patient" error={!!errors.patientId}>
            {patients?.map((p) => (
              <option key={p.id} value={p.id}>{p.id} — {p.firstName} {p.lastName}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Doctor" required error={errors.doctorId}>
          <Select value={form.doctorId} onChange={(e) => set('doctorId', e.target.value)} placeholder="Select doctor" error={!!errors.doctorId}>
            {doctors?.filter((d) => d.status === 'active').map((d) => (
              <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Department" hint={selectedDoctor ? undefined : 'Set automatically from the doctor'}>
          <Input value={selectedDoctor?.departmentName ?? 'Auto'} disabled />
        </FormField>
        <FormField label="Date" required error={errors.date}>
          <DatePicker value={form.date} onChange={(e) => set('date', e.target.value)} min={appointment ? undefined : todayISO()} />
        </FormField>
        <FormField label="Time" required error={errors.time}>
          <Select value={form.time} onChange={(e) => set('time', e.target.value)} error={!!errors.time}>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Appointment type" required error={errors.type} className="sm:col-span-2">
          <Select value={form.type} onChange={(e) => set('type', e.target.value as AppointmentType)} placeholder="Select type" error={!!errors.type}>
            {APPOINTMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Reason for visit" required error={errors.reason} className="sm:col-span-2">
          <Textarea rows={2} value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="e.g. Persistent headache and dizziness" error={!!errors.reason} />
        </FormField>
        <FormField label="Notes" className="sm:col-span-2">
          <Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional internal notes" />
        </FormField>
      </form>
    </Modal>
  );
}
