import { useParams, useNavigate } from 'react-router-dom';
import { CalendarClock, FlaskRound, Microscope, TestTube, UserRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { laboratoryService } from '@/services/laboratoryService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import { formatDate, formatDateTime } from '@/utils/date';

const STEPS = [
  { key: 'requested', label: 'Requested' },
  { key: 'collected', label: 'Sample collected' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
] as const;

export function LabTestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isLabStaff = user?.role === 'lab_technician' || user?.role === 'admin';

  const { data: test, loading, error, reload } = useAsyncData(() => laboratoryService.getLabTestById(id ?? ''), [id]);

  if (loading) return <LoadingState label="Loading lab test…" />;
  if (!test) {
    return (
      <div>
        <PageHeader title="Lab test" />
        <ErrorState title="Test not found" message={error ?? `No lab test exists with ID ${id}.`} onRetry={reload} />
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === test.status);

  const advance = async (next: (typeof STEPS)[number]['key'], message: string) => {
    try {
      await laboratoryService.setStatus(test.id, next);
      toast({ title: 'Lab test updated', description: message, variant: 'success' });
      reload();
    } catch (err) {
      toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    }
  };

  const nextAction =
    test.status === 'requested' ? (
      <Button icon={<TestTube className="h-4 w-4" />} onClick={() => advance('collected', 'Sample marked as collected.')}>
        Collect sample
      </Button>
    ) : test.status === 'collected' ? (
      <Button icon={<FlaskRound className="h-4 w-4" />} onClick={() => advance('processing', 'Processing started.')}>
        Start processing
      </Button>
    ) : test.status === 'processing' ? (
      <Button onClick={() => navigate('/laboratory')}>Complete in lab queue</Button>
    ) : null;

  return (
    <div>
      <PageHeader title="Laboratory test details" backTo="/laboratory" backLabel="All tests" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Test info */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>{test.testName}</CardTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {test.id} · ordered {formatDate(test.orderedDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={test.priority} />
                <StatusBadge status={test.status} />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Patient</dt>
                <dd className="mt-0.5 font-medium text-foreground">{test.patientName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Requesting doctor</dt>
                <dd className="mt-0.5 font-medium text-foreground">{test.doctorName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sample type</dt>
                <dd className="mt-0.5 font-medium text-foreground">{test.sampleType}</dd>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              {test.result ? (
                <div className="space-y-4">
                  <div className={cn('rounded-lg border px-4 py-3.5', test.abnormal ? 'border-destructive/40 bg-destructive-soft' : 'border-border bg-muted/50')}>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-2xl font-bold tracking-tight text-foreground">
                        {test.result} {test.unit && <span className="text-base font-medium text-muted-foreground">{test.unit}</span>}
                      </span>
                      <Badge variant={test.abnormal ? 'danger' : 'success'} dot>
                        {test.abnormal ? 'Abnormal' : 'Normal'}
                      </Badge>
                    </div>
                    {test.referenceRange && (
                      <p className="mt-1 text-xs text-muted-foreground">Reference range: {test.referenceRange}</p>
                    )}
                  </div>
                  {test.notes && <p className="text-sm text-muted-foreground">{test.notes}</p>}
                  <p className="text-xs text-muted-foreground">
                    {test.completedAt ? `Completed ${formatDateTime(test.completedAt)}` : 'Result pending'}
                  </p>
                </div>
              ) : (
                <p className="py-4 text-sm text-muted-foreground">
                  Result not yet entered. {isLabStaff ? 'Use the workflow below to progress the test.' : 'Check back after the laboratory has processed the sample.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: workflow + timeline */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-0">
                {STEPS.map((step, i) => {
                  const done = i < currentStepIndex;
                  const current = i === currentStepIndex;
                  return (
                    <li key={step.key} className="relative flex items-start gap-3 pb-5 last:pb-0">
                      {i < STEPS.length - 1 && (
                        <span className={cn('absolute left-[11px] top-6 h-full w-0.5', done ? 'bg-primary' : 'bg-border')} aria-hidden />
                      )}
                      <span
                        className={cn(
                          'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                          done ? 'border-primary bg-primary text-primary-foreground' : current ? 'border-primary bg-primary-soft text-primary-strong' : 'border-border-strong bg-card text-muted-foreground',
                        )}
                      >
                        {done ? '✓' : i + 1}
                      </span>
                      <div className="pt-0.5">
                        <p className={cn('text-sm font-medium', current ? 'text-primary-strong' : 'text-foreground')}>{step.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {step.key === 'collected' && test.collectedAt ? formatDateTime(test.collectedAt) : step.key === 'completed' && test.completedAt ? formatDateTime(test.completedAt) : '—'}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {isLabStaff && (
                <div className="mt-4 border-t border-border pt-4">{nextAction}</div>
              )}
              <Button variant="outline" size="sm" className="mt-3 w-full" icon={<UserRound className="h-3.5 w-3.5" />} onClick={() => navigate(`/patients/${test.patientId}`)}>
                Open patient profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" aria-hidden /> Ordered</dt>
                  <dd className="font-medium text-foreground">{formatDate(test.orderedDate)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><Microscope className="h-3.5 w-3.5" aria-hidden /> Sample</dt>
                  <dd className="font-medium text-foreground">{test.sampleType}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Priority</dt>
                  <dd><StatusBadge status={test.priority} /></dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
