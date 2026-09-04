import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  CheckCheck,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Form';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { appointmentService } from '@/services/appointmentService';
import { doctorService } from '@/services/doctorService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { AppointmentFormModal } from './AppointmentModal';
import { AppointmentCalendar } from './AppointmentCalendar';
import { formatDate, formatTime, todayISO } from '@/utils/date';
import type { EnrichedAppointment } from '@/types';

type TabId = 'today' | 'upcoming' | 'all' | 'calendar';

export function Appointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState<TabId>('today');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');

  const { data: appointments, loading, error, reload } = useAsyncData(() => appointmentService.getAppointments(), []);
  const { data: doctors } = useAsyncData(() => doctorService.getDoctors(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EnrichedAppointment | null>(null);
  const [cancelling, setCancelling] = useState<EnrichedAppointment | null>(null);
  const [busy, setBusy] = useState(false);

  // Deep links like /appointments?new=1 (e.g. from the dashboard) open the form.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const today = todayISO();

  const todaysList = useMemo(
    () => (appointments ?? []).filter((a) => a.date === today).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, today],
  );
  const upcomingList = useMemo(
    () => (appointments ?? []).filter((a) => a.date > today && a.status !== 'cancelled'),
    [appointments, today],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (appointments ?? []).filter((a) => {
      const matchesQuery =
        !q ||
        a.patientName.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || a.status === statusFilter;
      const matchesDoctor = !doctorFilter || a.doctorId === doctorFilter;
      return matchesQuery && matchesStatus && matchesDoctor;
    });
  }, [appointments, search, statusFilter, doctorFilter]);

  const handleComplete = async (a: EnrichedAppointment) => {
    try {
      await appointmentService.setStatus(a.id, 'completed');
      toast({ title: 'Appointment completed', description: `${a.id} for ${a.patientName} was marked completed.`, variant: 'success' });
      reload();
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    }
  };

  const handleCheckIn = async (a: EnrichedAppointment) => {
    try {
      await appointmentService.setStatus(a.id, 'waiting');
      toast({ title: 'Patient checked in', description: `${a.patientName} is now waiting.`, variant: 'success' });
      reload();
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    }
  };

  const handleStart = async (a: EnrichedAppointment) => {
    try {
      await appointmentService.setStatus(a.id, 'in_progress');
      toast({ title: 'Appointment started', description: `${a.patientName} is now in consultation.`, variant: 'success' });
      reload();
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      await appointmentService.cancelAppointment(cancelling.id);
      toast({ title: 'Appointment cancelled', description: `${cancelling.id} for ${cancelling.patientName} was cancelled.`, variant: 'info' });
      reload();
      setCancelling(null);
    } catch (err) {
      toast({ title: 'Could not cancel', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const actionsColumn = (row: EnrichedAppointment) => (
    <Dropdown
      ariaLabel={`Actions for ${row.id}`}
      align="right"
      width="w-56"
      trigger={
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </span>
      }
    >
      {(close) => (
        <div className="p-1">
          {row.status === 'scheduled' && (
            <DropdownItem icon={<Clock className="h-4 w-4" />} onClick={() => { close(); handleCheckIn(row); }}>
              Check in patient
            </DropdownItem>
          )}
          {row.status === 'waiting' && (
            <DropdownItem icon={<CalendarDays className="h-4 w-4" />} onClick={() => { close(); handleStart(row); }}>
              Start consultation
            </DropdownItem>
          )}
          {(row.status === 'scheduled' || row.status === 'waiting' || row.status === 'in_progress') && (
            <DropdownItem icon={<CheckCheck className="h-4 w-4" />} onClick={() => { close(); handleComplete(row); }}>
              Mark as completed
            </DropdownItem>
          )}
          {(row.status === 'scheduled' || row.status === 'waiting') && (
            <DropdownItem
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => {
                close();
                setEditing(row);
                setFormOpen(true);
              }}
            >
              Edit details
            </DropdownItem>
          )}
          {(row.status === 'scheduled' || row.status === 'waiting') && (
            <DropdownItem
              danger
              icon={<XCircle className="h-4 w-4" />}
              onClick={() => {
                close();
                setCancelling(row);
              }}
            >
              Cancel appointment
            </DropdownItem>
          )}
          {row.status === 'cancelled' && (
            <p className="px-3 py-2 text-xs text-muted-foreground">This appointment was cancelled</p>
          )}
          {row.status === 'completed' && (
            <p className="px-3 py-2 text-xs text-muted-foreground">This appointment is completed</p>
          )}
        </div>
      )}
    </Dropdown>
  );

  const columns: Column<EnrichedAppointment>[] = [
    { key: 'id', header: 'ID', sortable: true, render: (a) => <span className="font-mono text-xs text-muted-foreground">{a.id}</span> },
    { key: 'patientName', header: 'Patient', sortable: true, render: (a) => <span className="font-medium text-foreground">{a.patientName}</span> },
    { key: 'doctorName', header: 'Doctor', sortable: true, render: (a) => <span className="text-muted-foreground">{a.doctorName}</span> },
    { key: 'departmentName', header: 'Department', sortable: true, render: (a) => <span className="text-muted-foreground">{a.departmentName}</span> },
    { key: 'date', header: 'Date', sortable: true, render: (a) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(a.date)}</span> },
    { key: 'time', header: 'Time', sortable: true, render: (a) => <span className="whitespace-nowrap text-foreground">{formatTime(a.time)}</span> },
    { key: 'type', header: 'Type', sortable: true, render: (a) => <span className="text-muted-foreground">{a.type}</span> },
    { key: 'reason', header: 'Reason', sortable: true, render: (a) => <span className="max-w-40 truncate text-muted-foreground">{a.reason}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (a) => <StatusBadge status={a.status} /> },
    { key: 'actions', header: '', align: 'right', render: actionsColumn },
  ];

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Manage bookings, check-ins and the daily clinic schedule."
        actions={
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New appointment
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={(t) => setTab(t as TabId)}
        className="mb-4"
        items={[
          { id: 'today', label: "Today's appointments", count: todaysList.length },
          { id: 'upcoming', label: 'Upcoming', count: upcomingList.length },
          { id: 'all', label: 'All appointments', count: appointments?.length },
          { id: 'calendar', label: 'Calendar', icon: CalendarDays },
        ]}
      />

      {error ? (
        <Card>
          <CardContent>
            <ErrorState message={error} onRetry={reload} />
          </CardContent>
        </Card>
      ) : tab === 'calendar' ? (
        <Card>
          <CardContent className="pt-5">
            <AppointmentCalendar
              appointments={appointments ?? []}
              onReschedule={(a) => {
                setEditing(a);
                setFormOpen(true);
              }}
              onCancel={(a) => setCancelling(a)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            {tab !== 'today' && (
              <div className="flex w-full flex-wrap items-center gap-3">
                <SearchBar
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={() => setSearch('')}
                  placeholder="Search by patient, reason or ID…"
                  className="w-full sm:w-72"
                />
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
                  <option value="">All statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="waiting">Waiting</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
                <Select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="w-56">
                  <option value="">All doctors</option>
                  {doctors?.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable
              columns={columns}
              data={tab === 'today' ? todaysList : tab === 'upcoming' ? upcomingList : filtered}
              rowKey={(a) => a.id}
              loading={loading}
              pageSize={9}
              empty={
                <EmptyState
                  icon={<CalendarDays className="h-6 w-6" />}
                  title={tab === 'today' ? 'No appointments today' : tab === 'upcoming' ? 'No upcoming appointments' : 'No appointments found'}
                  description={
                    tab === 'today'
                      ? 'Once patients book for today, their appointments will show here.'
                      : search || statusFilter || doctorFilter
                        ? 'Try adjusting your search or filters.'
                        : undefined
                  }
                />
              }
            />
          </CardContent>
        </Card>
      )}

      <AppointmentFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSearchParams({}, { replace: true });
        }}
        appointment={editing}
        onSaved={reload}
      />

      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={confirmCancel}
        loading={busy}
        title="Cancel appointment"
        confirmLabel="Yes, cancel appointment"
        message={
          cancelling
            ? `Are you sure you want to cancel ${cancelling.id} for ${cancelling.patientName} on ${formatDate(cancelling.date)} at ${formatTime(cancelling.time)}? The patient will need to be notified.`
            : ''
        }
      />
    </div>
  );
}

