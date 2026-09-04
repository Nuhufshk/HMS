import { cn } from '@/utils/cn';
import { initials } from '@/utils/format';

const TONES = [
  'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300',
  'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
];

function toneFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return TONES[hash % TONES.length];
}

export interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  className?: string;
}

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
};

export function Avatar({ name, size = 'md', src, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover', SIZES[size], className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold',
        SIZES[size],
        toneFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
