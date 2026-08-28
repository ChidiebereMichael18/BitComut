import { Router } from 'express';
import { listTenants } from './tenants.repo';

export const tenantsRouter = Router();

tenantsRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await listTenants());
  } catch (err) {
    next(err);
  }
});
