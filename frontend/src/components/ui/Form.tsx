import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

/* ------------------------------ Label ---------------------------------- */

export function Label({
  htmlFor,
  required,
  children,
  className,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1.5 block text-sm font-medium text-foreground', className)}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-destructive" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}

/* ----------------------------- FormField ------------------------------- */

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, required, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label ?? ''}
      </Label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive-strong" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------- Input --------------------------------- */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, leftIcon, rightElement, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'h-9.5 w-full rounded-md border bg-input px-3 text-sm text-foreground shadow-sm transition-colors',
          'placeholder:text-muted-foreground/70',
          'hover:border-border-strong',
          'focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-ring/40',
          'disabled:cursor-not-allowed disabled:opacity-55',
          error ? 'border-destructive focus:border-destructive focus:outline-destructive/40' : 'border-border',
          leftIcon ? 'pl-9' : undefined,
          rightElement ? 'pr-10' : undefined,
          className,
        )}
        aria-invalid={error || undefined}
        {...rest}
      />
      {rightElement && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-2">{rightElement}</span>
      )}
    </div>
  );
});

/* ------------------------------ Textarea ------------------------------- */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border bg-input px-3 py-2 text-sm text-foreground shadow-sm transition-colors',
        'placeholder:text-muted-foreground/70',
        'hover:border-border-strong',
        'focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-ring/40',
        'disabled:cursor-not-allowed disabled:opacity-55',
        error ? 'border-destructive focus:border-destructive focus:outline-destructive/40' : 'border-border',
        className,
      )}
      aria-invalid={error || undefined}
      {...rest}
    />
  );
});

/* ------------------------------- Select -------------------------------- */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error, placeholder, className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'h-9.5 w-full appearance-none rounded-md border bg-input px-3 pr-9 text-sm text-foreground shadow-sm transition-colors',
          'hover:border-border-strong',
          'focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-ring/40',
          'disabled:cursor-not-allowed disabled:opacity-55',
          error ? 'border-destructive' : 'border-border',
          className,
        )}
        aria-invalid={error || undefined}
        {...rest}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
    </div>
  );
});

/* ------------------------------ Checkbox ------------------------------- */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cn('inline-flex cursor-pointer items-center gap-2.5', className)}>
      <span className="relative inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="peer h-4.5 w-4.5 appearance-none rounded border border-border-strong bg-input transition-colors checked:border-primary checked:bg-primary hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55"
          {...rest}
        />
        <Check className="pointer-events-none absolute h-3.5 w-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
      </span>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </label>
  );
});

/* -------------------------------- Radio -------------------------------- */

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode;
  description?: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cn('inline-flex cursor-pointer items-start gap-2.5', className)}>
      <input
        ref={ref}
        id={inputId}
        type="radio"
        className="peer mt-0.5 h-4 w-4 shrink-0 appearance-none rounded-full border border-border-strong bg-input transition-colors checked:border-primary checked:bg-primary hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55"
        {...rest}
      />
      {label !== undefined && (
        <span className="text-sm leading-5 text-foreground">
          {label}
          {description && <span className="block text-xs text-muted-foreground">{description}</span>}
        </span>
      )}
    </label>
  );
});

/* -------------------------------- Switch ------------------------------- */

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode;
  description?: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, description, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cn('inline-flex cursor-pointer items-start gap-3', className)}>
      <span className="relative inline-flex h-5.5 w-10 shrink-0 items-center">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          role="switch"
          className="peer h-5.5 w-10 appearance-none rounded-full border border-border-strong bg-secondary transition-colors checked:border-primary checked:bg-primary hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55"
          {...rest}
        />
        <span className="pointer-events-none absolute left-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-[18px] peer-checked:bg-primary-foreground" />
      </span>
      {(label !== undefined || description !== undefined) && (
        <span className="text-sm leading-5 text-foreground">
          {label}
          {description && <span className="block text-xs text-muted-foreground">{description}</span>}
        </span>
      )}
    </label>
  );
});
