import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Eye, Pencil, Plus, Power, UserCog } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/Form';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/ui/States';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { MoreHorizontal } from 'lucide-react';
import { staffService } from '@/services/staffService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import type { Staff as StaffEntity, StaffInput, StaffStatus } from '@/types';
import { formatDate, todayISO } from '@/utils/date';

const STAFF_ROLES: Array<{ value: string; label: string }> = [
  { value: 'Administrator', label: 'Administrator' },
  { value: 'Doctor', label: 'Doctor' },
  { value: 'Nurse', label: 'Nurse' },
  { value: 'Receptionist', label: 'Receptionist' },
  { value: 'Pharmacist', label: 'Pharmacist' },
  { value: 'Laboratory Technician', label: 'Laboratory Technician' },
  { value: 'Accountant', label: 'Accountant' },
];

const DEPARTMENTS = ['Administration', 'Front Desk', 'Pharmacy', 'Laboratory', 'Finance', 'General Medicine', 'Pediatrics', 'Cardiology', 'Neurology', 'Emergency', 'Surgery', 'Maternity', 'Radiology'];

export function Staff() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const { data: staff, loading, error, reload } = useAsyncData(() => staffService.getStaff(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffEntity | null>(null);
  const [viewing, setViewing] = useState<StaffEntity | null>(null);
  const [toggling, setToggling] = useState<StaffEntity | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (staff ?? []).filter((s) => {
      const matchesQuery = !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const matchesRole = !roleFilter || s.role === roleFilter;
      const matchesDept = !deptFilter || s.department === deptFilter;
      return matchesQuery && matchesRole && matchesDept;
    });
  }, [staff, search, roleFilter, deptFilter]);

  const confirmToggle = async () => {
    if (!toggling) return;
    setBusy(true);
    try {
      const next: StaffStatus = toggling.status === 'active' ? 'inactive' : 'active';
      await staffService.setStatus(toggling.id, next);
      toast({
        title: next === 'active' ? 'Staff member activated' : 'Staff member deactivated',
        description: `${toggling.name} is now ${next}.`,
        variant: 'success',
      });
      reload();
      setToggling(null);
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<StaffEntity>[] = [
    { key: 'id', header: 'Staff ID', sortable: true, render: (s) => <span className="font-mono text-xs text-muted-foreground">{s.id}</span> },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="sm" />
          <span className="font-medium text-foreground">{s.name}</span>
        </div>
      ),
    },
    { key: 'role', header: 'Role', sortable: true, render: (s) => <Badge variant="neutral">{s.role}</Badge> },
    { key: 'department', header: 'Department', sortable: true, render: (s) => <span className="text-muted-foreground">{s.department}</span> },
    { key: 'phone', header: 'Phone', sortable: true, render: (s) => <span className="whitespace-nowrap text-muted-foreground">{s.phone}</span> },
    { key: 'email', header: 'Email', sortable: true, render: (s) => <span className="max-w-56 truncate text-muted-foreground">{s.email}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (s) => <StatusBadge status={s.status} /> },
    { key: 'joinedDate', header: 'Date joined', sortable: true, render: (s) => <span className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(s.joinedDate)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <Dropdown
          ariaLabel={`Actions for ${s.name}`}
          align="right"
          width="w-48"
          trigger={
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          }
        >
          {(close) => (
            <div className="p-1">
              <DropdownItem icon={<Eye className="h-4 w-4" />} onClick={() => { close(); setViewing(s); }}>
                View details
              </DropdownItem>
              <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => { close(); setEditing(s); setFormOpen(true); }}>
                Edit staff
              </DropdownItem>
              <DropdownItem danger icon={<Power className="h-4 w-4" />} onClick={() => { close(); setToggling(s); }}>
                {s.status === 'active' ? 'Deactivate' : 'Activate'}
              </DropdownItem>
            </div>
          )}
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Staff management"
        description="Hospital employees, roles and access status."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Add staff
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex w-full flex-wrap items-center gap-3">
            <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search by name, ID or email…" className="w-full sm:w-72" />
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-52">
              <option value="">All roles</option>
              {STAFF_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
            <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-52">
              <option value="">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(s) => s.id}
              loading={loading}
              pageSize={9}
              emptyTitle="No staff found"
              emptyDescription="Try adjusting your search or filters."
            />
          )}
        </CardContent>
      </Card>

      <StaffFormModal open={formOpen} onClose={() => setFormOpen(false)} staff={editing} onSaved={reload} />

      {/* View */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? ''}
        description={viewing ? `${viewing.id} · ${viewing.role}` : undefined}
        size="sm"
      >
        {viewing && (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar name={viewing.name} size="lg" />
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex items-center gap-2"><StatusBadge status={viewing.status} /><Badge variant="neutral">{viewing.role}</Badge></div>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Department:</span> {viewing.department}</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Phone:</span> {viewing.phone}</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Email:</span> {viewing.email}</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Joined:</span> {formatDate(viewing.joinedDate)}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toggling}
        onClose={() => setToggling(null)}
        onConfirm={confirmToggle}
        loading={busy}
        title={toggling?.status === 'active' ? 'Deactivate staff member' : 'Activate staff member'}
        confirmLabel={toggling?.status === 'active' ? 'Yes, deactivate' : 'Yes, activate'}
        message={
          toggling
            ? toggling.status === 'active'
              ? `Deactivating ${toggling.name} immediately revokes their system access. They can be reactivated later.`
              : `Activate ${toggling.name} to restore their system access?`
            : ''
        }
      />
    </div>
  );
}

/* ------------------------------ Staff form modal ------------------------------ */

function StaffFormModal({ open, onClose, onSaved, staff }: { open: boolean; onClose: () => void; onSaved: () => void; staff: StaffEntity | null }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ name: string; role: string; department: string; phone: string; email: string }>({
    name: '',
    role: STAFF_ROLES[0].value,
    department: DEPARTMENTS[0],
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      staff
        ? { name: staff.name, role: staff.role, department: staff.department, phone: staff.phone, email: staff.email }
        : { name: '', role: STAFF_ROLES[0].value, department: DEPARTMENTS[0], phone: '', email: '' },
    );
  }, [open, staff]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.role) errs.role = 'Select a role';
    if (!form.department) errs.department = 'Select a department';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const input: StaffInput = {
        name: form.name.trim(),
        role: form.role,
        department: form.department,
        phone: form.phone.trim(),
        email: form.email.trim(),
        joinedDate: staff?.joinedDate ?? todayISO(),
        status: staff?.status ?? 'active',
      };
      if (staff) {
        await staffService.updateStaff(staff.id, input);
        toast({ title: 'Staff updated', description: `${form.name}'s record was updated.`, variant: 'success' });
      } else {
        await staffService.createStaff(input);
        toast({ title: 'Staff added', description: `${form.name} was added to the staff directory.`, variant: 'success' });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Could not save staff', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={staff ? 'Edit staff member' : 'Add staff member'}
      description="Record the employee's role and contact details."
      size="lg"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="staff-form" loading={saving} icon={<UserCog className="h-4 w-4" />}>
            {staff ? 'Save changes' : 'Add staff'}
          </Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Full name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Abena Boakye" error={!!errors.name} />
        </FormField>
        <FormField label="Role" required error={errors.role}>
          <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} error={!!errors.role}>
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Department" required error={errors.department}>
          <Select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} error={!!errors.department}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Phone" required error={errors.phone}>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+233 24 000 0000" error={!!errors.phone} />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="name@adommedicalcentre.gh" error={!!errors.email} />
        </FormField>
      </form>
    </Modal>
  );
}
