import { forwardRef, type InputHTMLAttributes } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Accessible date input (native picker) styled for the app. */
export const DatePicker = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function DatePicker({ className, ...rest }, ref) {
    return (
      <div className="relative">
        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          ref={ref}
          type="date"
          className={cn(
            'h-9.5 w-full rounded-md border border-border bg-input pl-9 pr-3 text-sm text-foreground shadow-sm transition-colors',
            'hover:border-border-strong focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-ring/40',
            'dark:[color-scheme:dark]',
            className,
          )}
          {...rest}
        />
      </div>
    );
  },
);
