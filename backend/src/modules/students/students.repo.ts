import { pool } from '../../config/db';
import type { Student } from '../types';

interface StudentRow {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string | null;
  program: string;
  year: string;
  status: string;
  created_at: Date | null;
}

export function mapStudent(r: StudentRow): Student {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    program: r.program,
    year: r.year,
    status: r.status as Student['status'],
    createdAt: r.created_at ? r.created_at.toISOString() : null,
  };
}

export interface StudentListResult {
  data: Student[];
  total: number;
  page: number;
  limit: number;
}

export async function listStudents(
  tenantId: string,
  opts: { search?: string; page?: number; limit?: number },
): Promise<StudentListResult> {
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 100) : 20;
  const offset = (page - 1) * limit;

  const search = opts.search?.trim();
  const where = ['tenant_id = $1'];
  const params: unknown[] = [tenantId];
  if (search) {
    params.push(`%${search}%`);
    where.push(
      `(name ILIKE $${params.length} OR id ILIKE $${params.length} OR email ILIKE $${params.length} OR program ILIKE $${params.length})`,
    );
  }

  const whereSql = where.join(' AND ');
  const count = await pool.query<{ c: string }>(
    `SELECT COUNT(*) AS c FROM students WHERE ${whereSql}`,
    params,
  );
  const total = Number(count.rows[0].c);

  const listParams = [...params, limit, offset];
  const res = await pool.query<StudentRow>(
    `SELECT * FROM students WHERE ${whereSql}
     ORDER BY created_at DESC NULLS LAST
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    data: res.rows.map(mapStudent),
    total,
    page,
    limit,
  };
}

export async function getStudent(tenantId: string, id: string): Promise<Student | null> {
  const res = await pool.query<StudentRow>(
    `SELECT * FROM students WHERE tenant_id=$1 AND id=$2`,
    [tenantId, id],
  );
  return res.rows[0] ? mapStudent(res.rows[0]) : null;
}

export async function createStudent(
  tenantId: string,
  data: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    program: string;
    year: string;
    status: Student['status'];
  },
): Promise<Student> {
  const res = await pool.query<StudentRow>(
    `INSERT INTO students (id, tenant_id, name, email, phone, program, year, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
     RETURNING *`,
    [data.id, tenantId, data.name, data.email, data.phone ?? null, data.program, data.year, data.status],
  );
  return mapStudent(res.rows[0]);
}

/** Upsert by natural key `id` per tenant. Returns { student, updated }. */
export async function upsertStudentByKey(
  tenantId: string,
  data: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    program: string;
    year: string;
    status: Student['status'];
  },
): Promise<{ student: Student; updated: boolean }> {
  const res = await pool.query<StudentRow>(
    `INSERT INTO students (id, tenant_id, name, email, phone, program, year, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
     ON CONFLICT (tenant_id, id)
     DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, phone=EXCLUDED.phone,
                   program=EXCLUDED.program, year=EXCLUDED.year, status=EXCLUDED.status
     RETURNING *, (xmax = 0) AS inserted`,
    [data.id, tenantId, data.name, data.email, data.phone ?? null, data.program, data.year, data.status],
  );
  const row = res.rows[0] as StudentRow & { inserted?: boolean };
  return { student: mapStudent(row), updated: !row.inserted };
}

export async function addTenantStudentCount(tenantId: string, delta: number): Promise<void> {
  await pool.query(
    'UPDATE tenants SET student_count = GREATEST(0, student_count + $2) WHERE id=$1',
    [tenantId, delta],
  );
}
