import { useState, type FormEvent } from 'react';
import {
  Building,
  KeyRound,
  Monitor,
  Moon,
  Palette,
  Save,
  ShieldCheck,
  Sun,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select, Switch } from '@/components/ui/Form';
import { Tabs } from '@/components/ui/Tabs';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme, type ThemePreference } from '@/context/ThemeContext';
import { HOSPITAL } from '@/constants';
import { cn } from '@/utils/cn';
import { LogoMark } from '@/components/common/Logo';

export function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState(
    user?.role === 'admin' ? 'hospital' : 'security',
  );

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, security, notifications and appearance." />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          ...(isAdmin ? [{ id: 'hospital', label: 'Hospital', icon: Building }] : []),
          { id: 'security', label: 'Security', icon: ShieldCheck },
          { id: 'notifications', label: 'Notifications', icon: Palette },
          { id: 'appearance', label: 'Appearance', icon: Palette },
        ]}
      />

      {tab === 'hospital' && <HospitalSettings />}
      {tab === 'security' && <SecuritySettings />}
      {tab === 'notifications' && <NotificationSettings />}
      {tab === 'appearance' && <AppearanceSettings />}
    </div>
  );
}

/* ----------------------------- Hospital info ----------------------------- */

function HospitalSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: HOSPITAL.name,
    address: HOSPITAL.address,
    phone: HOSPITAL.phone,
    emergency: HOSPITAL.emergencyPhone,
    email: HOSPITAL.email,
    website: HOSPITAL.website,
    registration: HOSPITAL.registration,
  });

  const save = (e: FormEvent) => {
    e.preventDefault();
    toast({ title: 'Hospital information updated', description: 'Your changes have been saved (demo).', variant: 'success' });
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Hospital information</CardTitle>
          <CardDescription>Shown on invoices, reports and the login screen.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Hospital logo</span>
            <div className="flex items-center gap-4">
              <LogoMark />
              <Button type="button" variant="outline" size="sm" icon={<Upload className="h-4 w-4" />} onClick={() => toast({ title: 'Logo upload', description: 'Logo upload is simulated in this demo.', variant: 'info' })}>
                Upload logo
              </Button>
            </div>
          </div>
          <FormField label="Hospital name" required>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </FormField>
          <FormField label="Address" required>
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </FormField>
          <FormField label="Main phone" required>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </FormField>
          <FormField label="Emergency line" required>
            <Input value={form.emergency} onChange={(e) => setForm((f) => ({ ...f, emergency: e.target.value }))} />
          </FormField>
          <FormField label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </FormField>
          <FormField label="Website">
            <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          </FormField>
          <FormField label="HMIS registration number">
            <Input value={form.registration} onChange={(e) => setForm((f) => ({ ...f, registration: e.target.value }))} />
          </FormField>
          <div className="flex items-end sm:col-span-2">
            <Button type="submit" icon={<Save className="h-4 w-4" />}>Save changes</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- Security -------------------------------- */

function SecuritySettings() {
  const { toast } = useToast();
  const [twoFactor, setTwoFactor] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.current) errs.current = 'Current password is required';
    if (form.next.length < 8) errs.next = 'New password must be at least 8 characters';
    if (form.next !== form.confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    toast({ title: 'Password changed', description: 'Your password was updated successfully.', variant: 'success' });
    setForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Use a strong password you don't use elsewhere.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <FormField label="Current password" required error={errors.current}>
              <Input type="password" value={form.current} onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))} autoComplete="current-password" error={!!errors.current} />
            </FormField>
            <FormField label="New password" required error={errors.next} hint="Minimum 8 characters">
              <Input type="password" value={form.next} onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))} autoComplete="new-password" error={!!errors.next} />
            </FormField>
            <FormField label="Confirm new password" required error={errors.confirm}>
              <Input type="password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} autoComplete="new-password" error={!!errors.confirm} />
            </FormField>
            <Button type="submit" icon={<KeyRound className="h-4 w-4" />}>Update password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Two-factor authentication</CardTitle>
            <CardDescription>Add an extra layer of security to your account.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <Switch
              checked={twoFactor}
              onChange={(e) => {
                setTwoFactor(e.target.checked);
                toast({
                  title: e.target.checked ? '2FA enabled' : '2FA disabled',
                  description: e.target.checked ? 'Authenticator app required at sign-in (demo).' : 'You can re-enable two-factor authentication anytime.',
                  variant: e.target.checked ? 'success' : 'info',
                });
              }}
              label="Enable two-factor authentication"
              description="Require a one-time code from your authenticator app when signing in."
            />
          </div>
          {twoFactor && (
            <div className="rounded-lg border border-primary/30 bg-primary-soft p-4 text-sm text-primary-strong">
              <p className="font-semibold">Setup steps (demo)</p>
              <ol className="mt-1.5 list-inside list-decimal space-y-1 text-primary-strong/90">
                <li>Install an authenticator app such as Google Authenticator.</li>
                <li>Scan the QR code generated for your account.</li>
                <li>Enter the 6-digit code to confirm setup.</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------- Notification prefs ---------------------------- */

function NotificationSettings() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({
    appointments: true,
    labResults: true,
    pharmacyStock: true,
    billing: true,
    patientRegistrations: false,
    system: true,
  });

  const items: Array<{ key: keyof typeof prefs; label: string; description: string }> = [
    { key: 'appointments', label: 'Appointment updates', description: 'New bookings, cancellations and reschedules.' },
    { key: 'labResults', label: 'Laboratory results', description: 'When lab results are ready or marked STAT.' },
    { key: 'pharmacyStock', label: 'Pharmacy stock alerts', description: 'Low stock, out of stock and expiring medicines.' },
    { key: 'billing', label: 'Billing updates', description: 'Payments received and overdue invoices.' },
    { key: 'patientRegistrations', label: 'New patient registrations', description: 'When a new patient is registered at reception.' },
    { key: 'system', label: 'System announcements', description: 'Maintenance windows and platform notices.' },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Notification preferences</CardTitle>
          <CardDescription>Choose which alerts you receive in the notification panel.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="rounded-lg border border-border bg-muted/30 p-4">
            <Switch
              checked={prefs[item.key]}
              onChange={(e) => setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
              label={item.label}
              description={item.description}
            />
          </div>
        ))}
        <Button icon={<Save className="h-4 w-4" />} onClick={() => toast({ title: 'Preferences saved', description: 'Your notification preferences were updated.', variant: 'success' })}>
          Save preferences
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------- Appearance ------------------------------- */

const THEME_CARDS: Array<{ id: ThemePreference; label: string; icon: typeof Sun; description: string; swatch: string[] }> = [
  { id: 'light', label: 'Light', icon: Sun, description: 'Bright interface for daytime use.', swatch: ['#F3F8F4', '#FFFFFF', '#02A864'] },
  { id: 'dark', label: 'Dark', icon: Moon, description: 'Low-glare surfaces for night shifts.', swatch: ['#1B2931', '#24343D', '#17B878'] },
  { id: 'system', label: 'System', icon: Monitor, description: 'Follow your operating system preference.', swatch: ['#F3F8F4', '#1B2931', '#17B878'] },
];

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how the system looks. Changes apply immediately.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
          {THEME_CARDS.map((card) => {
            const active = theme === card.id;
            return (
              <button
                key={card.id}
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setTheme(card.id);
                  toast({ title: `Theme set to ${card.label}`, description: 'The interface has been updated.', variant: 'info' });
                }}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  active ? 'border-primary bg-primary-soft/50 ring-1 ring-primary' : 'border-border bg-card hover:border-border-strong',
                )}
              >
                <div className="flex items-center justify-between">
                  <card.icon className={cn('h-5 w-5', active ? 'text-primary-strong' : 'text-muted-foreground')} aria-hidden />
                  <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border-2', active ? 'border-primary' : 'border-border-strong')}>
                    {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{card.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.description}</p>
                <div className="mt-3 flex h-8 overflow-hidden rounded-md border border-border" aria-hidden>
                  {card.swatch.map((c, i) => (
                    <span key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
