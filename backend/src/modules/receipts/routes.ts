import { Router } from 'express';
import { ApiError } from '../../middleware/error-handler';
import { getTenantId } from '../../middleware/tenant';
import { listReceipts, getReceipt } from './receipts.repo';

export const receiptsRouter = Router();

receiptsRouter.get('/', async (_req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    res.json(await listReceipts(tenantId));
  } catch (err) {
    next(err);
  }
});

receiptsRouter.get('/:id', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const r = await getReceipt(tenantId, req.params.id);
    if (!r) throw ApiError.notFound('Receipt not found');
    res.json(r);
  } catch (err) {
    next(err);
  }
});
