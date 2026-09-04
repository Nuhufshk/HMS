import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Eye, Pill } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Form';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/ui/States';
import { prescriptionService } from '@/services/prescriptionService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import type { EnrichedPrescription } from '@/types';
import { formatDate } from '@/utils/date';

export function PharmacyPrescriptions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data: prescriptions, loading, error, reload } = useAsyncData(() => prescriptionService.getPrescriptions(), []);
  const [viewing, setViewing] = useState<EnrichedPrescription | null>(null);
  const [dispensing, setDispensing] = useState<EnrichedPrescription | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (prescriptions ?? []).filter((p) => {
      const matchesQuery = !q || p.id.toLowerCase().includes(q) || p.patientName.toLowerCase().includes(q) || p.diagnosis.toLowerCase().includes(q);
      const matchesStatus = !status || p.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [prescriptions, search, status]);

  const confirmDispense = async () => {
    if (!dispensing) return;
    setBusy(true);
    try {
      await prescriptionService.dispensePrescription(dispensing.id);
      toast({
        title: 'Prescription dispensed',
        description: `${dispensing.id} for ${dispensing.patientName} was dispensed. Medicine stock updated.`,
        variant: 'success',
      });
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
    { key: 'patientName', header: 'Patient', sortable: true, render: (p) => <span className="font-medium text-foreground">{p.patientName}</span> },
    { key: 'doctorName', header: 'Doctor', sortable: true, render: (p) => <span className="text-muted-foreground">{p.doctorName}</span> },
    { key: 'date', header: 'Date', sortable: true, render: (p) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(p.date)}</span> },
    { key: 'diagnosis', header: 'Diagnosis', sortable: true, render: (p) => <span className="max-w-44 truncate text-muted-foreground">{p.diagnosis}</span> },
    {
      key: 'meds',
      header: 'Medicines',
      render: (p) => (
        <span className="text-muted-foreground">
          {p.medications.length} item{p.medications.length === 1 ? '' : 's'} · {p.medications[0]?.name}
        </span>
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
          {p.status === 'active' && (
            <Button size="sm" icon={<ClipboardCheck className="h-3.5 w-3.5" />} onClick={() => setDispensing(p)}>
              Dispense
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pharmacy prescriptions"
        description="Prescriptions awaiting dispensing at the pharmacy counter."
      />

      <Card>
        <CardHeader>
          <div className="flex w-full flex-wrap items-center gap-3">
            <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search by ID, patient or diagnosis…" className="w-full sm:w-72" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="dispensed">Dispensed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
              rowKey={(p) => p.id}
              loading={loading}
              pageSize={9}
              emptyTitle="No prescriptions found"
              emptyDescription="Try adjusting your search or filters."
            />
          )}
        </CardContent>
      </Card>

      {/* View prescription */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={`Prescription ${viewing?.id ?? ''}`}
        description={viewing ? `${viewing.patientName} · ${viewing.doctorName} · ${formatDate(viewing.date)}` : undefined}
        size="lg"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewing.status} />
              <span className="text-sm text-muted-foreground">{viewing.diagnosis}</span>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {viewing.medications.map((m, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3">
                  <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.dosage} · {m.frequency} · {m.duration}
                    </p>
                    {m.instructions && <p className="mt-1 text-xs italic text-muted-foreground">“{m.instructions}”</p>}
                  </div>
                </li>
              ))}
            </ul>
            {viewing.notes && (
              <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Notes:</span> {viewing.notes}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {viewing.status === 'active' && (
                <>
                  <Button icon={<ClipboardCheck className="h-4 w-4" />} onClick={() => { setDispensing(viewing); setViewing(null); }}>
                    Dispense now
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/patients/${viewing.patientId}`)}>
                    Open patient profile
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!dispensing}
        onClose={() => setDispensing(null)}
        onConfirm={confirmDispense}
        loading={busy}
        title="Dispense prescription"
        confirmLabel="Yes, dispense"
        message={
          dispensing
            ? `Dispense ${dispensing.id} for ${dispensing.patientName}? Medicine stock will be decremented for each medication line.`
            : ''
        }
      />
    </div>
  );
}
