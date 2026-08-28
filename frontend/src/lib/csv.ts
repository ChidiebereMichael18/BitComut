import { downloadCsv } from "@/lib/export"

export const CSV_TEMPLATE_COLUMNS = ["student_id", "name", "email", "status"]

/** Maximum accepted upload size: 10 MB. */
export const MAX_CSV_SIZE = 10 * 1024 * 1024

/**
 * Parse a CSV string into rows of cells. Handles quoted fields, escaped
 * double-quotes (""), and commas/newlines inside quoted values (RFC 4180).
 * Used for client-side import preview/validation.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ""
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      pushField()
    } else if (ch === "\n") {
      pushRow()
    } else if (ch === "\r") {
      // ignore CR (normalize \r\n and \r to \n)
    } else {
      field += ch
    }
  }

  // Final field/row if the text didn't end with a newline.
  if (field.length > 0 || row.length > 0) pushRow()

  // Drop completely empty trailing rows.
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""))
}

export interface CsvParseResult {
  /** 0-based index of the row within the file (1 for first data row). */
  rowNumber: number
  studentId: string
  name: string
  email: string
  status: "Active" | "Inactive"
  /** Validation errors for this row. Empty when valid. */
  errors: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate a single parsed row against the required schema. Treats all values
 * as untrusted input — they are validated/labelled only, never rendered as
 * markup.
 */
export function validateStudentRow(
  raw: string[],
  rowNumber: number
): CsvParseResult {
  // Columns: student_id, name, email, status
  const get = (i: number) => (raw[i] ?? "").trim()
  const studentId = get(0)
  const name = get(1)
  const email = get(2)
  const statusRaw = get(3).toUpperCase()

  const errors: string[] = []
  if (!studentId) errors.push("student_id is required")
  if (!name) errors.push("name is required")
  if (!email) errors.push("email is required")
  else if (!EMAIL_RE.test(email)) errors.push(`"${email}" is not a valid email`)

  let status: "Active" | "Inactive" = "Active"
  if (statusRaw === "ACTIVE" || statusRaw === "INACTIVE") {
    status = statusRaw === "ACTIVE" ? "Active" : "Inactive"
  } else {
    errors.push(statusRaw ? `status must be ACTIVE or INACTIVE (got "${statusRaw}")` : "status is required")
  }

  return { rowNumber, studentId, name, email, status, errors }
}

/**
 * Split a raw CSV file into valid and invalid student rows. Returns the
 * required-column set that was found (or an error naming missing headers).
 */
export function parseStudentCsv(text: string): {
  headerError?: string
  rows: CsvParseResult[]
} {
  const rows = parseCsv(text)
  if (rows.length === 0) {
    return { headerError: "The file is empty.", rows: [] }
  }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const normHeader = header.map(
    (h) => (h === "student id" ? "student_id" : h) // tolerate "student id"
  )
  const missing = CSV_TEMPLATE_COLUMNS.filter(
    (col) => !normHeader.includes(col)
  )
  if (missing.length > 0) {
    return {
      headerError: `Missing required column: ${missing.join(", ")}`,
      rows: [],
    }
  }

  // Find each required column's index (case-insensitive).
  const idx = {
    studentId: normHeader.indexOf("student_id"),
    name: normHeader.indexOf("name"),
    email: normHeader.indexOf("email"),
    status: normHeader.indexOf("status"),
  }
  const colOrder = [idx.studentId, idx.name, idx.email, idx.status]

  const result: CsvParseResult[] = []
  rows.slice(1).forEach((row, i) => {
    // Re-order cells into the canonical [student_id, name, email, status] shape.
    const canonical = colOrder.map((c) => (c >= 0 ? row[c] ?? "" : ""))
    result.push(validateStudentRow(canonical, i + 2))
  })

  return { rows: result }
}

/** Client-generated CSV template matching the required format. */
export function downloadStudentCsvTemplate(): void {
  downloadCsv("students-template.csv", CSV_TEMPLATE_COLUMNS, [
    ["STU001", "John Doe", "john@example.com", "ACTIVE"],
  ])
}
