import { cn } from '@/utils/cn';

/**
 * Hospital cross mark + pulse line, used for the brand.
 * `inverse` renders the mark for use on the green sidebar (white tile, green glyph).
 */
export function LogoMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={cn('h-9 w-9', className)} aria-hidden>
      <rect width="40" height="40" rx="10" className={inverse ? 'fill-white' : 'fill-primary'} />
      <path
        d="M16 10h8v6h6v8h-6v6h-8v-6h-6v-8h6v-6z"
        fill="currentColor"
        className={inverse ? 'text-primary-strong' : 'text-primary-foreground'}
      />
      <path
        d="M4.5 22h6l2.2-4.5 3.6 9 3-6 1.7 1.5h6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={inverse ? 'text-primary-strong' : 'text-white'}
      />
    </svg>
  );
}

export function Logo({
  collapsed = false,
  inverse = false,
  className,
}: {
  collapsed?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark inverse={inverse} />
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className={cn('truncate text-[15px] font-bold tracking-tight', inverse ? 'text-white' : 'text-foreground')}>
            Adom Medical Centre
          </p>
          <p className={cn('truncate text-[11px] font-medium', inverse ? 'text-white/70' : 'text-muted-foreground')}>
            Hospital Management System
          </p>
        </div>
      )}
    </div>
  );
}
