import { z } from 'zod';

export const invoiceTypeSchema = z.enum([
  'Tuition',
  'Registration',
  'Application Fee',
  'Examination Fee',
  'Accommodation',
  'Library Fee',
]);

export const createInvoiceSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  type: invoiceTypeSchema,
  description: z.string().default(''),
  amount: z.number().positive('amount must be positive'),
  currency: z
    .string()
    .min(1, 'currency is required')
    .transform((v) => v.toUpperCase()),
  dueDate: z.string().min(1, 'dueDate is required'),
});
