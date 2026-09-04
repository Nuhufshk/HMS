import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Search, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { patientService } from '@/services/patientService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { formatDate } from '@/utils/date';
import { useAuth } from '@/context/AuthContext';

export function MedicalRecords() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const patientsReq = useAsyncData(() => patientService.getPatients(), []);

  const canRegister = user?.role === 'receptionist' || user?.role === 'admin' || user?.role === 'doctor' || user?.role === 'nurse';

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = patientsReq.data ?? [];
    if (!q) return list;
    return list.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q),
    );
  }, [patientsReq.data, search]);

  return (
    <div>
      <PageHeader
        title="Medical records"
        description="Select a patient to view their clinical timeline — diagnoses, vitals, notes and treatment plans."
        actions={
          canRegister ? (
            <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => navigate('/patients')}>
              Register patient
            </Button>
          ) : undefined
        }
      />

      {patientsReq.loading ? (
        <LoadingState />
      ) : patientsReq.error ? (
        <ErrorState message={patientsReq.error} onRetry={patientsReq.reload} />
      ) : (
        <Card>
          <CardContent>
            <div className="relative mb-4 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patients by name, ID or city…"
                aria-label="Search patients"
                className="h-9.5 w-full rounded-md border border-border bg-input pl-9 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/70 hover:border-border-strong focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-ring/40"
              />
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-6 w-6" />}
                title="No patients found"
                description={search ? `No patients match “${search}”.` : 'No patients have been registered yet.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2.5">Patient</th>
                      <th className="px-3 py-2.5">Patient ID</th>
                      <th className="hidden px-3 py-2.5 md:table-cell">Date of birth</th>
                      <th className="hidden px-3 py-2.5 md:table-cell">Gender</th>
                      <th className="hidden px-3 py-2.5 lg:table-cell">Blood</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="w-10 px-3 py-2.5">
                        <span className="sr-only">Open</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => navigate(`/medical-records/${p.id}`)}
                        className="cursor-pointer border-b border-border/70 transition-colors last:border-0 hover:bg-muted/60"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={`${p.firstName} ${p.lastName}`} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{p.firstName} {p.lastName}</p>
                              <p className="truncate text-xs text-muted-foreground">{p.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="font-mono">{p.id}</Badge>
                        </td>
                        <td className="hidden px-3 py-3 text-sm text-muted-foreground md:table-cell">{formatDate(p.dateOfBirth)}</td>
                        <td className="hidden px-3 py-3 text-sm text-foreground md:table-cell">{p.gender}</td>
                        <td className="hidden px-3 py-3 text-sm text-foreground lg:table-cell">{p.bloodGroup}</td>
                        <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-3 py-3 text-right">
                          <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
