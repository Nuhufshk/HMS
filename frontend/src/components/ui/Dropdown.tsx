import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: 'left' | 'right';
  width?: string;
  ariaLabel?: string;
  triggerClassName?: string;
}

export function Dropdown({ trigger, children, align = 'right', width = 'w-56', ariaLabel, triggerClassName }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={cn('rounded-md transition-colors', triggerClassName)}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'animate-pop-in absolute z-50 mt-1.5 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            width,
          )}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  );
}

export interface DropdownItemProps {
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  closeOnClick?: boolean;
}

export function DropdownItem({ icon, children, onClick, danger, disabled, closeOnClick = true }: DropdownItemProps) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        if (closeOnClick && onClick) onClick();
      }}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
        'hover:bg-muted',
        danger ? 'text-destructive-strong hover:bg-destructive-soft' : 'text-foreground',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}
