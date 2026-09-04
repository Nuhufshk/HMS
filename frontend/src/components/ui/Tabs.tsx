import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export function Tabs({ items, value, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div role="tablist" className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}>
        {items.map((item) => {
          const active = item.id === value;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" aria-hidden />}
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" className={cn('flex items-center gap-1 overflow-x-auto border-b border-border', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 pb-2.5 pt-1 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-primary-strong'
                : 'border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground',
            )}
          >
            {item.icon && <item.icon className="h-4 w-4" aria-hidden />}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none',
                  active ? 'bg-primary-soft text-primary-strong' : 'bg-muted text-muted-foreground',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
