import { invoices as invoicesTable } from '../../db/schema';
import { dateFromToday, todayISO } from '../../utils/date';
import {
  findAllInvoices,
  findInvoiceById,
  generateInvoiceId,
  insertInvoice,
  updateInvoice,
  findPatientName,
} from './billing.repository';
import type { InvoiceInput, PaymentInput, PaymentMethod } from '../../types';

export async function listInvoices(patientId?: string) {
  const rows = await findAllInvoices(patientId);
  return enrichInvoices(rows);
}

export async function getInvoice(id: string) {
  const row = await findInvoiceById(id);
  if (!row) return undefined;
  const enriched = await enrichInvoices([row]);
  return enriched[0];
}

export async function createInvoiceRecord(body: InvoiceInput) {
  if (!body.patientId || !body.items || body.items.length === 0) {
    return { invoice: undefined, error: 'Patient and at least one line item are required.' };
  }

  const subtotal = body.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = Math.min(Number(body.discount) || 0, subtotal);
  const afterDiscount = subtotal - discount;
  const insuranceCoverage = Math.min(Number(body.insuranceCoverage) || 0, afterDiscount);
  const total = Math.max(0, afterDiscount - insuranceCoverage);

  const id = await generateInvoiceId();

  const values: typeof invoicesTable.$inferInsert = {
    id,
    patientId: body.patientId,
    date: body.date ?? todayISO(),
    dueDate: body.dueDate ?? dateFromToday(7),
    items: body.items,
    subtotal,
    discount,
    insuranceCoverage,
    total,
    status: 'pending' as const,
    payments: [] as Array<{ id: string; date: string; amount: number; method: string; reference?: string }>,
    issuedBy: 'Front Desk',
  };

  const inserted = await insertInvoice(values);
  return { invoice: inserted, error: undefined };
}

export async function addPayment(id: string, body: PaymentInput) {
  const invoice = await findInvoiceById(id);
  if (!invoice) return { invoice: undefined, error: 'Invoice not found' };

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { invoice: undefined, error: 'Payment amount must be greater than zero' };
  }

  const paid = invoice.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
  const balance = invoice.total - paid;
  if (amount > balance + 0.005) {
    return { invoice: undefined, error: `Amount exceeds outstanding balance of GH₵ ${balance.toFixed(2)}` };
  }

  const payment = {
    id: `${invoice.id.replace('INV-', 'PAY-')}-${invoice.payments.length + 1}`,
    date: body.date ?? todayISO(),
    amount: Math.round(amount * 100) / 100,
    method: (body.method as PaymentMethod) ?? 'Cash',
    reference: body.reference,
  };

  const updated = await updateInvoice(id, { payments: [...invoice.payments, payment] });
  return { invoice: updated, error: undefined };
}

async function enrichInvoices(rows: typeof invoicesTable.$inferSelect[]) {
  return Promise.all(
    rows.map(async (inv) => {
      const patientName = await findPatientName(inv.patientId);
      const paid = inv.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
      const balance = Math.max(0, inv.total - paid);
      let status: string = inv.status;
      if (paid >= inv.total - 0.005) status = 'paid';
      else if (paid > 0) status = 'partial';
      else {
        const target = new Date(`${inv.dueDate}T00:00:00`).getTime();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (Math.round((target - today.getTime()) / 86_400_000) < 0) status = 'overdue';
      }
      return { ...inv, patientName, paidAmount: paid, balance, status };
    }),
  );
}
