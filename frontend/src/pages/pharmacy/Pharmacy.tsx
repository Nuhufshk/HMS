import { NavLink, Outlet } from 'react-router-dom';
import { Pill, ClipboardList } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Layout for the pharmacy module: tab bar + nested routes. */
export function Pharmacy() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-border">
        {[
          { to: '/pharmacy/medicines', label: 'Medicine inventory', icon: Pill },
          { to: '/pharmacy/prescriptions', label: 'Prescriptions', icon: ClipboardList },
        ].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center gap-1.5 border-b-2 px-3.5 pb-2.5 pt-1 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary-strong'
                  : 'border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
