import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/layouts/AppLayout';
import { canAccess } from '@/constants/navigation';
import { LoadingState } from '@/components/ui/States';
import { Unauthorized } from '@/pages/errors/Unauthorized';

/**
 * Layout-level guard for authenticated areas.
 * Renders the app shell and lets nested routes render into its <Outlet/>.
 */
export function ProtectedLayout() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <LoadingState label="Restoring your session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <AppLayout />;
}

/** Per-route role protection: renders the page or an unauthorized state. */
export function RoleGuard({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;
  if (!roles.includes(user.role) || !canAccess(user.role, location.pathname)) {
    return <Unauthorized />;
  }
  return <>{children}</>;
}
