import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  FlaskConical,
  LogOut,
  Menu,
  Pill,
  Receipt,
  Search,
  Stethoscope,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useToast } from '@/context/ToastContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { searchService, type GlobalSearchResults } from '@/services/searchService';
import { useDebouncedValue } from '@/hooks/useAsyncData';
import { timeAgo, todayLong } from '@/utils/date';
import { cn } from '@/utils/cn';

const TYPE_ICON: Record<string, LucideIcon> = {
  appointment: CalendarDays,
  lab: FlaskConical,
  pharmacy: Pill,
  billing: Receipt,
  patient: Users,
  system: Bell,
};

export function Navbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResults>({
    patients: [],
    doctors: [],
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query, 220);

  useEffect(() => {
    let alive = true;
    if (!debouncedQuery.trim()) {
      setResults({ patients: [], doctors: [] });
      return;
    }
    searchService.searchAll(debouncedQuery).then((r) => {
      if (alive) setResults(r);
    });
    return () => {
      alive = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const onPointer = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  const handleLogout = () => {
    logout();
    toast({ title: 'Signed out', description: 'You have been logged out of your session.', variant: 'info' });
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 sm:px-6">
      <button
        onClick={onOpenMobile}
        aria-label="Open navigation menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Global search */}
      <div ref={searchRef} className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              navigate(`/patients?q=${encodeURIComponent(query.trim())}`);
              setSearchOpen(false);
            }
          }}
          placeholder="Search patients, doctors…"
          aria-label="Global search"
          className="h-9.5 w-full rounded-md border border-border bg-input pl-9 pr-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/70 hover:border-border-strong focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-ring/40"
        />
        {searchOpen && query.trim() && (
          <div className="animate-pop-in absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
            <div className="max-h-96 overflow-y-auto p-1.5">
              {results.patients.length === 0 && results.doctors.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results for “{query}”</p>
              ) : (
                <>
                  {results.patients.length > 0 && (
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Patients</p>
                  )}
                  {results.patients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        navigate(`/patients/${p.id}`);
                        setSearchOpen(false);
                        setQuery('');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                      <span className="flex-1 truncate">{p.firstName} {p.lastName}</span>
                      <span className="text-xs text-muted-foreground">{p.id}</span>
                    </button>
                  ))}
                  {results.doctors.length > 0 && (
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Doctors</p>
                  )}
                  {results.doctors.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        navigate(`/doctors/${d.id}`);
                        setSearchOpen(false);
                        setQuery('');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <Stethoscope className="h-4 w-4 text-muted-foreground" aria-hidden />
                      <span className="flex-1 truncate">{d.name}</span>
                      <span className="text-xs text-muted-foreground">{d.specialization}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
            <button
              onClick={() => {
                navigate(`/patients?q=${encodeURIComponent(query)}`);
                setSearchOpen(false);
              }}
              className="flex w-full items-center justify-center gap-1.5 border-t border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all patients
              <ArrowRight className="h-3 w-3" aria-hidden />
            </button>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <p className="hidden text-sm text-muted-foreground xl:block" aria-label="Today's date">
          {todayLong()}
        </p>

        <ThemeToggle />

      {/* Notifications */}
      <Dropdown
        ariaLabel="Notifications"
        align="right"
        width="w-[22rem]"
        trigger={
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Bell className="h-[18px] w-[18px]" aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </span>
        }
      >
        {(close) => (
          <div>
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-strong transition-colors hover:text-primary-hover"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[22rem] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up 🎉</p>
              ) : (
                notifications.slice(0, 8).map((n) => {
                  const Icon = TYPE_ICON[n.type] ?? Bell;
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        close();
                        if (n.link) navigate(n.link);
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/60',
                        !n.read && 'bg-primary-soft/40',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                          n.read ? 'bg-muted text-muted-foreground' : 'bg-primary-soft text-primary-strong',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('flex items-center gap-2 text-sm', n.read ? 'text-foreground' : 'font-semibold text-foreground')}>
                          <span className="truncate">{n.title}</span>
                          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-info" aria-label="Unread" />}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{n.message}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground/80">{timeAgo(n.time)}</span>
                      </span>
                      {!n.read && (
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label="Mark as read"
                          className="mt-0.5 rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary-strong"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </Dropdown>

      {/* User menu */}
      {user && (
        <Dropdown
          ariaLabel="User menu"
          align="right"
          width="w-60"
          trigger={
            <span className="flex items-center gap-2.5 rounded-md p-1 pr-2 transition-colors hover:bg-muted">
              <Avatar name={user.name} size="sm" />
              <span className="hidden text-left leading-tight md:block">
                <span className="block max-w-[9rem] truncate text-sm font-semibold text-foreground">{user.name}</span>
                <span className="block text-xs text-muted-foreground">{user.roleLabel}</span>
              </span>
            </span>
          }
        >
          {(close) => (
            <div className="p-1.5">
              <div className="border-b border-border px-2.5 pb-2 pt-1.5">
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="pt-1.5">
                <DropdownItem
                  icon={<UserRound className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    navigate('/profile');
                  }}
                >
                  Profile
                </DropdownItem>
                <DropdownItem danger icon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
                  Log out
                </DropdownItem>
              </div>
            </div>
          )}
        </Dropdown>
      )}
      </div>
    </header>
  );
}

