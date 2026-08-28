import { Router } from 'express';
import { randomBytes } from 'crypto';
import multer from 'multer';
import { ApiError } from '../../middleware/error-handler';
import { getTenantId } from '../../middleware/tenant';
import { validateBody, validateQuery } from '../../middleware/validate';
import { requireIdempotencyKey, withIdempotency } from '../../lib/idempotency';
import {
  listStudents,
  getStudent,
  createStudent,
  upsertStudentByKey,
  addTenantStudentCount,
} from './students.repo';
import * as listInvRepo from '../invoices/invoices.repo';
import * as listPayRepo from '../payments/payments.repo';
import { parseStudentCsv } from '../../lib/csv/student-csv';
import { createStudentSchema, listStudentsQuerySchema } from './schema';
import { logger } from '../../config/logger';
import { pool } from '../../config/db';

export const studentsRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

studentsRouter.get('/', validateQuery(listStudentsQuerySchema), async (_req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const q = res.locals.validatedQuery as { search?: string; page?: number; limit?: number };
    const result = await listStudents(tenantId, q);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

studentsRouter.get('/import/template', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.attachment('students-import-template.csv');
  res.send('student_id,name,email,status\nSTU-001,Alice Mbabazi,alice@example.com,ACTIVE\n');
});

studentsRouter.get('/:id', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const s = await getStudent(tenantId, req.params.id);
    if (!s) throw ApiError.notFound('Student not found');
    res.json(s);
  } catch (err) {
    next(err);
  }
});

studentsRouter.post(
  '/',
  requireIdempotencyKey,
  validateBody(createStudentSchema),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(res);
      const body = req.body as typeof createStudentSchema._type;
      const id = `st_${randomBytes(8).toString('hex')}`;
      await withIdempotency(req, res, tenantId, async () => {
        const student = await createStudent(tenantId, {
          id,
          name: body.name,
          email: body.email,
          phone: body.phone,
          program: body.program,
          year: body.year,
          status: body.status,
        });
        await addTenantStudentCount(tenantId, 1);
        return student;
      }, { status: 201 });
    } catch (err) {
      next(err);
    }
  },
);

studentsRouter.post(
  '/import',
  requireIdempotencyKey,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const tenantId = getTenantId(res);
      if (!req.file) throw ApiError.badRequest('CSV file is required for import');
      await withIdempotency(req, res, tenantId, async () => {
        return importStudents(tenantId, req.file!.buffer);
      });
    } catch (err) {
      next(err);
    }
  },
);

async function importStudents(tenantId: string, buffer: Buffer) {
  const parsed = parseStudentCsv(buffer);
  let imported = 0;
  let updated = 0;
  let duplicates = 0;
  const failed: { student_id: string; errors: string }[] = [];
  const seen = new Set<string>();

  // Within a single file, duplicate student_id rows count as duplicates after
  // the first occurrence.
  for (const row of parsed.rows) {
    if (row.error) {
      failed.push({ student_id: row.studentId || '(missing)', errors: row.error });
      continue;
    }
    if (seen.has(row.studentId)) {
      duplicates++;
      continue;
    }
    seen.add(row.studentId);

    try {
      const { updated: wasUpdated } = await upsertStudentByKey(tenantId, {
        id: row.studentId,
        name: row.name,
        email: row.email,
        status: row.status,
        program: 'Undeclared',
        year: 'Unknown',
      });
      if (wasUpdated) updated++;
      else imported++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'DB error';
      logger.warn({ err, studentId: row.studentId }, 'import row failed');
      failed.push({ student_id: row.studentId, errors: msg });
    }
  }

  // Keep tenant.student_count consistent with the real number of student rows.
  const cnt = await pool.query<{ c: string }>(
    'SELECT COUNT(*) c FROM students WHERE tenant_id=$1',
    [tenantId],
  );
  await pool.query('UPDATE tenants SET student_count=$2 WHERE id=$1', [
    tenantId,
    Number(cnt.rows[0].c),
  ]);

  return { imported, updated, duplicates, failed };
}

studentsRouter.get('/:id/invoices', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const s = await getStudent(tenantId, req.params.id);
    if (!s) throw ApiError.notFound('Student not found');
    const invoices = await listInvRepo.listInvoices(tenantId, { studentId: req.params.id });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

studentsRouter.get('/:id/payments', async (req, res, next) => {
  try {
    const tenantId = getTenantId(res);
    const s = await getStudent(tenantId, req.params.id);
    if (!s) throw ApiError.notFound('Student not found');
    const payments = await listPayRepo.listPayments(tenantId, {
      search: req.params.id,
      limit: 100,
    });
    res.json(payments);
  } catch (err) {
    next(err);
  }
});
