import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../../middleware/error-handler';
import { getTenant, getTenantId } from '../../middleware/tenant';
import { validateBody } from '../../middleware/validate';
import { getTenant as repoGet, updateTenant } from '../tenants/tenants.repo';

export const universityRouter = Router();

const updateUniversitySchema = z
  .object({
    name: z.string().min(1).optional(),
    shortName: z.string().optional(),
    address: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    currency: z.string().optional(),
    settlementCurrency: z.string().optional(),
    adminName: z.string().optional(),
    adminEmail: z.string().email().optional(),
    country: z.string().optional(),
    campusName: z.string().optional(),
    established: z.string().optional(),
    logoColor: z.string().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: 'No updates provided',
  });

universityRouter.get('/', async (_req, res, next) => {
  try {
    const tenant = getTenant(res);
    if (!tenant) throw ApiError.notFound('Tenant not found');
    const full = await repoGet(tenant.id);
    if (!full) throw ApiError.notFound('Tenant not found');
    res.json(full);
  } catch (err) {
    next(err);
  }
});

universityRouter.put('/', validateBody(updateUniversitySchema), async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const body = req.body as Record<string, unknown>;
    const mapped: Record<string, unknown> = {};
    const fieldMap: Record<string, keyof typeof mapped> = {
      name: 'name',
      shortName: 'short_name',
      address: 'address',
      email: 'email',
      phone: 'phone',
      website: 'website',
      currency: 'currency',
      settlementCurrency: 'settlement_currency',
      adminName: 'admin_name',
      adminEmail: 'admin_email',
      country: 'country',
      campusName: 'campus_name',
      established: 'established',
      logoColor: 'logo_color',
    };
    for (const [k, v] of Object.entries(body)) {
      const col = fieldMap[k];
      if (col) mapped[col] = v;
    }
    const updated = await updateTenant(tenantId, mapped as never);
    if (!updated) throw ApiError.notFound('Tenant not found');
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
