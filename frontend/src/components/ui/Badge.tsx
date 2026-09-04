import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { VARIANT_CLASSES, type StatusVariant } from '@/constants/status';

export interface BadgeProps {
  variant?: StatusVariant | 'outline';
  children: ReactNode;
  className?: string;
  dot?: boolean;
  title?: string;
}

export function Badge({ variant = 'neutral', children, className, dot, title }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'outline'
          ? 'border border-border bg-card text-muted-foreground'
          : VARIANT_CLASSES[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            variant !== 'outline' ? 'bg-current' : 'bg-muted-foreground',
          )}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
