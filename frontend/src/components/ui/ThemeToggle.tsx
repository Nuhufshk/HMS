import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/context/ThemeContext';
import { Dropdown, DropdownItem } from './Dropdown';
import { cn } from '@/utils/cn';

const OPTIONS: Array<{ id: ThemePreference; label: string; icon: typeof Sun }> = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolved, setTheme } = useTheme();

  const CurrentIcon = resolved === 'dark' ? Moon : Sun;

  return (
    <Dropdown
      ariaLabel="Change colour theme"
      align="right"
      width="w-44"
      trigger={
        <span
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            className,
          )}
        >
          <CurrentIcon className="h-[18px] w-[18px]" aria-hidden />
        </span>
      }
    >
      {(close) => (
        <div className="p-1">
          <p className="px-2.5 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">Theme</p>
          {OPTIONS.map((opt) => {
            const active = theme === opt.id;
            return (
              <button
                key={opt.id}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(opt.id);
                  close();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted',
                  active ? 'font-medium text-primary-strong' : 'text-foreground',
                )}
              >
                <opt.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span className="flex-1 text-left">{opt.label}</span>
                {active && <Check className="h-4 w-4 text-primary" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </Dropdown>
  );
}

export { OPTIONS as THEME_OPTIONS };
