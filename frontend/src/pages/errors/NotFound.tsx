import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
        <Compass className="h-7 w-7" aria-hidden />
      </span>
      <p className="text-sm font-bold uppercase tracking-widest text-primary-strong">Error 404</p>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have been moved. Check the address or head back to the
        dashboard.
      </p>
      <div className="mt-3 flex gap-2">
        <Link to="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
