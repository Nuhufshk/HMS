import { Router } from 'express';
import { computeInvoiceTotals, db, enrichInvoices, nextId } from '../store';
import { dateFromToday, todayISO } from '../utils/date';
import type { Invoice, InvoiceInput, PaymentInput, PaymentMethod } from '../types';

const router = Router();

/** GET /api/invoices?patientId= */
router.get('/invoices', (req, res) => {
  let list = [...db.invoices];
  const patientId = String(req.query.patientId ?? '');
  if (patientId) list = list.filter((i) => i.patientId === patientId);
  res.json(enrichInvoices(list));
});

/** POST /api/invoices */
router.post('/invoices', (req, res) => {
  const body = (req.body ?? {}) as InvoiceInput;
  if (!body.patientId || !body.items || body.items.length === 0) {
    res.status(400).json({ message: 'Patient and at least one line item are required.' });
    return;
  }
  const totals = computeInvoiceTotals({
    items: body.items,
    discount: Number(body.discount) || 0,
    insuranceCoverage: Number(body.insuranceCoverage) || 0,
  });
  const invoice: Invoice = {
    id: nextId('INV-', db.invoices),
    patientId: body.patientId,
    date: body.date ?? todayISO(),
    dueDate: body.dueDate ?? dateFromToday(7),
    items: body.items,
    ...totals,
    status: 'pending',
    payments: [],
    issuedBy: 'Front Desk',
  };
  db.invoices.unshift(invoice);
  res.status(201).json(invoice);
});

/** GET /api/invoices/:id */
router.get('/invoices/:id', (req, res) => {
  const found = db.invoices.find((i) => i.id === req.params.id);
  if (!found) {
    res.status(404).json({ message: 'Invoice not found' });
    return;
  }
  res.json(enrichInvoices([found])[0]);
});

/** POST /api/invoices/:id/payments { amount, method, date?, reference? } */
router.post('/invoices/:id/payments', (req, res) => {
  const idx = db.invoices.findIndex((i) => i.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ message: 'Invoice not found' });
    return;
  }
  const invoice = db.invoices[idx];
  const body = (req.body ?? {}) as PaymentInput;
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(422).json({ message: 'Payment amount must be greater than zero' });
    return;
  }
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
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
  const next = { ...invoice, payments: [...invoice.payments, payment] };
  db.invoices[idx] = next;
  res.status(201).json(next);
});

export default router;
