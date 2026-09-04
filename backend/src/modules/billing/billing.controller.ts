import type { Request, Response } from 'express';
import { listInvoices, getInvoice, createInvoiceRecord, addPayment } from './billing.service';

export async function listHandler(req: Request, res: Response) {
  const patientId = String(req.query.patientId ?? '') || undefined;
  const result = await listInvoices(patientId);
  res.json(result);
}

export async function getHandler(req: Request, res: Response) {
  const invoice = await getInvoice(req.params.id);
  if (!invoice) {
    res.status(404).json({ message: 'Invoice not found' });
    return;
  }
  res.json(invoice);
}

export async function createHandler(req: Request, res: Response) {
  const { invoice, error } = await createInvoiceRecord(req.body ?? {});

  if (error) {
    res.status(400).json({ message: error });
    return;
  }
  res.status(201).json(invoice);
}

export async function paymentHandler(req: Request, res: Response) {
  const { invoice, error } = await addPayment(req.params.id, req.body ?? {});

  if (error) {
    const status = error.includes('not found') ? 404 : 422;
    res.status(status).json({ message: error });
    return;
  }
  res.status(201).json(invoice);
}
