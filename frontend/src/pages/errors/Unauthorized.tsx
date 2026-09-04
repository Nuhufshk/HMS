import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export function Unauthorized() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive-soft text-destructive-strong">
        <ShieldAlert className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="text-lg font-bold text-foreground">Access restricted</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your role does not have permission to view this page. If you believe this is a mistake, please contact the
        hospital administrator.
      </p>
      <Link
        to="/dashboard"
        className="mt-2 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
