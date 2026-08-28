import { z } from 'zod';

export const withdrawSchema = z.object({
  amount: z.number().positive('amount must be positive'),
  paymentAccountId: z.string().min(1, 'paymentAccountId is required'),
  currency: z.string().min(1, 'currency is required').transform((v) => v.toUpperCase()),
});

export const balanceQuerySchema = z.object({
  currency: z.string().optional(),
});

export const methodsQuerySchema = z.object({
  currency: z.string().optional(),
});

export const createMethodSchema = z.object({
  type: z.enum(['bank', 'mobile_money']),
  label: z.string().min(1, 'label is required'),
  holderName: z.string().min(1, 'holderName is required'),
  number: z.string().min(4, 'number is required'),
  provider: z.string().optional().nullable(),
  currency: z.string().min(1, 'currency is required').transform((v) => v.toUpperCase()),
  isDefault: z.boolean().default(false),
});
