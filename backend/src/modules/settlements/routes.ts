import { Router } from 'express';
import { ApiError } from '../../middleware/error-handler';
import { getTenantId } from '../../middleware/tenant';
import { validateBody, validateQuery } from '../../middleware/validate';
import { requireIdempotencyKey, withIdempotency } from '../../lib/idempotency';
import { ids } from '../../lib/ids';
import { getSettlementBalance } from './settlements.repo';
import {
  createWithdrawal,
  listWithdrawals,
  getWithdrawal,
} from '../withdrawals/withdrawals.repo';
import { scheduleWithdrawalJob } from '../withdrawals/withdrawal.worker';
import {
  listPaymentAccounts,
  createPaymentAccount,
  deletePaymentAccount,
  getPaymentAccount,
  maskPaymentAccount,
  clearDefault,
} from '../payment-accounts/payment-accounts.repo';
import {
  withdrawSchema,
  balanceQuerySchema,
  methodsQuerySchema,
  createMethodSchema,
} from './schema';

export const settlementRouter = Router();

function withdrawalReference(withdrawalId: string): string {
  const year = new Date().getFullYear();
  const tail = withdrawalId.replace(/[^0-9]/g, '').slice(-3) || '0';
  return `WD-${year}-${Math.floor(100 + Math.random() * 900)}${tail.slice(0, 1)}`;
}

// POST /api/settlement/withdraw
settlementRouter.post(
  '/withdraw',
  requireIdempotencyKey,
  validateBody(withdrawSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(res);
      const body = req.body as typeof withdrawSchema._type;
      await withIdempotency(req, res, tenantId, async () => {
        const account = await getPaymentAccount(tenantId, body.paymentAccountId);
        if (!account) throw ApiError.badRequest('Payment account not found', 'ACCOUNT_NOT_FOUND');

        const id = ids.withdrawal();
        const withdrawal = await createWithdrawal({
          id,
          reference: withdrawalReference(id),
          tenantId,
          amount: body.amount,
          currency: body.currency,
          paymentAccountId: account.id,
          bankAccountLabel: account.label,
        });

        await scheduleWithdrawalJob(id, tenantId);

        return { ...withdrawal };
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/settlement/balance
settlementRouter.get('/balance', validateQuery(balanceQuerySchema), async (_req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const q = res.locals.validatedQuery as { currency?: string };
    const balance = await getSettlementBalance(tenantId, q.currency);
    res.json(balance);
  } catch (err) {
    next(err);
  }
});

// GET /api/settlement/withdrawals
settlementRouter.get('/withdrawals', async (_req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const withdrawals = await listWithdrawals(tenantId);
    res.json(withdrawals);
  } catch (err) {
    next(err);
  }
});

// GET /api/settlement/withdrawals/:id  (must be declared before /withdrawals/:id-colon patterns; order matters)
settlementRouter.get('/withdrawals/:id', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const w = await getWithdrawal(tenantId, req.params.id);
    if (!w) throw ApiError.notFound('Withdrawal not found');
    res.json(w);
  } catch (err) {
    next(err);
  }
});

// GET /api/settlement/methods
settlementRouter.get('/methods', validateQuery(methodsQuerySchema), async (_req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const q = res.locals.validatedQuery as { currency?: string };
    const accounts = await listPaymentAccounts(tenantId, q.currency);
    // default account first; mask numbers in every response
    res.json(accounts.map(maskPaymentAccount));
  } catch (err) {
    next(err);
  }
});

// POST /api/settlement/methods
settlementRouter.post(
  '/methods',
  requireIdempotencyKey,
  validateBody(createMethodSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(res);
      const body = req.body as typeof createMethodSchema._type;
      await withIdempotency(req, res, tenantId, async () => {
        if (body.isDefault) await clearDefault(tenantId);
        const id = ids.paymentAccount();
        const account = await createPaymentAccount({
          id,
          tenantId,
          type: body.type,
          label: body.label,
          holderName: body.holderName,
          number: body.number,
          provider: body.provider,
          currency: body.currency,
          isDefault: body.isDefault,
        });
        return maskPaymentAccount(account);
      });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/settlement/methods/:id
settlementRouter.delete('/methods/:id', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const deleted = await deletePaymentAccount(tenantId, req.params.id);
    if (!deleted) throw ApiError.notFound('Payment method not found');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
