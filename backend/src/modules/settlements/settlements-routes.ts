import { Router } from 'express';
import { ApiError } from '../../middleware/error-handler';
import { getTenantId } from '../../middleware/tenant';
import { listSettlements, getSettlement } from './settlements.repo';

export const settlementsRouter = Router();

settlementsRouter.get('/', async (_req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    res.json(await listSettlements(tenantId));
  } catch (err) {
    next(err);
  }
});

settlementsRouter.get('/:id', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const s = await getSettlement(tenantId, req.params.id);
    if (!s) throw ApiError.notFound('Settlement not found');
    res.json(s);
  } catch (err) {
    next(err);
  }
});
