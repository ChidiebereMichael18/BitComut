import { Router } from 'express';
import { z } from 'zod';
import { getTenantId } from '../../middleware/tenant';
import { validateQuery } from '../../middleware/validate';
import { getDashboardStats, getChartSeries, type ChartPeriod } from './dashboard.repo';

export const dashboardRouter = Router();

const chartSchema = z.object({
  period: z.enum(['7D', '30D', '90D', '12M']).default('7D'),
});

dashboardRouter.get('/stats', async (_req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    res.json(await getDashboardStats(tenantId));
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get('/chart', validateQuery(chartSchema), async (_req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const period = (res.locals.validatedQuery as { period?: ChartPeriod }).period ?? '7D';
    res.json(await getChartSeries(tenantId, period));
  } catch (err) {
    next(err);
  }
});
