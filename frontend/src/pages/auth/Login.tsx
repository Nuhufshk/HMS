import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { LogoMark } from '@/components/common/Logo';
import { Button } from '@/components/ui/Button';
import { Checkbox, FormField, Input } from '@/components/ui/Form';
import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck, Stethoscope, Users, Activity } from 'lucide-react';
import { MOCK_USERS } from '@/data/users';
import { cn } from '@/utils/cn';

export function Login() {
  const { login, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already authenticated → go straight to the dashboard.
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedIn = await login(email, password, remember);
      toast({
        title: `Welcome back, ${loggedIn.name.split(' ')[0]}`,
        description: `Signed in as ${loggedIn.roleLabel}.`,
        variant: 'success',
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    setRemember(true);
  };

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-border bg-card p-10 lg:flex xl:p-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-soft blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-info-soft blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-lg font-bold tracking-tight text-foreground">Adom Medical Centre</p>
            <p className="text-xs text-muted-foreground">Hospital Management System</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="max-w-md text-3xl font-bold leading-tight tracking-tight text-foreground xl:text-4xl">
            Coordinating every ward, clinic and billing desk — in one place.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            From patient registration to pharmacy dispensing, laboratory results and revenue reporting, the Adom HMS
            keeps your hospital running smoothly, securely and efficiently.
          </p>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-4">
            {[
              { icon: Users, value: '24,000+', label: 'Patients served' },
              { icon: Stethoscope, value: '40+', label: 'Specialists' },
              { icon: Activity, value: '24/7', label: 'Emergency care' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
                <p className="mt-2 text-lg font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Adom Medical Centre · 12 Ring Road Central, Accra, Ghana
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark />
            <div>
              <p className="text-lg font-bold tracking-tight text-foreground">Adom Medical Centre</p>
              <p className="text-xs text-muted-foreground">Hospital Management System</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in to your account</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use your hospital credentials to access the system.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive-soft px-3.5 py-3 text-sm text-destructive-strong"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {error}
              </div>
            )}

            <FormField label="Email address" htmlFor="login-email" required>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@adommedicalcentre.gh"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                error={!!error}
              />
            </FormField>

            <FormField label="Password" htmlFor="login-password" required>
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                error={!!error}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </FormField>

            <div className="flex items-center justify-between gap-3">
              <Checkbox
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                label="Remember me"
              />
              <button
                type="button"
                onClick={() => toast({ title: 'Password reset', description: 'A reset link has been sent to your email (demo).', variant: 'info' })}
                className="text-sm font-medium text-primary-strong transition-colors hover:text-primary-hover"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" size="lg" loading={loading} icon={<LogIn className="h-4 w-4" />} className="w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 rounded-xl border border-border bg-card p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
              Demo accounts — tap to fill
            </p>
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {MOCK_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => fillDemo(u.email, u.password)}
                  className={cn(
                    'rounded-lg border border-border px-3 py-2 text-left transition-colors',
                    'hover:border-primary/40 hover:bg-primary-soft/50',
                  )}
                >
                  <span className="block truncate text-sm font-medium text-foreground">{u.roleLabel}</span>
                  <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
              Passwords follow the pattern <span className="font-mono text-foreground/80">role123</span> (e.g.{' '}
              <span className="font-mono text-foreground/80">admin123</span>,{' '}
              <span className="font-mono text-foreground/80">doctor123</span>).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
