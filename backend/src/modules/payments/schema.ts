import { z } from 'zod';

export const listPaymentsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  settlement: z.enum(['Settled', 'Pending']).optional(),
  method: z.string().optional(),
  currency: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const createPaymentSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  invoiceId: z.string().optional(),
  type: z.enum([
    'Tuition',
    'Registration',
    'Application Fee',
    'Examination Fee',
    'Accommodation',
    'Library Fee',
  ]),
  description: z.string().default(''),
  amount: z.number().positive('amount must be positive'),
  currency: z.string().min(1).transform((v) => v.toUpperCase()),
  dueDate: z.string().min(1, 'dueDate is required'),
});
