import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime, todayISO } from '@/utils/date';
import type { EnrichedAppointment } from '@/types';

export interface AppointmentCalendarProps {
  appointments: EnrichedAppointment[];
  onReschedule: (appointment: EnrichedAppointment) => void;
  onCancel: (appointment: EnrichedAppointment) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AppointmentCalendar({ appointments, onReschedule, onCancel }: AppointmentCalendarProps) {
  const today = todayISO();
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, EnrichedAppointment[]>();
    for (const a of appointments) {
      const list = map.get(a.date) ?? [];
      list.push(a);
      map.set(a.date, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [appointments]);

  const cells = useMemo(() => {
    const first = new Date(viewDate.year, viewDate.month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
    const cellsArray: Array<{ date: string | null; day: number; inMonth: boolean }> = [];
    for (let i = 0; i < startOffset; i++) cellsArray.push({ date: null, day: 0, inMonth: false });
    for (let d = 1; d <= daysInMonth; d++) {
      cellsArray.push({
        date: `${viewDate.year}-${String(viewDate.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        day: d,
        inMonth: true,
      });
    }
    return cellsArray;
  }, [viewDate]);

  const monthLabel = new Date(viewDate.year, viewDate.month, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta: number) => {
    setViewDate((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const dayAppointments = selectedDate ? (byDate.get(selectedDate) ?? []) : [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const d = new Date();
              setViewDate({ year: d.getFullYear(), month: d.getMonth() });
            }}
            className="inline-flex h-8 items-center rounded-md border border-border bg-card px-3 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Today
          </button>
          <button
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={`empty-${i}`} aria-hidden />;
          const list = byDate.get(cell.date) ?? [];
          const isToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          return (
            <button
              key={cell.date}
              onClick={() => setSelectedDate(cell.date)}
              aria-label={`${formatDate(cell.date)} — ${list.length} appointment${list.length === 1 ? '' : 's'}`}
              className={cn(
                'flex min-h-16 flex-col items-stretch gap-1 rounded-lg border p-1.5 text-left transition-colors sm:min-h-20',
                isSelected
                  ? 'border-primary bg-primary-soft'
                  : isToday
                    ? 'border-primary/60 bg-primary-soft/40 hover:border-primary'
                    : 'border-border bg-card hover:border-border-strong',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold',
                  isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                {cell.day}
              </span>
              <span className="hidden flex-1 flex-col gap-0.5 sm:flex">
                {list.slice(0, 3).map((a) => (
                  <span
                    key={a.id}
                    className="truncate rounded bg-info-soft px-1 py-0.5 text-[10px] font-medium text-info-strong"
                  >
                    {a.time} {a.patientName.split(' ').slice(0, 2).join(' ')}
                  </span>
                ))}
                {list.length > 3 && (
                  <span className="px-1 text-[10px] text-muted-foreground">+{list.length - 3} more</span>
                )}
              </span>
              <span className="sm:hidden">
                {list.length > 0 && (
                  <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day details */}
      <Modal
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? formatDate(selectedDate) : ''}
        description={`${dayAppointments.length} appointment${dayAppointments.length === 1 ? '' : 's'} on this day`}
        size="lg"
      >
        {dayAppointments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No appointments scheduled for this day.</p>
        ) : (
          <ul className="divide-y divide-border">
            {dayAppointments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="w-14 shrink-0 text-sm font-semibold text-foreground">{formatTime(a.time)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.patientName}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.doctorName} · {a.departmentName} · {a.reason}</p>
                </div>
                <StatusBadge status={a.status} />
                <div className="flex gap-1.5">
                  {(a.status === 'scheduled' || a.status === 'waiting') && (
                    <Button size="sm" variant="outline" onClick={() => { setSelectedDate(null); onReschedule(a); }}>
                      Reschedule
                    </Button>
                  )}
                  {(a.status === 'scheduled' || a.status === 'waiting' || a.status === 'in_progress') && (
                    <Button size="sm" variant="destructive" onClick={() => { setSelectedDate(null); onCancel(a); }}>
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
