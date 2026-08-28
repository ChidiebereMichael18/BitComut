export const TENANT_COOKIE = "bitcomut:tenant"

export const SESSION_COOKIE = "bitcomut_session"

export const DEFAULT_SLUG = "digital-art-university"

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const LOGO_COLOR_PALETTE = [
  "indigo",
  "emerald",
  "amber",
  "rose",
  "sky",
  "violet",
]
