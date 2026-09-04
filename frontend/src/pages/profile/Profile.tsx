import { useState, type FormEvent } from 'react';
import { Save, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/Form';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/common/PageHeader';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export function Profile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });

  const save = (e: FormEvent) => {
    e.preventDefault();
    updateProfile({ name: form.name, email: form.email, phone: form.phone });
    toast({ title: 'Profile updated', description: 'Your profile was saved successfully.', variant: 'success' });
  };

  return (
    <div>
      <PageHeader title="Profile" description="Your details as shown across the system." />
      <Card>
        <CardHeader>
          <div>
            <CardTitle>User profile</CardTitle>
            <CardDescription>Manage your personal information.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Profile photo</span>
              <div className="flex items-center gap-4">
                <Avatar name={form.name || 'User'} size="lg" />
                <Button type="button" variant="outline" size="sm" icon={<Upload className="h-4 w-4" />} onClick={() => toast({ title: 'Photo upload', description: 'Photo upload is simulated in this demo.', variant: 'info' })}>
                  Upload photo
                </Button>
              </div>
            </div>
            <FormField label="Full name" required>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </FormField>
            <FormField label="Email" required>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </FormField>
            <FormField label="Role">
              <Input value={user?.roleLabel ?? ''} disabled />
            </FormField>
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" icon={<Save className="h-4 w-4" />}>Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
