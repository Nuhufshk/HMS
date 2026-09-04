import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Plus, Power, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/Form';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { MoreHorizontal } from 'lucide-react';
import { doctorService, type DoctorWithStats } from '@/services/doctorService';
import { departmentService } from '@/services/departmentService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import type { Doctor, DoctorAvailability, DoctorInput, DoctorStatus } from '@/types';
import { formatDate, todayISO } from '@/utils/date';

export function Doctors() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: doctors, loading, error, reload } = useAsyncData(() => doctorService.getDoctors(), []);
  const { data: departments } = useAsyncData(() => departmentService.getDepartments(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DoctorWithStats | null>(null);
  const [disabling, setDisabling] = useState<DoctorWithStats | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (doctors ?? []).filter((d) => {
      const matchesQuery = !q || d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
      const matchesDept = !deptFilter || d.departmentId === deptFilter;
      const matchesStatus = !statusFilter || d.status === statusFilter;
      return matchesQuery && matchesDept && matchesStatus;
    });
  }, [doctors, search, deptFilter, statusFilter]);

  const confirmDisable = async () => {
    if (!disabling) return;
    setBusy(true);
    try {
      const next: DoctorStatus = disabling.status === 'active' ? 'inactive' : 'active';
      await doctorService.updateDoctor(disabling.id, { status: next });
      toast({
        title: next === 'inactive' ? 'Doctor disabled' : 'Doctor enabled',
        description: `${disabling.name} is now ${next === 'inactive' ? 'disabled' : 'active'}.`,
        variant: 'success',
      });
      reload();
      setDisabling(null);
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Doctors"
        description="Medical staff, specialisations and on-duty availability."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Add doctor
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex w-full flex-wrap items-center gap-3">
            <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search by name, ID or specialisation…" className="w-full sm:w-72" />
            <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-56">
              <option value="">All departments</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On leave</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Stethoscope className="h-6 w-6" />} title="No doctors found" description="Try adjusting your search or filters." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((d) => (
                <Card key={d.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-start gap-3.5 pt-5">
                    <Avatar name={d.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <button onClick={() => navigate(`/doctors/${d.id}`)} className="block truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-primary-strong">
                            {d.name}
                          </button>
                          <p className="text-xs text-muted-foreground">{d.specialization}</p>
                        </div>
                        <Dropdown
                          ariaLabel={`Actions for ${d.name}`}
                          align="right"
                          width="w-44"
                          trigger={
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </span>
                          }
                        >
                          {(close) => (
                            <div className="p-1">
                              <DropdownItem icon={<Eye className="h-4 w-4" />} onClick={() => { close(); navigate(`/doctors/${d.id}`); }}>
                                View profile
                              </DropdownItem>
                              <DropdownItem
                                icon={<Pencil className="h-4 w-4" />}
                                onClick={() => {
                                  close();
                                  setEditing(d);
                                  setFormOpen(true);
                                }}
                              >
                                Edit doctor
                              </DropdownItem>
                              <DropdownItem
                                danger
                                icon={<Power className="h-4 w-4" />}
                                onClick={() => {
                                  close();
                                  setDisabling(d);
                                }}
                              >
                                {d.status === 'active' ? 'Disable doctor' : 'Enable doctor'}
                              </DropdownItem>
                            </div>
                          )}
                        </Dropdown>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={d.status} />
                        <Badge variant={d.availability === 'available' ? 'success' : d.availability === 'busy' ? 'warning' : 'neutral'} dot>
                          {d.availability === 'available' ? 'Available' : d.availability === 'busy' ? 'Busy' : 'Away'}
                        </Badge>
                      </div>
                      <p className="mt-2.5 text-xs text-muted-foreground">
                        {d.departmentName} · {d.patientsCount} patients
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.phone} · joined {formatDate(d.joinedDate)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DoctorFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        doctor={editing}
        onSaved={reload}
        departments={departments ?? []}
      />

      <ConfirmDialog
        open={!!disabling}
        onClose={() => setDisabling(null)}
        onConfirm={confirmDisable}
        loading={busy}
        title={disabling?.status === 'active' ? 'Disable doctor' : 'Enable doctor'}
        confirmLabel={disabling?.status === 'active' ? 'Yes, disable' : 'Yes, enable'}
        message={
          disabling
            ? disabling.status === 'active'
              ? `Disabling ${disabling.name} will prevent new appointments from being booked with them. Existing appointments remain in the system.`
              : `Enable ${disabling.name} to start receiving appointments again?`
            : ''
        }
      />
    </div>
  );
}

/* ------------------------- Add / edit doctor form ------------------------- */

interface DoctorFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  doctor?: DoctorWithStats | null;
  departments: Array<{ id: string; name: string }>;
}

function DoctorFormModal({ open, onClose, onSaved, doctor, departments }: DoctorFormModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    specialization: string;
    departmentId: string;
    phone: string;
    email: string;
    availability: DoctorAvailability;
    status: DoctorStatus;
    about: string;
  }>({ name: '', specialization: '', departmentId: '', phone: '', email: '', availability: 'available', status: 'active', about: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset the form whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (doctor) {
      setForm({
        name: doctor.name,
        specialization: doctor.specialization,
        departmentId: doctor.departmentId,
        phone: doctor.phone,
        email: doctor.email,
        availability: doctor.availability,
        status: doctor.status,
        about: doctor.about,
      });
    } else {
      setForm({ name: '', specialization: '', departmentId: departments[0]?.id ?? '', phone: '', email: '', availability: 'available', status: 'active', about: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doctor]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.specialization.trim()) errs.specialization = 'Specialisation is required';
    if (!form.departmentId) errs.departmentId = 'Select a department';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const input: DoctorInput = {
        ...form,
        name: form.name.trim(),
        specialization: form.specialization.trim(),
        about: form.about.trim() || 'Newly added doctor.',
        joinedDate: doctor?.joinedDate ?? todayISO(),
        schedule: doctor?.schedule ?? [
          { day: 'Monday', hours: '08:00 – 16:00' },
          { day: 'Tuesday', hours: '08:00 – 16:00' },
          { day: 'Wednesday', hours: '08:00 – 16:00' },
          { day: 'Thursday', hours: '08:00 – 16:00' },
          { day: 'Friday', hours: '08:00 – 16:00' },
        ],
      };
      if (doctor) {
        await doctorService.updateDoctor(doctor.id, input);
        toast({ title: 'Doctor updated', description: `${form.name}'s record was updated.`, variant: 'success' });
      } else {
        await doctorService.createDoctor(input);
        toast({ title: 'Doctor added', description: `${form.name} has been added to the medical staff.`, variant: 'success' });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Could not save doctor', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={doctor ? 'Edit doctor' : 'Add doctor'}
      description="Record the doctor’s details and departmental assignment."
      size="lg"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="doctor-form" loading={saving} icon={<Stethoscope className="h-4 w-4" />}>
            {doctor ? 'Save changes' : 'Add doctor'}
          </Button>
        </>
      }
    >
      <form id="doctor-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Full name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Dr. Kwame Asante" error={!!errors.name} />
        </FormField>
        <FormField label="Specialisation" required error={errors.specialization}>
          <Input value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} placeholder="e.g. Cardiology" error={!!errors.specialization} />
        </FormField>
        <FormField label="Department" required error={errors.departmentId}>
          <Select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} error={!!errors.departmentId}>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Phone" required error={errors.phone}>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+233 24 000 0000" error={!!errors.phone} />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@adommedicalcentre.gh" error={!!errors.email} />
        </FormField>
        <FormField label="Availability">
          <Select value={form.availability} onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value as DoctorAvailability }))}>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="away">Away</option>
          </Select>
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DoctorStatus }))}>
            <option value="active">Active</option>
            <option value="on_leave">On leave</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormField>
        <FormField label="Short bio" className="sm:col-span-2">
          <Input value={form.about} onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))} placeholder="Optional one-line bio" />
        </FormField>
      </form>
    </Modal>
  );
}
