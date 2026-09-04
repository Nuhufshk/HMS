import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db, nextId } from '../db';
import { invoices, patients } from '../db/schema';
import { dateFromToday, todayISO } from '../utils/date';
import type { InvoiceInput, PaymentInput, PaymentMethod } from '../types';

const router = Router();

/** Enrich invoices with patient name, paid amount, balance, and computed status. */
async function enrichInvoices(rows: typeof invoices.$inferSelect[]) {
  return Promise.all(
    rows.map(async (inv) => {
      const patRows = await db.select({ firstName: patients.firstName, lastName: patients.lastName })
        .from(patients).where(eq(patients.id, inv.patientId)).limit(1);
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
      return {
        ...inv,
        patientName: patRows[0] ? `${patRows[0].firstName} ${patRows[0].lastName}` : 'Unknown patient',
        paidAmount: paid,
        balance,
        status,
      };
    }),
  );
}

/** GET /api/invoices?patientId= */
router.get('/invoices', async (req, res) => {
  const patientId = String(req.query.patientId ?? '');
  const whereClause = patientId ? eq(invoices.patientId, patientId) : undefined;
  const rows = await db.select().from(invoices).where(whereClause).orderBy(desc(invoices.date));
  res.json(await enrichInvoices(rows));
});

/** POST /api/invoices */
router.post('/invoices', async (req, res) => {
  const body = (req.body ?? {}) as InvoiceInput;
  if (!body.patientId || !body.items || body.items.length === 0) {
    res.status(400).json({ message: 'Patient and at least one line item are required.' });
    return;
  }

  const subtotal = body.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = Math.min(Number(body.discount) || 0, subtotal);
  const afterDiscount = subtotal - discount;
  const insuranceCoverage = Math.min(Number(body.insuranceCoverage) || 0, afterDiscount);
  const total = Math.max(0, afterDiscount - insuranceCoverage);

  const existing = await db.select({ id: invoices.id }).from(invoices);
  const id = nextId('INV-', existing);

  const values = {
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

  const inserted = await db.insert(invoices).values(values).returning();
  res.status(201).json(inserted[0]);
});

/** GET /api/invoices/:id */
router.get('/invoices/:id', async (req, res) => {
  const rows = await db.select().from(invoices).where(eq(invoices.id, req.params.id)).limit(1);
  if (!rows.length) {
    res.status(404).json({ message: 'Invoice not found' });
    return;
  }
  res.json((await enrichInvoices(rows))[0]);
});

/** POST /api/invoices/:id/payments { amount, method, date?, reference? } */
router.post('/invoices/:id/payments', async (req, res) => {
  const rows = await db.select().from(invoices).where(eq(invoices.id, req.params.id)).limit(1);
  if (!rows.length) {
    res.status(404).json({ message: 'Invoice not found' });
    return;
  }

  const invoice = rows[0];
  const body = (req.body ?? {}) as PaymentInput;
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(422).json({ message: 'Payment amount must be greater than zero' });
    return;
  }

  const paid = invoice.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
  const balance = invoice.total - paid;
  if (amount > balance + 0.005) {
    res.status(422).json({ message: `Amount exceeds outstanding balance of GH₵ ${balance.toFixed(2)}` });
    return;
  }

  const payment = {
    id: `${invoice.id.replace('INV-', 'PAY-')}-${invoice.payments.length + 1}`,
    date: body.date ?? todayISO(),
    amount: Math.round(amount * 100) / 100,
    method: (body.method as PaymentMethod) ?? 'Cash',
    reference: body.reference,
  };

  const updated = await db.update(invoices)
    .set({ payments: [...invoice.payments, payment] })
    .where(eq(invoices.id, req.params.id))
    .returning();

  res.status(201).json(updated[0]);
});

export default router;
