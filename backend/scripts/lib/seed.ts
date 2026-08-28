import bcrypt from 'bcryptjs';
import { pool } from '../../src/config/db';
import { logger } from '../../src/config/logger';

const TENANT = {
  id: 'tn_dau',
  slug: 'digital-art-university',
  name: 'Digital Art University',
  short_name: 'DAU',
  address: 'KN 5 Rd, Kigali Innovation City, Kigali',
  email: 'info@digitalartuniversity.edu',
  phone: '+250 700 000 000',
  website: 'https://digitalartuniversity.edu',
  currency: 'RWF',
  default_currency: 'RWF',
  settlement_currency: 'RWF',
  admin_name: 'Digital Art Admin',
  admin_email: 'digitalartsuniversiti@edu.co',
  country: 'Rwanda',
  campus_name: 'Main Campus, Kigali',
  student_count: 0,
  established: '2019',
  logo_color: '#7C3AED',
};

const ADMIN = {
  email: 'digitalartsuniversiti@edu.co',
  password: 'Rwanda@123',
  displayName: 'Digital Art Admin',
};

export async function seed(): Promise<void> {
  // 1. Tenant
  const exists = await pool.query('SELECT 1 FROM tenants WHERE id=$1', [TENANT.id]);
  if (!exists.rows.length) {
    await pool.query(
      `INSERT INTO tenants (id, slug, name, short_name, address, email, phone, website, currency,
        default_currency, settlement_currency, admin_name, admin_email, country, campus_name,
        student_count, established, logo_color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [
        TENANT.id, TENANT.slug, TENANT.name, TENANT.short_name, TENANT.address,
        TENANT.email, TENANT.phone, TENANT.website, TENANT.currency,
        TENANT.default_currency, TENANT.settlement_currency, TENANT.admin_name,
        TENANT.admin_email, TENANT.country, TENANT.campus_name, TENANT.student_count,
        TENANT.established, TENANT.logo_color,
      ],
    );
    logger.info({ slug: TENANT.slug }, 'seeded tenant');
  } else {
    logger.info({ slug: TENANT.slug }, 'tenant already exists, skipping');
  }

  // 2. Admin user (the demo login credential)
  const userExists = await pool.query('SELECT 1 FROM users WHERE email=$1', [ADMIN.email]);
  if (!userExists.rows.length) {
    const passwordHash = await bcrypt.hash(ADMIN.password, 10);
    await pool.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, display_name, role)
       VALUES ($1,$2,$3,$4,$5,'Admin')`,
      ['usr_dau_admin', TENANT.id, ADMIN.email, passwordHash, ADMIN.displayName],
    );
    logger.info({ email: ADMIN.email }, 'seeded admin user');
  } else {
    logger.info({ email: ADMIN.email }, 'admin user already exists, skipping');
  }

  // 3. Default payout account so the settlement -> withdrawal loop completes.
  const accExists = await pool.query('SELECT 1 FROM payment_accounts WHERE tenant_id=$1', [TENANT.id]);
  if (!accExists.rows.length) {
    await pool.query(
      `INSERT INTO payment_accounts (id, tenant_id, type, label, holder_name, number, provider, currency, is_default)
       VALUES ($1,$2,'mobile_money','MTN Kigali','Digital Art University','0788000001','MTN','RWF',true)`,
      ['pa_dau_mtn', TENANT.id],
    );
    logger.info('seeded default payment account');
  } else {
    logger.info('payment account already exists, skipping');
  }

  // 4. Demo students + invoices so the student portal has something to show.
  const STUDENTS: {
    id: string; name: string; email: string; program: string; year: string;
    invoices: { type: string; description: string; amount: number; due_days: number }[];
  }[] = [
    {
      id: 'STU-001',
      name: 'Alice Mbabazi',
      email: 'alice@example.com',
      program: 'Digital Arts',
      year: '2026',
      invoices: [
        { type: 'Tuition', description: 'Semester 1 tuition', amount: 1500000, due_days: 30 },
        { type: 'Library Fee', description: 'Annual library fee', amount: 50000, due_days: 14 },
      ],
    },
    {
      id: 'STU-002',
      name: 'Bob Niyonzima',
      email: 'bob@example.com',
      program: 'Graphic Design',
      year: '2026',
      invoices: [
        { type: 'Tuition', description: 'Semester 1 tuition', amount: 1500000, due_days: 21 },
      ],
    },
  ];

  for (const s of STUDENTS) {
    const exists = await pool.query('SELECT 1 FROM students WHERE tenant_id=$1 AND id=$2', [TENANT.id, s.id]);
    if (exists.rows.length) {
      logger.info({ id: s.id }, 'student already exists, skipping');
      continue;
    }
    await pool.query(
      `INSERT INTO students (id, tenant_id, name, email, phone, program, year, status, created_at)
       VALUES ($1,$2,$3,$4,NULL,$5,$6,'Active', now())`,
      [s.id, TENANT.id, s.name, s.email, s.program, s.year],
    );
    for (const inv of s.invoices) {
      const dueDate = new Date(Date.now() + inv.due_days * 86400000).toISOString();
      await pool.query(
        `INSERT INTO invoices (id, number, tenant_id, student_id, type, description, amount, currency, due_date, status, created, amount_paid)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'RWF', $8, 'Unpaid', now(), 0)`,
        [
          `inv_${s.id}_${inv.type.replace(/[^a-z]/gi, '').toLowerCase()}`,
          `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          TENANT.id, s.id, inv.type, inv.description, inv.amount, dueDate,
        ],
      );
    }
    logger.info({ id: s.id }, 'seeded student + invoices');
  }
  await pool.query('UPDATE tenants SET student_count=$2 WHERE id=$1', [TENANT.id, STUDENTS.length]);

  logger.info('Seed complete');
}