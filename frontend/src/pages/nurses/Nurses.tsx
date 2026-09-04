import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Eye, HeartPulse, Pencil, Plus, Power } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/Form';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/ui/States';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { MoreHorizontal } from 'lucide-react';
import { nurseService, type NurseWithDept } from '@/services/nurseService';
import { departmentService } from '@/services/departmentService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { SHIFTS } from '@/constants/options';
import type { NurseInput, NurseStatus, Shift } from '@/types';
import { formatDate, todayISO } from '@/utils/date';

export function Nurses() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const { data: nurses, loading, error, reload } = useAsyncData(() => nurseService.getNurses(), []);
  const { data: departments } = useAsyncData(() => departmentService.getDepartments(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NurseWithDept | null>(null);
  const [viewing, setViewing] = useState<NurseWithDept | null>(null);
  const [toggling, setToggling] = useState<NurseWithDept | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (nurses ?? []).filter((n) => {
      const matchesQuery = !q || n.name.toLowerCase().includes(q) || n.id.toLowerCase().includes(q) || n.ward.toLowerCase().includes(q);
      const matchesDept = !deptFilter || n.departmentId === deptFilter;
      return matchesQuery && matchesDept;
    });
  }, [nurses, search, deptFilter]);

  const confirmToggle = async () => {
    if (!toggling) return;
    setBusy(true);
    try {
      const next: NurseStatus = toggling.status === 'active' ? 'inactive' : 'active';
      await nurseService.updateNurse(toggling.id, { status: next });
      toast({
        title: next === 'active' ? 'Nurse activated' : 'Nurse deactivated',
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

  const columns: Column<NurseWithDept>[] = [
    {
      key: 'id',
      header: 'Nurse ID',
      sortable: true,
      render: (n) => <span className="font-mono text-xs text-muted-foreground">{n.id}</span>,
    },
    {
      key: 'name',
      header: 'Nurse',
      sortable: true,
      sortValue: (n) => n.name,
      render: (n) => (
        <div className="flex items-center gap-3">
          <Avatar name={n.name} size="sm" />
          <span className="font-medium text-foreground">{n.name}</span>
        </div>
      ),
    },
    { key: 'departmentName', header: 'Department', sortable: true, render: (n) => <span className="text-muted-foreground">{n.departmentName}</span> },
    { key: 'phone', header: 'Phone', sortable: true, render: (n) => <span className="whitespace-nowrap text-muted-foreground">{n.phone}</span> },
    { key: 'email', header: 'Email', sortable: true, render: (n) => <span className="max-w-56 truncate text-muted-foreground">{n.email}</span> },
    { key: 'shift', header: 'Shift', sortable: true, render: (n) => <span className="text-foreground">{n.shift}</span> },
    { key: 'ward', header: 'Ward', sortable: true, render: (n) => <span className="text-muted-foreground">{n.ward}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (n) => <StatusBadge status={n.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (n) => (
        <Dropdown
          ariaLabel={`Actions for ${n.name}`}
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
              <DropdownItem
                icon={<Eye className="h-4 w-4" />}
                onClick={() => {
                  close();
                  setViewing(n);
                }}
              >
                View details
              </DropdownItem>
              <DropdownItem
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => {
                  close();
                  setEditing(n);
                  setFormOpen(true);
                }}
              >
                Edit nurse
              </DropdownItem>
              <DropdownItem
                danger
                icon={<Power className="h-4 w-4" />}
                onClick={() => {
                  close();
                  setToggling(n);
                }}
              >
                {n.status === 'active' ? 'Deactivate' : 'Activate'}
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
        title="Nurses"
        description="Nursing staff, ward assignments and shifts."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Add nurse
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex w-full flex-wrap items-center gap-3">
            <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search by name, ID or ward…" className="w-full sm:w-72" />
            <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-56">
              <option value="">All departments</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
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
              rowKey={(n) => n.id}
              loading={loading}
              pageSize={8}
              emptyTitle="No nurses found"
              emptyDescription="Try adjusting your search or filters."
            />
          )}
        </CardContent>
      </Card>

      <NurseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        nurse={editing}
        departments={departments ?? []}
        onSaved={reload}
      />

      {/* View details */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? ''}
        description={viewing ? `${viewing.id} · ${viewing.departmentName}` : undefined}
        size="md"
      >
        {viewing && (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar name={viewing.name} size="lg" />
            <div className="flex-1 space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <StatusBadge status={viewing.status} />
                <span className="text-muted-foreground">{viewing.shift} shift</span>
              </div>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Ward:</span> {viewing.ward}</p>
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
        title={toggling?.status === 'active' ? 'Deactivate nurse' : 'Activate nurse'}
        confirmLabel={toggling?.status === 'active' ? 'Yes, deactivate' : 'Yes, activate'}
        message={
          toggling
            ? toggling.status === 'active'
              ? `Deactivating ${toggling.name} removes them from the active duty roster. You can reactivate them at any time.`
              : `Activate ${toggling.name} so they can be assigned to wards and shifts again?`
            : ''
        }
      />
    </div>
  );
}

/* --------------------------- Add / edit nurse form --------------------------- */

interface NurseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  nurse?: NurseWithDept | null;
  departments: Array<{ id: string; name: string }>;
}

function NurseFormModal({ open, onClose, onSaved, nurse, departments }: NurseFormModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ name: string; departmentId: string; phone: string; email: string; shift: Shift; ward: string }>({
    name: '',
    departmentId: '',
    phone: '',
    email: '',
    shift: 'Morning',
    ward: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      nurse
        ? { name: nurse.name, departmentId: nurse.departmentId, phone: nurse.phone, email: nurse.email, shift: nurse.shift, ward: nurse.ward }
        : { name: '', departmentId: departments[0]?.id ?? '', phone: '', email: '', shift: 'Morning', ward: '' },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nurse]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.departmentId) errs.departmentId = 'Select a department';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.ward.trim()) errs.ward = 'Ward is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const input: NurseInput = {
        name: form.name.trim(),
        departmentId: form.departmentId,
        phone: form.phone.trim(),
        email: form.email.trim(),
        shift: form.shift,
        ward: form.ward.trim(),
        joinedDate: nurse?.joinedDate ?? todayISO(),
        status: nurse?.status ?? 'active',
      };
      if (nurse) {
        await nurseService.updateNurse(nurse.id, input);
        toast({ title: 'Nurse updated', description: `${form.name}'s record was updated.`, variant: 'success' });
      } else {
        await nurseService.createNurse(input);
        toast({ title: 'Nurse added', description: `${form.name} has been added to the nursing staff.`, variant: 'success' });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Could not save nurse', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={nurse ? 'Edit nurse' : 'Add nurse'}
      description="Record the nurse’s details, ward and shift assignment."
      size="lg"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="nurse-form" loading={saving} icon={<HeartPulse className="h-4 w-4" />}>
            {nurse ? 'Save changes' : 'Add nurse'}
          </Button>
        </>
      }
    >
      <form id="nurse-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Full name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Efua Mensah" error={!!errors.name} />
        </FormField>
        <FormField label="Department" required error={errors.departmentId}>
          <Select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} placeholder="Select department" error={!!errors.departmentId}>
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
        <FormField label="Shift" required>
          <Select value={form.shift} onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value as Shift }))}>
            {SHIFTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Ward" required error={errors.ward}>
          <Input value={form.ward} onChange={(e) => setForm((f) => ({ ...f, ward: e.target.value }))} placeholder="e.g. Maternity Ward 2A" error={!!errors.ward} />
        </FormField>
      </form>
    </Modal>
  );
}
