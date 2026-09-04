import { apiClient } from './apiClient';
import type { Invoice, InvoiceInput, PaymentInput, EnrichedInvoice } from '@/types';
import { dateFromToday } from '@/utils/date';

export const billingService = {
  async getInvoices(): Promise<EnrichedInvoice[]> {
    return apiClient.get<EnrichedInvoice[]>('/invoices');
  },

  async getInvoicesByPatient(patientId: string): Promise<EnrichedInvoice[]> {
    return apiClient.get<EnrichedInvoice[]>(`/invoices?patientId=${patientId}`);
  },

  async getInvoiceById(id: string): Promise<EnrichedInvoice> {
    return apiClient.get<EnrichedInvoice>(`/invoices/${id}`);
  },

  async createInvoice(input: InvoiceInput): Promise<Invoice> {
    return apiClient.post<Invoice>('/invoices', input);
  },

  async recordPayment(invoiceId: string, input: PaymentInput): Promise<Invoice> {
    return apiClient.post<Invoice>(`/invoices/${invoiceId}/payments`, input);
  },

  /** Revenue from payments made today. */
  async getRevenueToday(): Promise<number> {
    const invoices = await this.getInvoices();
    const today = dateFromToday(0);
    return invoices.reduce(
      (sum, inv) => sum + inv.payments.filter((p) => p.date === today).reduce((s, p) => s + p.amount, 0),
      0,
    );
  },
};
