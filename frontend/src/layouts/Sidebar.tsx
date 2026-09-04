import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Logo } from '@/components/common/Logo';
import { navItemsForRole } from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const sections = user ? navItemsForRole(user.role) : [];

  // Close the mobile drawer on navigation.
  useEffect(() => {
    onCloseMobile();
  }, [location.pathname, onCloseMobile]);

  const content = (
    <>
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/15 px-4 dark:border-border">
        <Logo collapsed={collapsed} inverse />
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white lg:inline-flex dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white lg:hidden dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/60 dark:text-muted-foreground/80">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        collapsed && 'justify-center px-0',
                        // Light mode: green sidebar → white text, white active pill
                        active
                          ? 'bg-white text-primary-strong shadow-sm hover:bg-white hover:text-primary-strong'
                          : 'text-white/90 hover:bg-white/15 hover:text-white',
                        // Dark mode: slate-teal sidebar keeps the tinted active state
                        active
                          ? 'dark:bg-primary-soft dark:text-primary-strong dark:hover:bg-primary-soft dark:hover:text-primary-strong'
                          : 'dark:text-sidebar-foreground dark:hover:bg-muted dark:hover:text-foreground',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0',
                          active
                            ? 'text-primary-strong'
                            : 'text-white/70 group-hover:text-white dark:text-muted-foreground dark:group-hover:text-foreground',
                        )}
                        aria-hidden
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — logout */}
      {user && (
        <div className="shrink-0 border-t border-white/15 p-3 dark:border-border">
          <button
            onClick={logout}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-destructive-strong shadow-sm transition-colors hover:bg-white/90',
              collapsed && 'px-0',
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/15 bg-sidebar transition-[width] duration-200 lg:flex dark:border-border',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-slate-900/50 dark:bg-slate-950/70" onClick={onCloseMobile} aria-hidden />
          <aside className="animate-pop-in absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/15 bg-sidebar shadow-2xl dark:border-border">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
