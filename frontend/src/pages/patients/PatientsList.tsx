import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Plus, Users, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Form';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { MoreHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { useAsyncData, useDebouncedValue } from '@/hooks/useAsyncData';
import { PatientFormModal } from './PatientForm';
import { ageFromDateOfBirth } from '@/utils/date';
import { canAccess } from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Patient } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'admitted', label: 'Admitted' },
  { value: 'discharged', label: 'Discharged' },
  { value: 'inactive', label: 'Inactive' },
];

export function PatientsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [status, setStatus] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');

  const { data: patients, loading, error, reload } = useAsyncData(() => patientService.getPatients(), []);
  const { data: doctors } = useAsyncData(() => doctorService.getDoctors(), []);

  const debouncedSearch = useDebouncedValue(search, 250);

  // Keep the URL query in sync (used by global search → deep link).
  useEffect(() => {
    if (debouncedSearch) setSearchParams({ q: debouncedSearch }, { replace: true });
    else if (searchParams.get('q')) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);

  const doctorName = useMemo(() => {
    const map = new Map<string, string>();
    doctors?.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [doctors]);

  const filtered = useMemo(() => {
    if (!patients) return [];
    const q = debouncedSearch.trim().toLowerCase();
    return patients.filter((p) => {
      const matchesQuery =
        !q ||
        p.id.toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''));
      const matchesStatus = !status || p.status === status;
      const matchesDoctor = !doctorFilter || p.assignedDoctorId === doctorFilter;
      return matchesQuery && matchesStatus && matchesDoctor;
    });
  }, [patients, debouncedSearch, status, doctorFilter]);

  const columns: Column<Patient>[] = [
    {
      key: 'id',
      header: 'Patient ID',
      sortable: true,
      render: (p) => <span className="font-mono text-xs font-medium text-muted-foreground">{p.id}</span>,
    },
    {
      key: 'name',
      header: 'Patient',
      sortable: true,
      sortValue: (p) => `${p.lastName} ${p.firstName}`,
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${p.firstName} ${p.lastName}`} size="sm" />
          <div className="min-w-0 leading-tight">
            <p className="truncate font-medium text-foreground">
              {p.firstName} {p.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{p.email || 'No email on file'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'gender',
      header: 'Gender',
      sortable: true,
      render: (p) => <span className="text-muted-foreground">{p.gender}</span>,
    },
    {
      key: 'dob',
      header: 'Age',
      sortable: true,
      sortValue: (p) => ageFromDateOfBirth(p.dateOfBirth),
      render: (p) => <span className="text-foreground">{ageFromDateOfBirth(p.dateOfBirth)} yrs</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      render: (p) => <span className="whitespace-nowrap text-muted-foreground">{p.phone}</span>,
    },
    {
      key: 'bloodGroup',
      header: 'Blood',
      sortable: true,
      render: (p) => (
        <span className="inline-flex h-6 min-w-9 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-semibold text-foreground">
          {p.bloodGroup}
        </span>
      ),
    },
    {
      key: 'doctorId',
      header: 'Assigned doctor',
      sortable: true,
      sortValue: (p) => doctorName.get(p.assignedDoctorId ?? '') ?? '',
      render: (p) => (
        <span className="text-muted-foreground">{doctorName.get(p.assignedDoctorId ?? '') ?? 'Unassigned'}</span>
      ),
    },
    {
      key: 'registrationDate',
      header: 'Registered',
      sortable: true,
      render: (p) => <span className="text-xs text-muted-foreground">{p.registrationDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <Dropdown
          ariaLabel={`Actions for ${p.firstName} ${p.lastName}`}
          align="right"
          width="w-44"
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
                  navigate(`/patients/${p.id}`);
                }}
              >
                View profile
              </DropdownItem>
              {user && canAccess(user.role, '/patients') && (
                <DropdownItem
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    setEditing(p);
                    setFormOpen(true);
                  }}
                >
                  Edit patient
                </DropdownItem>
              )}
            </div>
          )}
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Patients"
        description={`${filtered.length} patient${filtered.length === 1 ? '' : 's'} ${debouncedSearch ? 'matching your search' : 'registered at the hospital'}`}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Add patient
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex w-full flex-wrap items-center gap-3">
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search by name, ID or phone…"
              className="w-full sm:w-72"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
              <Select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="w-56">
                <option value="">All doctors</option>
                {doctors?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
              {(status || doctorFilter || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatus('');
                    setDoctorFilter('');
                    setSearch('');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
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
              onRowClick={(p) => navigate(`/patients/${p.id}`)}
              empty={
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No patients found"
                  description={search || status || doctorFilter ? 'Try adjusting your search or filters.' : 'Register your first patient to get started.'}
                  action={
                    !search && !status && !doctorFilter ? (
                      <Button size="sm" icon={<UserPlus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>
                        Add patient
                      </Button>
                    ) : undefined
                  }
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <PatientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        patient={editing}
        onSaved={() => {
          reload();
        }}
      />
    </div>
  );
}
