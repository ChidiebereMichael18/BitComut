import { parse } from 'csv-parse/sync';
import type { StudentStatus } from '../../modules/types';

/**
 * RFC 4180 student import parsing/validation.
 * Column contract (case-insensitive headers):
 *   student_id, name, email, status
 * status values are uppercase ACTIVE/INACTIVE mapped to Active/Inactive.
 */

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface StudentImportRow {
  studentId: string;
  name: string;
  email: string;
  status: StudentStatus;
  error?: string;
}

export interface StudentImportResult {
  rows: StudentImportRow[];
  // top-level parse error (unparseable file)
  columnHeader?: string[];
  allHaveHeaders: boolean;
}

const headerAliases: Record<string, string> = {
  studentid: 'student_id',
  'student id': 'student_id',
  id: 'student_id',
  name: 'name',
  fullname: 'name',
  studentname: 'name',
  email: 'email',
  emailaddress: 'email',
  status: 'status',
  studentstatus: 'status',
};

function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase().replace(/\s+/g, ' ');
  return headerAliases[key] ?? h.trim().toLowerCase();
}

export function parseStudentCsv(
  buffer: Buffer,
  opts: { maxBytes?: number } = {},
): StudentImportResult {
  const maxBytes = opts.maxBytes ?? 10 * 1024 * 1024; // 10 MB
  if (buffer.length > maxBytes) {
    throw new Error('CSV exceeds maximum upload size of 10 MB');
  }

  let records: string[][] = [];
  try {
    records = parse(buffer.toString('utf8'), {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
    }) as unknown as string[][];
  } catch (e) {
    const err = e as { message?: string };
    throw new Error(`Could not parse CSV: ${err?.message ?? 'unknown error'}`);
  }

  if (records.length === 0) {
    return { rows: [], allHaveHeaders: false };
  }

  const headerRow = records[0].map(normalizeHeader);
  const hasHeader = headerRow.some((h) => h === 'student_id');

  const rows: StudentImportRow[] = [];
  const dataStart = hasHeader ? 1 : 0;

  for (let i = dataStart; i < records.length; i++) {
    const raw = records[i];
    const row: Record<string, string> = {};
    headerRow.forEach((h, idx) => {
      row[h] = (raw[idx] ?? '').trim();
    });

    if (!hasHeader) {
      // positional: [student_id, name, email, status]
      row['student_id'] = (raw[0] ?? '').trim();
      row['name'] = (raw[1] ?? '').trim();
      row['email'] = (raw[2] ?? '').trim();
      row['status'] = (raw[3] ?? '').trim();
    }

    const entry: StudentImportRow = {
      studentId: row['student_id'] ?? '',
      name: row['name'] ?? '',
      email: row['email'] ?? '',
      status: 'Active',
    };

    const errors: string[] = [];
    if (!entry.studentId) errors.push('student_id is required');
    if (!entry.name) errors.push('name is required');
    if (!entry.email) errors.push('email is required');
    else if (!emailRe.test(entry.email)) errors.push('email is invalid');

    const statusUpper = (row['status'] ?? 'ACTIVE').trim().toUpperCase();
    if (statusUpper === 'ACTIVE') entry.status = 'Active';
    else if (statusUpper === 'INACTIVE') entry.status = 'Inactive';
    else errors.push(`status must be ACTIVE or INACTIVE (got "${row['status'] ?? ''}")`);

    if (errors.length) entry.error = errors.join('; ');
    rows.push(entry);
  }

  return { rows, columnHeader: hasHeader ? undefined : headerRow, allHaveHeaders: hasHeader };
}
