import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  BedDouble,
  Building2,
  Check,
  DoorOpen,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Form';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, EmptyState, LoadingState } from '@/components/ui/States';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { ConfirmDialog } from '@/components/ui/Modal';
import { bedService } from '@/services/bedService';
import { patientService } from '@/services/patientService';
import { departmentService } from '@/services/departmentService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import type { EnrichedBed, WardStats } from '@/types';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import {
  AddWardModal,
  AssignPatientModal,
  BedDetailModal,
  MaintenanceBedModal,
  TransferBedModal,
} from './BedModals';

type TabId = 'map' | 'list';

const TILE_STYLE: Record<string, string> = {
  available: 'border-success/50 bg-success-soft/50 hover:border-success hover:bg-success-soft',
  occupied: 'border-info/40 bg-info-soft/50 hover:border-info hover:bg-info-soft',
  maintenance: 'border-warning/50 bg-warning-soft/60 hover:border-warning hover:bg-warning-soft',
};

const DOT_STYLE: Record<string, string> = {
  available: 'bg-success',
  occupied: 'bg-info',
  maintenance: 'bg-warning',
};

export function Beds() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState<TabId>('map');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const wardsReq = useAsyncData(() => bedService.getWards(), []);
  const bedsReq = useAsyncData(() => bedService.getBeds(), []);
  const patientsReq = useAsyncData(() => patientService.getPatients(), []);
  const departmentsReq = useAsyncData(() => departmentService.getDepartments(), []);

  const [detailBed, setDetailBed] = useState<EnrichedBed | null>(null);
  const [assignTarget, setAssignTarget] = useState<EnrichedBed | null>(null);
  const [transferSource, setTransferSource] = useState<EnrichedBed | null>(null);
  const [maintenanceTarget, setMaintenanceTarget] = useState<EnrichedBed | null>(null);
  const [dischargeTarget, setDischargeTarget] = useState<EnrichedBed | null>(null);
  const [addWardOpen, setAddWardOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const wards = wardsReq.data ?? [];
  const beds = bedsReq.data ?? [];
  const loading = bedsReq.loading && wardsReq.loading;
  const error = bedsReq.error ?? wardsReq.error;

  const refresh = () => {
    bedsReq.reload();
    wardsReq.reload();
    patientsReq.reload();
  };

  /* ------------------------------ Derived data ------------------------------ */

  const metrics = useMemo(() => {
    const occupied = beds.filter((b) => b.status === 'occupied').length;
    return {
      total: beds.length,
      available: beds.filter((b) => b.status === 'available').length,
      occupied,
      maintenance: beds.filter((b) => b.status === 'maintenance').length,
      occupancyRate: beds.length ? Math.round((occupied / beds.length) * 100) : 0,
    };
  }, [beds]);

  const occupiedPatientIds = useMemo(
    () => new Set(beds.filter((b) => b.patientId).map((b) => b.patientId as string)),
    [beds],
  );

  const candidates = useMemo(
    () => (patientsReq.data ?? []).filter((p) => !occupiedPatientIds.has(p.id)),
    [patientsReq.data, occupiedPatientIds],
  );

  const filteredBeds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return beds.filter((b) => {
      const matchesQuery =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.patientName?.toLowerCase().includes(q) ||
        b.wardName.toLowerCase().includes(q);
      const matchesWard = !wardFilter || b.wardId === wardFilter;
      const matchesStatus = !statusFilter || b.status === statusFilter;
      return matchesQuery && matchesWard && matchesStatus;
    });
  }, [beds, search, wardFilter, statusFilter]);

  const wardsForMap = selectedWard === 'all' ? wards : wards.filter((w) => w.id === selectedWard);

  /* -------------------------------- Actions -------------------------------- */

  const confirmDischarge = async () => {
    if (!dischargeTarget) return;
    setBusy(true);
    try {
      const result = await bedService.dischargeBed(dischargeTarget.id);
      toast({
        title: 'Bed discharged',
        description: `${result.patientName ?? 'Patient'} was discharged — ${result.id} is now available.`,
        variant: 'success',
      });
      setDischargeTarget(null);
      setDetailBed(null);
      refresh();
    } catch (err) {
      toast({ title: 'Could not discharge bed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const restoreBed = async (bed: EnrichedBed) => {
    try {
      await bedService.setMaintenance(bed.id, false);
      toast({ title: 'Bed restored', description: `${bed.id} is back in service.`, variant: 'success' });
      setDetailBed(null);
      refresh();
    } catch (err) {
      toast({ title: 'Could not restore bed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    }
  };

  /* --------------------------------- Table --------------------------------- */

  const tableColumns: Column<EnrichedBed>[] = [
    {
      key: 'id',
      header: 'Bed',
      sortable: true,
      render: (b) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <BedDouble className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-mono text-xs font-semibold text-foreground">{b.id}</span>
        </div>
      ),
    },
    { key: 'wardName', header: 'Ward', sortable: true, render: (b) => <span className="text-muted-foreground">{b.wardName}</span> },
    {
      key: 'patientName',
      header: 'Patient',
      sortable: true,
      render: (b) =>
        b.patientName ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patients/${b.patientId}`);
            }}
            className="inline-flex max-w-48 items-center gap-2 truncate font-medium text-foreground transition-colors hover:text-primary-strong"
          >
            <Avatar name={b.patientName} size="xs" />
            <span className="truncate">{b.patientName}</span>
          </button>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'occupiedSince',
      header: 'Admitted',
      sortable: true,
      render: (b) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {b.status === 'occupied' && b.occupiedSince ? formatDate(b.occupiedSince) : '—'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', sortable: true, render: (b) => <StatusBadge status={b.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          {b.status === 'available' && (
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAssignTarget(b)}>
              Assign
            </Button>
          )}
          {b.status === 'occupied' && (
            <Button size="sm" variant="outline" icon={<ArrowRightLeft className="h-3.5 w-3.5" />} onClick={() => setTransferSource(b)}>
              Transfer
            </Button>
          )}
          <Dropdown
            ariaLabel={`Bed actions for ${b.id}`}
            align="right"
            width="w-52"
            trigger={
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </span>
            }
          >
            {(close) => (
              <div className="p-1">
                <DropdownItem icon={<Search className="h-4 w-4" />} onClick={() => { close(); setDetailBed(b); }}>
                  View details
                </DropdownItem>
                {b.status === 'available' && (
                  <DropdownItem icon={<Plus className="h-4 w-4" />} onClick={() => { close(); setAssignTarget(b); }}>
                    Assign patient
                  </DropdownItem>
                )}
                {b.status === 'occupied' && (
                  <>
                    <DropdownItem icon={<ArrowRightLeft className="h-4 w-4" />} onClick={() => { close(); setTransferSource(b); }}>
                      Transfer patient
                    </DropdownItem>
                    <DropdownItem danger icon={<DoorOpen className="h-4 w-4" />} onClick={() => { close(); setDischargeTarget(b); }}>
                      Discharge patient
                    </DropdownItem>
                  </>
                )}
                {b.status !== 'maintenance' && b.status !== 'occupied' && (
                  <DropdownItem icon={<Wrench className="h-4 w-4" />} onClick={() => { close(); setMaintenanceTarget(b); }}>
                    Put out of service
                  </DropdownItem>
                )}
                {b.status === 'maintenance' && (
                  <DropdownItem icon={<Check className="h-4 w-4" />} onClick={() => { close(); restoreBed(b); }}>
                    Restore to service
                  </DropdownItem>
                )}
              </div>
            )}
          </Dropdown>
        </div>
      ),
    },
  ];

  /* ---------------------------------- Render ---------------------------------- */

  return (
    <div>
      <PageHeader
        title="Bed Management"
        description="Ward occupancy, bed assignments, transfers and discharges."
        actions={
          isAdmin ? (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAddWardOpen(true)}>
              Add ward
            </Button>
          ) : undefined
        }
      />

      {/* Metrics */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total beds', value: metrics.total, icon: BedDouble, cls: 'text-primary-strong bg-primary-soft' },
          { label: 'Available', value: metrics.available, icon: Check, cls: 'text-success-strong bg-success-soft' },
          { label: 'Occupied', value: metrics.occupied, icon: BedDouble, cls: 'text-info-strong bg-info-soft' },
          { label: 'Maintenance', value: metrics.maintenance, icon: Wrench, cls: 'text-warning-strong bg-warning-soft' },
          { label: 'Occupancy rate', value: `${metrics.occupancyRate}%`, icon: Building2, cls: 'text-processing-strong bg-processing-soft' },
        ].map((m) => (
          <Card key={m.label} className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', m.cls)}>
                <m.icon className="h-4.5 w-4.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none text-foreground">{m.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{m.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs
        className="mb-4"
        value={tab}
        onChange={(t) => setTab(t as TabId)}
        items={[
          { id: 'map', label: 'Ward map', icon: LayoutGrid },
          { id: 'list', label: 'Bed list', icon: List },
        ]}
      />

      {error ? (
        <Card>
          <CardContent className="pt-5">
            <ErrorState message={error} onRetry={refresh} />
          </CardContent>
        </Card>
      ) : tab === 'map' ? (
        <div>
          {/* Ward pills */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Wards">
            <button
              role="tab"
              aria-selected={selectedWard === 'all'}
              onClick={() => setSelectedWard('all')}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                selectedWard === 'all'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground',
              )}
            >
              All wards
              <span className={cn('rounded-full px-1.5 text-[11px] font-semibold', selectedWard === 'all' ? 'bg-white/20' : 'bg-muted')}>
                {metrics.occupied}/{metrics.total}
              </span>
            </button>
            {wards.map((w) => (
              <button
                key={w.id}
                role="tab"
                aria-selected={selectedWard === w.id}
                onClick={() => setSelectedWard(w.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  selectedWard === w.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground',
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', w.occupancyRate >= 90 ? 'bg-destructive' : w.occupancyRate >= 60 ? 'bg-warning' : 'bg-success')} aria-hidden />
                {w.name}
                <span className={cn('rounded-full px-1.5 text-[11px] font-semibold', selectedWard === w.id ? 'bg-white/20' : 'bg-muted')}>
                  {w.occupied}/{w.totalBeds}
                </span>
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {[
              { status: 'available', label: 'Available' },
              { status: 'occupied', label: 'Occupied' },
              { status: 'maintenance', label: 'Maintenance' },
            ].map((l) => (
              <span key={l.status} className="inline-flex items-center gap-1.5">
                <span className={cn('h-2.5 w-2.5 rounded-full', DOT_STYLE[l.status])} aria-hidden />
                {l.label}
              </span>
            ))}
          </div>

          {loading ? (
            <LoadingState />
          ) : wardsForMap.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState icon={<Building2 className="h-6 w-6" />} title="No wards found" description="Add a ward to start managing beds." />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              {wardsForMap.map((ward) => <WardCard key={ward.id} ward={ward} beds={beds.filter((b) => b.wardId === ward.id)} onBedClick={setDetailBed} />)}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex w-full flex-wrap items-center gap-3">
              <SearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                placeholder="Search bed, ward or patient…"
                className="w-full sm:w-72"
              />
              <Select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} className="w-56">
                <option value="">All wards</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
                <option value="">All statuses</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable
              columns={tableColumns}
              data={filteredBeds}
              rowKey={(b) => b.id}
              loading={loading}
              pageSize={10}
              onRowClick={(b) => setDetailBed(b)}
              empty={<EmptyState icon={<BedDouble className="h-6 w-6" />} title="No beds found" description="Try adjusting your search or filters." />}
            />
          </CardContent>
        </Card>
      )}

      {/* --------------------------------- Modals --------------------------------- */}
      <BedDetailModal
        bed={detailBed}
        onClose={() => setDetailBed(null)}
        onAssign={(b) => { setDetailBed(null); setAssignTarget(b); }}
        onTransfer={(b) => { setDetailBed(null); setTransferSource(b); }}
        onDischarge={(b) => setDischargeTarget(b)}
        onMaintenance={(b) => { setDetailBed(null); setMaintenanceTarget(b); }}
        onRestore={(b) => restoreBed(b)}
      />

      <AssignPatientModal
        bed={assignTarget}
        patients={candidates}
        onClose={() => setAssignTarget(null)}
        onSaved={() => { setAssignTarget(null); refresh(); }}
      />

      <TransferBedModal
        bed={transferSource}
        beds={beds}
        wards={wards}
        onClose={() => setTransferSource(null)}
        onSaved={() => { setTransferSource(null); refresh(); }}
      />

      <MaintenanceBedModal
        bed={maintenanceTarget}
        onClose={() => setMaintenanceTarget(null)}
        onSaved={() => { setMaintenanceTarget(null); refresh(); }}
      />

      <AddWardModal
        open={addWardOpen}
        departments={departmentsReq.data ?? []}
        onClose={() => setAddWardOpen(false)}
        onSaved={(ward) => {
          setAddWardOpen(false);
          toast({ title: 'Ward added', description: `${ward.name} was created with ${ward.totalBeds} beds.`, variant: 'success' });
          setSelectedWard(ward.id);
          refresh();
        }}
      />

      <ConfirmDialog
        open={!!dischargeTarget}
        onClose={() => setDischargeTarget(null)}
        onConfirm={confirmDischarge}
        loading={busy}
        title="Discharge patient from bed"
        confirmLabel="Yes, discharge patient"
        message={
          dischargeTarget
            ? `${dischargeTarget.patientName ?? 'This patient'} will be discharged from ${dischargeTarget.id} (${dischargeTarget.wardName}) and the bed will become available.`
            : ''
        }
      />
    </div>
  );
}

/* ------------------------------- Ward card ------------------------------- */

function WardCard({
  ward,
  beds,
  onBedClick,
}: {
  ward: WardStats;
  beds: EnrichedBed[];
  onBedClick: (bed: EnrichedBed) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{ward.name}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{ward.location}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Occupancy</span>
                <span className="font-semibold text-foreground">{ward.occupancyRate}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full',
                    ward.occupancyRate >= 90 ? 'bg-destructive' : ward.occupancyRate >= 60 ? 'bg-warning' : 'bg-success',
                  )}
                  style={{ width: `${Math.max(4, ward.occupancyRate)}%` }}
                  aria-hidden
                />
              </div>
            </div>
            <Badge variant="outline">{ward.occupied}/{ward.totalBeds} occupied</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {beds.map((bed) => (
            <button
              key={bed.id}
              onClick={() => onBedClick(bed)}
              aria-label={`Bed ${bed.number} — ${bed.status}${bed.patientName ? `, ${bed.patientName}` : ''}`}
              className={cn('flex min-h-[74px] flex-col justify-between rounded-lg border p-2.5 text-left transition-colors', TILE_STYLE[bed.status])}
            >
              <span className="flex items-center justify-between gap-1">
                <span className="font-mono text-xs font-bold text-foreground">{bed.number}</span>
                <span className={cn('h-2 w-2 rounded-full', DOT_STYLE[bed.status])} aria-hidden />
              </span>
              {bed.status === 'occupied' && bed.patientName ? (
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-foreground">{bed.patientName}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    since {bed.occupiedSince ? formatDate(bed.occupiedSince) : '—'}
                  </span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-muted-foreground">
                  {bed.status === 'available' ? 'Available' : 'Maintenance'}
                </span>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
