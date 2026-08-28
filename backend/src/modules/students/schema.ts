import { z } from 'zod';

export const studentStatusSchema = z.enum(['Active', 'Inactive', 'Graduated']);

export const createStudentSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('email is invalid'),
  phone: z.string().optional().nullable(),
  program: z.string().min(1, 'program is required'),
  year: z.string().min(1, 'year is required'),
  status: studentStatusSchema.default('Active'),
});

export const listStudentsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
