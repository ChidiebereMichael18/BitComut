import { pool } from '../../config/db';

interface TenantRow {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  currency: string;
  default_currency: string;
  settlement_currency: string;
  admin_name: string;
  admin_email: string;
  country: string;
  campus_name: string;
  student_count: number;
  established: string;
  created_at: Date;
  logo_color: string;
}

export function mapTenant(r: TenantRow) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    shortName: r.short_name,
    address: r.address,
    email: r.email,
    phone: r.phone,
    website: r.website,
    currency: r.currency,
    defaultCurrency: r.default_currency,
    settlementCurrency: r.settlement_currency,
    adminName: r.admin_name,
    adminEmail: r.admin_email,
    country: r.country,
    campusName: r.campus_name,
    studentCount: r.student_count,
    established: r.established,
    createdAt: r.created_at.toISOString(),
    logoColor: r.logo_color,
  };
}

export async function getTenant(tenantId: string) {
  const res = await pool.query<TenantRow>('SELECT * FROM tenants WHERE id=$1', [tenantId]);
  return res.rows[0] ? mapTenant(res.rows[0]) : null;
}

export async function getTenantBySlug(slug: string) {
  const res = await pool.query<TenantRow>('SELECT * FROM tenants WHERE slug=$1', [slug]);
  return res.rows[0] ? mapTenant(res.rows[0]) : null;
}

export async function listTenants() {
  const res = await pool.query<TenantRow>('SELECT * FROM tenants ORDER BY created_at');
  return res.rows.map(mapTenant);
}

export async function updateTenant(
  tenantId: string,
  data: Partial<{
    name: string;
    short_name: string;
    address: string;
    email: string;
    phone: string;
    website: string;
    currency: string;
    settlement_currency: string;
    admin_name: string;
    admin_email: string;
    country: string;
    campus_name: string;
    established: string;
    logo_color: string;
  }>,
) {
  const fields = Object.keys(data);
  if (fields.length === 0) return getTenant(tenantId);
  const sets = fields.map((f, i) => `${f}=$${i + 2}`).join(', ');
  const res = await pool.query<TenantRow>(
    `UPDATE tenants SET ${sets} WHERE id=$1 RETURNING *`,
    [tenantId, ...fields.map((f) => (data as Record<string, unknown>)[f])],
  );
  return res.rows[0] ? mapTenant(res.rows[0]) : null;
}

export async function createTenant(data: TenantRow): Promise<TenantRow> {
  const res = await pool.query<TenantRow>(
    `INSERT INTO tenants (id, slug, name, short_name, address, email, phone, website, currency,
                          default_currency, settlement_currency, admin_name, admin_email, country,
                          campus_name, student_count, established, logo_color)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [
      data.id, data.slug, data.name, data.short_name, data.address, data.email,
      data.phone, data.website, data.currency, data.default_currency,
      data.settlement_currency, data.admin_name, data.admin_email, data.country,
      data.campus_name, data.student_count, data.established, data.logo_color,
    ],
  );
  return res.rows[0];
}
