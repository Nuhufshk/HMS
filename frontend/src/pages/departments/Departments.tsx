import { useMemo, useState } from 'react';
import {
  Ambulance,
  Baby,
  Brain,
  Building2,
  FlaskConical,
  HeartPulse,
  HeartHandshake,
  MapPin,
  Phone,
  Pill,
  ScanLine,
  Scissors,
  Stethoscope,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/States';
import { departmentService } from '@/services/departmentService';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { Department } from '@/types';

const DEPT_ICONS: Record<string, LucideIcon> = {
  GEN: Stethoscope,
  PED: Baby,
  CAR: HeartPulse,
  NEU: Brain,
  EME: Ambulance,
  SUR: Scissors,
  MAT: HeartHandshake,
  LAB: FlaskConical,
  PHA: Pill,
  RAD: ScanLine,
};

export function Departments() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Department | null>(null);
  const { data: departments, loading, error, reload } = useAsyncData(() => departmentService.getDepartments(), []);
  const { data: staff } = useAsyncData(
    () => (selected ? departmentService.getDepartmentStaff(selected.id) : Promise.resolve({ doctors: [], nurses: [] })),
    [selected?.id],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (departments ?? []).filter(
      (d) => !q || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.headName.toLowerCase().includes(q),
    );
  }, [departments, search]);

  return (
    <div>
      <PageHeader title="Departments" description="Clinical units, heads of department and staffing levels." />

      <div className="mb-4 max-w-sm">
        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search departments…" />
      </div>

      {error ? (
        <Card><CardContent><ErrorState message={error} onRetry={reload} /></CardContent></Card>
      ) : loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <Card><CardContent><EmptyState icon={<Building2 className="h-6 w-6" />} title="No departments found" description="Try a different search term." /></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((d) => {
            const Icon = DEPT_ICONS[d.code] ?? Building2;
            return (
              <Card key={d.id} className="transition-shadow hover:shadow-md">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
                      <Icon className="h-5.5 w-5.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-foreground">{d.name}</h3>
                        <StatusBadge status={d.status === 'active' ? 'operational' : 'inactive'} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Head: <span className="font-medium text-foreground">{d.headName}</span>
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{d.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { icon: Stethoscope, label: 'Doctors', value: d.doctors },
                      { icon: HeartPulse, label: 'Nurses', value: d.nurses },
                      { icon: Users, label: 'Patients', value: d.patients },
                    ].map(({ icon: StatIcon, label, value }) => (
                      <div key={label} className="rounded-lg bg-muted px-2 py-2 text-center">
                        <StatIcon className="mx-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        <p className="mt-1 text-base font-bold text-foreground">{value}</p>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" aria-hidden /><span className="truncate">{d.location}</span></span>
                    <span className="inline-flex shrink-0 items-center gap-1"><Phone className="h-3 w-3" aria-hidden />{d.phone}</span>
                  </div>

                  <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setSelected(d)}>
                    View department
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Department detail */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        description={selected ? `${selected.code} · ${selected.location}` : undefined}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-muted-foreground">{selected.description}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Doctors', value: selected.doctors },
                { label: 'Nurses', value: selected.nurses },
                { label: 'Patients', value: selected.patients },
                { label: 'Status', value: selected.status === 'active' ? 'Operational' : 'Inactive' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-muted px-3 py-2.5 text-center">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 text-base font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Stethoscope className="h-3.5 w-3.5" aria-hidden /> Doctors
                </p>
                {staff?.doctors.length ? (
                  <ul className="space-y-1.5">
                    {staff.doctors.map((name) => (
                      <li key={name} className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground">{name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No doctors listed.</p>
                )}
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <HeartPulse className="h-3.5 w-3.5" aria-hidden /> Nurses
                </p>
                {staff?.nurses.length ? (
                  <ul className="space-y-1.5">
                    {staff.nurses.map((name) => (
                      <li key={name} className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground">{name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No nurses listed.</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" aria-hidden />{selected.phone}</span>
              <Badge variant="outline">Head: {selected.headName}</Badge>
              <StatusBadge status={selected.status === 'active' ? 'operational' : 'inactive'} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
