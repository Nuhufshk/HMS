import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CalendarX2,
  Eye,
  PackagePlus,
  PackageX,
  Pencil,
  Pill,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/Form';
import { SearchBar } from '@/components/ui/SearchBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { MoreHorizontal } from 'lucide-react';
import { pharmacyService, type MedicineDetail } from '@/services/pharmacyService';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { MEDICINE_CATEGORIES } from '@/constants/options';
import type { Medicine, MedicineInput } from '@/types';
import { formatCurrency, formatNumber } from '@/utils/format';
import { daysUntil, formatDate, todayISO } from '@/utils/date';
import { cn } from '@/utils/cn';

export function Medicines() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');

  const { data: medicines, loading, error, reload } = useAsyncData(() => pharmacyService.getMedicines(), []);
  const { data: alerts } = useAsyncData(() => pharmacyService.getStockAlerts(), []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MedicineDetail | null>(null);
  const [viewing, setViewing] = useState<MedicineDetail | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (medicines ?? []).filter((m) => {
      const matchesQuery = !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.supplier.toLowerCase().includes(q);
      const matchesCategory = !category || m.category === category;
      const matchesStatus = !stockStatus || m.status === stockStatus;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [medicines, search, category, stockStatus]);

  const alertCards = useMemo(() => {
    if (!alerts) return [];
    return [
      { label: 'Out of stock', count: alerts.outOfStock.length, status: 'out_of_stock', className: 'border-destructive/40 bg-destructive-soft text-destructive-strong', icon: PackageX },
      { label: 'Low stock', count: alerts.lowStock.length, status: 'low_stock', className: 'border-warning/40 bg-warning-soft text-warning-strong', icon: AlertTriangle },
      { label: 'Expiring ≤ 60 days', count: alerts.expiringSoon.length, status: '', className: 'border-warning/40 bg-warning-soft text-warning-strong', icon: CalendarX2 },
      { label: 'Expired', count: alerts.expired.length, status: 'expired', className: 'border-destructive/40 bg-destructive-soft text-destructive-strong', icon: CalendarX2 },
    ];
  }, [alerts]);

  const columns: Column<MedicineDetail>[] = [
    {
      key: 'name',
      header: 'Medicine',
      sortable: true,
      render: (m) => (
        <div className="leading-tight">
          <p className="font-medium text-foreground">{m.name}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{m.id} · Batch {m.batch}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', sortable: true, render: (m) => <span className="text-muted-foreground">{m.category}</span> },
    {
      key: 'quantity',
      header: 'Quantity',
      sortable: true,
      render: (m) => (
        <div className="min-w-28">
          <p className="font-semibold text-foreground">{formatNumber(m.quantity)}</p>
          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full',
                m.status === 'low_stock' ? 'bg-warning' : m.status === 'out_of_stock' ? 'bg-destructive' : 'bg-success',
              )}
              style={{ width: `${Math.min(100, (m.quantity / (m.reorderLevel * 3)) * 100)}%` }}
              aria-hidden
            />
          </div>
        </div>
      ),
    },
    { key: 'unitPrice', header: 'Unit price', sortable: true, render: (m) => <span className="text-foreground">{formatCurrency(m.unitPrice)}</span> },
    {
      key: 'expiryDate',
      header: 'Expiry',
      sortable: true,
      render: (m) => {
        const days = m.daysToExpiry;
        return (
          <span className={cn('whitespace-nowrap text-sm', days <= 0 ? 'font-medium text-destructive-strong' : days <= 60 ? 'text-warning-strong' : 'text-muted-foreground')}>
            {formatDate(m.expiryDate)}
            {days >= 0 && days <= 60 && <span className="block text-[11px]">{days}d left</span>}
          </span>
        );
      },
    },
    { key: 'supplier', header: 'Supplier', sortable: true, render: (m) => <span className="text-muted-foreground">{m.supplier}</span> },
    { key: 'status', header: 'Stock status', sortable: true, render: (m) => <StatusBadge status={m.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (m) => (
        <Dropdown
          ariaLabel={`Actions for ${m.name}`}
          align="right"
          width="w-44"
          trigger={
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          }
        >
          {(close) => (
            <div className="p-1">
              <DropdownItem icon={<Eye className="h-4 w-4" />} onClick={() => { close(); setViewing(m); }}>
                View details
              </DropdownItem>
              <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => { close(); setEditing(m); setFormOpen(true); }}>
                Edit medicine
              </DropdownItem>
            </div>
          )}
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Medicine inventory"
        description="Stock levels, pricing and expiry tracking for the hospital pharmacy."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Add medicine
          </Button>
        }
      />

      {/* Stock alerts */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {alertCards.map((a) => (
          <button
            key={a.label}
            onClick={() => {
              setStockStatus((prev) => (prev === a.status ? '' : a.status));
              setCategory('');
            }}
            className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-opacity hover:opacity-80', a.className)}
          >
            <a.icon className="h-5 w-5 shrink-0" aria-hidden />
            <span>
              <span className="block text-lg font-bold leading-none">{a.count}</span>
              <span className="text-xs font-medium">{a.label}</span>
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex w-full flex-wrap items-center gap-3">
            <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Search medicine, ID or supplier…" className="w-full sm:w-72" />
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-52">
              <option value="">All categories</option>
              {MEDICINE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)} className="w-40">
              <option value="">All stock statuses</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="expired">Expired</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(m) => m.id}
              loading={loading}
              pageSize={9}
              onRowClick={(m) => setViewing(m)}
              empty={
                <EmptyState
                  icon={<Pill className="h-6 w-6" />}
                  title="No medicines found"
                  description={search || category || stockStatus ? 'Try adjusting your search or filters.' : undefined}
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <MedicineFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        medicine={editing}
        onSaved={reload}
      />

      {/* View details */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.name ?? ''}
        description={viewing ? `${viewing.id} · ${viewing.category}` : undefined}
        size="md"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewing.status} />
              <span className="text-sm text-muted-foreground">
                {viewing.quantity} units · reorder at {viewing.reorderLevel}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                ['Supplier', viewing.supplier],
                ['Batch number', viewing.batch],
                ['Unit price', formatCurrency(viewing.unitPrice)],
                ['Expiry date', `${formatDate(viewing.expiryDate)} (${daysUntil(viewing.expiryDate)} days)`],
                ['Reorder level', String(viewing.reorderLevel)],
                ['Category', viewing.category],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-border/70 pb-2">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-lg bg-muted p-3.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Stock movement (recent)</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex justify-between"><span className="text-muted-foreground">Dispensed — Coartem course (RX-6003)</span><span className="font-medium text-foreground">−1</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Dispensed — amoxicillin course (RX-6012)</span><span className="font-medium text-foreground">−1</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Received from {viewing.supplier}</span><span className="font-medium text-success-strong">+100</span></li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ------------------------- Add / edit medicine form ------------------------- */

interface MedicineFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  medicine?: MedicineDetail | null;
}

function MedicineFormModal({ open, onClose, onSaved, medicine }: MedicineFormModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MedicineInput & { id?: string }>({
    name: '',
    category: 'Analgesic',
    quantity: 0,
    reorderLevel: 50,
    unitPrice: 0,
    expiryDate: '',
    supplier: '',
    batch: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      medicine
        ? {
            id: medicine.id,
            name: medicine.name,
            category: medicine.category,
            quantity: medicine.quantity,
            reorderLevel: medicine.reorderLevel,
            unitPrice: medicine.unitPrice,
            expiryDate: medicine.expiryDate,
            supplier: medicine.supplier,
            batch: medicine.batch,
          }
        : { name: '', category: 'Analgesic', quantity: 0, reorderLevel: 50, unitPrice: 0, expiryDate: '', supplier: '', batch: '' },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, medicine]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Medicine name is required';
    if (form.quantity < 0) errs.quantity = 'Quantity cannot be negative';
    if (form.unitPrice <= 0) errs.unitPrice = 'Enter a valid unit price';
    if (!form.expiryDate) errs.expiryDate = 'Expiry date is required';
    if (!form.supplier.trim()) errs.supplier = 'Supplier is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const input: MedicineInput = {
        name: form.name.trim(),
        category: form.category,
        quantity: Number(form.quantity),
        reorderLevel: Number(form.reorderLevel),
        unitPrice: Number(form.unitPrice),
        expiryDate: form.expiryDate,
        supplier: form.supplier.trim(),
        batch: form.batch.trim() || `BT-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      if (medicine) {
        await pharmacyService.updateMedicine(medicine.id, input);
        toast({ title: 'Medicine updated', description: `${form.name} was updated.`, variant: 'success' });
      } else {
        await pharmacyService.createMedicine(input);
        toast({ title: 'Medicine added', description: `${form.name} added to inventory.`, variant: 'success' });
      }
      onSaved();
      onClose();
    } catch (err) {
      toast({ title: 'Could not save medicine', description: err instanceof Error ? err.message : 'Please try again.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={medicine ? 'Edit medicine' : 'Add medicine'}
      description="Enter stock details. Stock status is derived automatically from quantity, reorder level and expiry."
      size="lg"
      footer={
        <>
          <Button variant="destructive" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" form="medicine-form" loading={saving} icon={<PackagePlus className="h-4 w-4" />}>
            {medicine ? 'Save changes' : 'Add medicine'}
          </Button>
        </>
      }
    >
      <form id="medicine-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Medicine name" required error={errors.name} className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Coartem (Artemether/Lumefantrine 80/480mg)" error={!!errors.name} />
        </FormField>
        <FormField label="Category" required>
          <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {MEDICINE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Supplier" required error={errors.supplier}>
          <Input value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} placeholder="e.g. Tobinco Pharmaceuticals" error={!!errors.supplier} />
        </FormField>
        <FormField label="Quantity in stock" required error={errors.quantity}>
          <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))} error={!!errors.quantity} />
        </FormField>
        <FormField label="Reorder level" required>
          <Input type="number" min={0} value={form.reorderLevel} onChange={(e) => setForm((f) => ({ ...f, reorderLevel: Number(e.target.value) }))} />
        </FormField>
        <FormField label="Unit price (GHS)" required error={errors.unitPrice}>
          <Input type="number" min={0} step="0.5" value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))} error={!!errors.unitPrice} />
        </FormField>
        <FormField label="Expiry date" required error={errors.expiryDate}>
          <Input type="date" min={todayISO()} value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} error={!!errors.expiryDate} />
        </FormField>
        <FormField label="Batch number" className="sm:col-span-2">
          <Input value={form.batch} onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))} placeholder="Auto-generated if left blank" />
        </FormField>
      </form>
    </Modal>
  );
}
