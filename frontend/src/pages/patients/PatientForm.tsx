import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { UserPlus, UserRoundPen } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox, FormField, Input, Select, Textarea } from '@/components/ui/Form';
import { DatePicker } from '@/components/ui/DatePicker';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { ALLERGY_QUICK_OPTIONS, BLOOD_GROUPS, GENOTYPES } from '@/constants/options';
import type { Patient, PatientInput } from '@/types';
import { cn } from '@/utils/cn';
import { todayISO } from '@/utils/date';

export interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
  patient?: Patient | null; // when editing
}

interface FormState {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | '';
  phone: string;
  email: string;
  address: string;
  city: string;
  nationality: string;
  bloodGroup: string;
  genotype: string;
  allergies: string;
  conditions: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  insuranceProvider: string;
  insuranceNumber: string;
  hasInsurance: boolean;
  assignedDoctorId: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  nationality: 'Ghanaian',
  bloodGroup: '',
  genotype: '',
  allergies: '',
  conditions: '',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  insuranceProvider: '',
  insuranceNumber: '',
  hasInsurance: true,
  assignedDoctorId: '',
};

export function PatientFormModal({ open, onClose, onSaved, patient }: PatientFormModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const { data: doctors } = useAsyncData(() => doctorService.getDoctors(), []);

  useEffect(() => {
    if (!open) return;
    if (patient) {
      setForm({
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        city: patient.city,
        nationality: patient.nationality,
        bloodGroup: patient.bloodGroup,
        genotype: patient.genotype,
        allergies: patient.allergies.join(', '),
        conditions: patient.conditions.join(', '),
        emergencyName: patient.emergencyContact.name,
        emergencyRelationship: patient.emergencyContact.relationship,
        emergencyPhone: patient.emergencyContact.phone,
        insuranceProvider: patient.insurance?.provider ?? '',
        insuranceNumber: patient.insurance?.number ?? '',
        hasInsurance: !!patient.insurance,
        assignedDoctorId: patient.assignedDoctorId ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, patient]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!form.dateOfBirth) next.dateOfBirth = 'Date of birth is required';
    if (!form.gender) next.gender = 'Select a gender';
    if (!form.phone.trim()) next.phone = 'Phone number is required';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.address.trim()) next.address = 'Address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.nationality.trim()) next.nationality = 'Nationality is required';
    if (!form.bloodGroup) next.bloodGroup = 'Select a blood group';
    if (!form.genotype) next.genotype = 'Select a genotype';
    if (!form.emergencyName.trim()) next.emergencyName = 'Emergency contact name is required';
    if (!form.emergencyPhone.trim()) next.emergencyPhone = 'Emergency contact phone is required';
    if (form.hasInsurance && !form.insuranceProvider.trim()) next.insuranceProvider = 'Provider is required';
    if (form.hasInsurance && !form.insuranceNumber.trim()) next.insuranceNumber = 'Policy number is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const input: PatientInput = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender as 'Male' | 'Female',
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        nationality: form.nationality.trim(),
        bloodGroup: form.bloodGroup as Patient['bloodGroup'],
        genotype: form.genotype as Patient['genotype'],
        allergies: form.allergies.split(',').map((s) => s.trim()).filter(Boolean),
        conditions: form.conditions.split(',').map((s) => s.trim()).filter(Boolean),
        emergencyContact: {
          name: form.emergencyName.trim(),
          relationship: form.emergencyRelationship.trim() || 'Not specified',
          phone: form.emergencyPhone.trim(),
        },
        insurance: form.hasInsurance
          ? { provider: form.insuranceProvider.trim(), number: form.insuranceNumber.trim() }
          : null,
        registrationDate: patient?.registrationDate ?? todayISO(),
        assignedDoctorId: form.assignedDoctorId || null,
      };

      if (patient) {
        const updated = await patientService.updatePatient(patient.id, input);
        toast({ title: 'Patient updated', description: `${updated.firstName} ${updated.lastName}'s record was updated.`, variant: 'success' });
        onSaved(updated);
      } else {
        const created = await patientService.createPatient(input);
        toast({ title: 'Patient registered', description: `${created.firstName} ${created.lastName} (${created.id}) was added successfully.`, variant: 'success' });
        onSaved(created);
      }
      onClose();
    } catch (err) {
      toast({ title: 'Could not save patient', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const quickAllergies = useMemo(() => ALLERGY_QUICK_OPTIONS, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={patient ? 'Edit patient' : 'Register new patient'}
      description={patient ? `Editing record for ${patient.firstName} ${patient.lastName}` : 'Enter the patient’s personal, medical and insurance details.'}
      size="xl"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="patient-form" loading={saving} icon={patient ? <UserRoundPen className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}>
            {patient ? 'Save changes' : 'Register patient'}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Personal information */}
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal information</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="First name" required error={errors.firstName}>
              <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="e.g. Kwame" error={!!errors.firstName} />
            </FormField>
            <FormField label="Last name" required error={errors.lastName}>
              <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="e.g. Osei-Bonsu" error={!!errors.lastName} />
            </FormField>
            <FormField label="Date of birth" required error={errors.dateOfBirth}>
              <DatePicker value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} max={todayISO()} />
            </FormField>
            <FormField label="Gender" required error={errors.gender}>
              <Select value={form.gender} onChange={(e) => set('gender', e.target.value as FormState['gender'])} placeholder="Select gender" error={!!errors.gender}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </FormField>
            <FormField label="Phone" required error={errors.phone}>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+233 24 000 0000" error={!!errors.phone} />
            </FormField>
            <FormField label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="optional" error={!!errors.email} />
            </FormField>
            <FormField label="Address" required error={errors.address}>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="House number and street" error={!!errors.address} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="City" required error={errors.city}>
                <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Accra" error={!!errors.city} />
              </FormField>
              <FormField label="Nationality" required error={errors.nationality}>
                <Input value={form.nationality} onChange={(e) => set('nationality', e.target.value)} error={!!errors.nationality} />
              </FormField>
            </div>
          </div>
        </fieldset>

        {/* Medical information */}
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medical information</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Blood group" required error={errors.bloodGroup}>
              <Select value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)} placeholder="Select" error={!!errors.bloodGroup}>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Genotype" required error={errors.genotype}>
              <Select value={form.genotype} onChange={(e) => set('genotype', e.target.value)} placeholder="Select" error={!!errors.genotype}>
                {GENOTYPES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Allergies" hint="Comma-separated, e.g. Penicillin, Latex">
              <Textarea rows={2} value={form.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="None" />
            </FormField>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-foreground">Common allergies</span>
              <div className="flex flex-wrap gap-1.5">
                {quickAllergies.map((a) => {
                  const selected = form.allergies.toLowerCase().includes(a.toLowerCase());
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        const current = form.allergies.split(',').map((s) => s.trim()).filter(Boolean);
                        const next = selected ? current.filter((x) => x.toLowerCase() !== a.toLowerCase()) : [...current, a];
                        set('allergies', next.join(', '));
                      }}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        selected
                          ? 'border-destructive/40 bg-destructive-soft text-destructive-strong'
                          : 'border-border text-muted-foreground hover:border-border-strong hover:text-foreground',
                      )}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>
            <FormField label="Existing conditions" hint="Comma-separated, e.g. Hypertension, Diabetes">
              <Textarea rows={2} value={form.conditions} onChange={(e) => set('conditions', e.target.value)} placeholder="None" />
            </FormField>
            <FormField label="Assigned doctor">
              <Select value={form.assignedDoctorId} onChange={(e) => set('assignedDoctorId', e.target.value)} placeholder="Unassigned">
                {doctors?.filter((d) => d.status === 'active').map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
                ))}
              </Select>
            </FormField>
          </div>
        </fieldset>

        {/* Emergency contact */}
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emergency contact</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Full name" required error={errors.emergencyName}>
              <Input value={form.emergencyName} onChange={(e) => set('emergencyName', e.target.value)} error={!!errors.emergencyName} />
            </FormField>
            <FormField label="Relationship">
              <Input value={form.emergencyRelationship} onChange={(e) => set('emergencyRelationship', e.target.value)} placeholder="e.g. Wife" />
            </FormField>
            <FormField label="Phone" required error={errors.emergencyPhone}>
              <Input value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} error={!!errors.emergencyPhone} />
            </FormField>
          </div>
        </fieldset>

        {/* Insurance */}
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insurance</legend>
          <Checkbox
            checked={form.hasInsurance}
            onChange={(e) => set('hasInsurance', e.target.checked)}
            label="Patient has health insurance"
            className="mb-3"
          />
          {form.hasInsurance && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Provider" required error={errors.insuranceProvider}>
                <Select value={form.insuranceProvider} onChange={(e) => set('insuranceProvider', e.target.value)} placeholder="Select provider" error={!!errors.insuranceProvider}>
                  <option value="NHIS">NHIS (National Health Insurance)</option>
                  <option value="Apex Health">Apex Health</option>
                  <option value="Premier Health">Premier Health</option>
                  <option value="Mine Workers Trust">Mine Workers Trust</option>
                </Select>
              </FormField>
              <FormField label="Policy / card number" required error={errors.insuranceNumber}>
                <Input value={form.insuranceNumber} onChange={(e) => set('insuranceNumber', e.target.value)} placeholder="e.g. NHIS/2023/123456" error={!!errors.insuranceNumber} />
              </FormField>
            </div>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
