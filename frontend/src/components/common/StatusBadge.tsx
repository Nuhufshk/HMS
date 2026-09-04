import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { STATUS_META } from '@/constants/status';

/**
 * Renders a semantic status badge from a status key (e.g. "in_progress").
 * The status → tone mapping lives centrally in constants/status.ts.
 */
export function StatusBadge({
  status,
  className,
  title,
}: {
  status: string;
  className?: string;
  title?: string;
}) {
  const meta = STATUS_META[status] ?? { variant: 'neutral' as const, label: status };
  return (
    <Badge variant={meta.variant} dot className={className} title={title}>
      {meta.label}
    </Badge>
  );
}
