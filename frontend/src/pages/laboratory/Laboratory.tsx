import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beaker, Eye, FlaskConical, FlaskRound, Play, TestTube } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Textarea } from '@/components/ui/Form';
import { Checkbox } from '@/components/ui/Form';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Form';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { laboratoryService } from '@/services/laboratoryService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import type { EnrichedLabTest, LabResultInput, LabStatus } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { cn } from '@/utils/cn';

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'requested', label: 'Requested' },
  { id: 'collected', label: 'Collected' },
  { id: 'processing', label: 'Processing' },
  { id: 'completed', label: 'Completed' },
];

export function Laboratory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isLabStaff = user?.role === 'lab_technician' || user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const { data: tests, loading, error, reload } = useAsyncData(() => laboratoryService.getLabTests(), []);
  const [resultTarget, setResultTarget] = useState<EnrichedLabTest | null>(null);

  const counts = useMemo(() => {
    const list = tests ?? [];
    return {
      all: list.length,
      requested: list.filter((t) => t.status === 'requested').length,
      collected: list.filter((t) => t.status === 'collected').length,
      processing: list.filter((t) => t.status === 'processing').length,
      completed: list.filter((t) => t.status === 'completed').length,
    };
  }, [tests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tests ?? []).filter((t) => {
      const matchesQuery = !q || t.id.toLowerCase().includes(q) || t.patientName.toLowerCase().includes(q) || t.testName.toLowerCase().includes(q);
      const matchesStatus = !status || t.status === status;
      const matchesPriority = !priority || t.priority === priority;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [tests, search, status, priority]);

  const advance = async (t: EnrichedLabTest, next: LabStatus, message: string) => {
    try {
      await laboratoryService.setStatus(t.id, next);
      toast({ title: 'Lab test updated', description: `${t.id} — ${message}`, variant: 'success' });
      reload();
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    }
  };

  const columns: Column<EnrichedLabTest>[] = [
    { key: 'id', header: 'Test ID', sortable: true, render: (t) => <span className="font-mono text-xs text-muted-foreground">{t.id}</span> },
    {
      key: 'testName',
      header: 'Test',
      sortable: true,
      render: (t) => (
        <div className="leading-tight">
          <p className="font-medium text-foreground">{t.testName}</p>
          <p className="text-[11px] text-muted-foreground">{t.sampleType} sample</p>
        </div>
      ),
    },
    { key: 'patientName', header: 'Patient', sortable: true, render: (t) => <span className="text-foreground">{t.patientName}</span> },
    { key: 'doctorName', header: 'Doctor', sortable: true, render: (t) => <span className="text-muted-foreground">{t.doctorName}</span> },
    { key: 'orderedDate', header: 'Ordered', sortable: true, render: (t) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(t.orderedDate)}</span> },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: (t) => (
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', t.priority === 'stat' ? 'bg-destructive-soft text-destructive-strong' : t.priority === 'urgent' ? 'bg-warning-soft text-warning-strong' : 'bg-info-soft text-info-strong')}>
          {t.priority === 'stat' ? '⚡ STAT' : t.priority === 'urgent' ? '◷ Urgent' : '• Routine'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', sortable: true, render: (t) => <StatusBadge status={t.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" variant="outline" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => navigate(`/laboratory/${t.id}`)}>
            View
          </Button>
          {isLabStaff && t.status === 'requested' && (
            <Button size="sm" variant="secondary" icon={<TestTube className="h-3.5 w-3.5" />} onClick={() => advance(t, 'collected', 'sample collected.')}>
              Collect
            </Button>
          )}
          {isLabStaff && t.status === 'collected' && (
            <Button size="sm" variant="secondary" icon={<Play className="h-3.5 w-3.5" />} onClick={() => advance(t, 'processing', 'processing started.')}>
              Process
            </Button>
          )}
          {isLabStaff && (t.status === 'processing' || t.status === 'collected') && (
            <Button size="sm" icon={<FlaskRound className="h-3.5 w-3.5" />} onClick={() => setResultTarget(t)}>
              Enter result
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Laboratory" description="Test requests, sample tracking and result reporting." />

      {/* Status summary */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUS_TABS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatus(s.id)}
            className={cn(
              'rounded-xl border px-4 py-3 text-left transition-colors',
              status === s.id ? 'border-primary bg-primary-soft' : 'border-border bg-card hover:border-border-strong',
            )}
          >
            <span className="block text-xl font-bold text-foreground">{counts[s.id as keyof typeof counts]}</span>
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex w-full flex-wrap items-center gap-3">
            <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search by ID, patient or test…" className="w-full sm:w-72" />
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-36">
              <option value="">All priorities</option>
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
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
              rowKey={(t) => t.id}
              loading={loading}
              pageSize={9}
              empty={
                <EmptyState
                  icon={<FlaskConical className="h-6 w-6" />}
                  title="No laboratory tests found"
                  description={search || status || priority ? 'Try adjusting your search or filters.' : undefined}
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <LabResultModal test={resultTarget} onClose={() => setResultTarget(null)} onSaved={reload} />
    </div>
  );
}

/* --------------------------- Enter result modal --------------------------- */

function LabResultModal({
  test,
  onClose,
  onSaved,
}: {
  test: EnrichedLabTest | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LabResultInput & { abnormal?: boolean }>({ result: '', unit: '', referenceRange: '', notes: '', abnormal: false });

  useEffect(() => {
    if (!test) return;
    setForm({
      result: test.result ?? '',
      unit: test.unit ?? '',
      referenceRange: test.referenceRange ?? '',
      notes: test.notes ?? '',
      abnormal: test.abnormal ?? false,
    });
  }, [test]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!test) return;
    if (!form.result.trim()) {
      toast({ title: 'Result is required', description: 'Enter the test result before saving.', variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await laboratoryService.updateLabResult(test.id, {
        result: form.result.trim(),
        unit: form.unit?.trim() || undefined,
        referenceRange: form.referenceRange?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        abnormal: form.abnormal,
      });
      toast({ title: 'Result saved', description: `${test.id} (${test.testName}) is now completed.`, variant: 'success' });
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Could not save result', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!test}
      onClose={onClose}
      title="Enter laboratory result"
      description={test ? `${test.id} · ${test.testName} · ${test.patientName}` : undefined}
      size="lg"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="lab-result-form" loading={saving} icon={<Beaker className="h-4 w-4" />}>
            Save result
          </Button>
        </>
      }
    >
      <form id="lab-result-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Result" required hint="e.g. 11.2, Positive, Negative">
          <Input value={form.result} onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))} placeholder="Result value" />
        </FormField>
        <FormField label="Unit" hint="e.g. g/dL, mmol/L">
          <Input value={form.unit ?? ''} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="Optional" />
        </FormField>
        <FormField label="Reference range" hint="e.g. 12.0 – 16.0">
          <Input value={form.referenceRange ?? ''} onChange={(e) => setForm((f) => ({ ...f, referenceRange: e.target.value }))} placeholder="Optional" />
        </FormField>
        <FormField label="Notes / interpretation" className="sm:col-span-3">
          <Textarea rows={2} value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional clinical interpretation" />
        </FormField>
        <div className="sm:col-span-3">
          <Checkbox
            checked={form.abnormal ?? false}
            onChange={(e) => setForm((f) => ({ ...f, abnormal: e.target.checked }))}
            label="Flag as abnormal"
          />
        </div>
      </form>
    </Modal>
  );
}

