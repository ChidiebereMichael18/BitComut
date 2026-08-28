"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, GraduationCap, Receipt, FileText } from "lucide-react"

import { Input } from "@/components/ui/input"
import { globalSearch, type GlobalSearchResults, type SearchResultItem } from "@/lib/search"
import { useTenantSlug } from "@/components/tenant-provider"

const KIND_META: Record<
  SearchResultItem["kind"],
  { label: string; key: "students" | "payments" | "invoices"; icon: typeof GraduationCap }
> = {
  student: { label: "Students", key: "students", icon: GraduationCap },
  payment: { label: "Payments", key: "payments", icon: Receipt },
  invoice: { label: "Invoices", key: "invoices", icon: FileText },
}

function ResultRow({ item, onNavigate }: { item: SearchResultItem; onNavigate: () => void }) {
  const { label, icon: Icon } = KIND_META[item.kind]
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-md p-2 text-sm transition-colors hover:bg-accent"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.meta}
        </span>
      </span>
      <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </Link>
  )
}

export function GlobalSearch() {
  const slug = useTenantSlug()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResults>({
    students: [],
    payments: [],
    invoices: [],
  })
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Close the dropdown on route change. Deferred so the setState runs in a
    // callback, avoiding a synchronous setState during the effect render.
    const handle = setTimeout(() => setOpen(false), 0)
    return () => clearTimeout(handle)
  }, [pathname])

  // Debounced live search against the backend.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    let active = true
    const handle = setTimeout(async () => {
      setSearching(true)
      try {
        const next = await globalSearch(q, slug)
        if (!active) return
        setResults(next)
      } finally {
        if (active) setSearching(false)
      }
    }, 250)
    return () => {
      active = false
      clearTimeout(handle)
    }
  }, [query, slug])

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
      if (e.key === "/" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        inputRef.current?.focus()
        e.preventDefault()
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const hasQuery = query.trim().length > 0
  const hasResults =
    results.students.length > 0 ||
    results.payments.length > 0 ||
    results.invoices.length > 0

  const close = () => {
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={rootRef} className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search payments, students, invoices..."
        className="pl-8"
        aria-label="Search"
        aria-expanded={open}
        role="combobox"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground sm:block">
        /
      </kbd>

      {open && hasQuery ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
          {hasResults ? (
            <div className="max-h-96 overflow-y-auto p-1.5">
              {(["student", "payment", "invoice"] as const).map(
                (kind) => {
                  const items = results[KIND_META[kind].key]
                  return (
                    items.length > 0 && (
                      <div key={kind} className="mb-1">
                        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {KIND_META[kind].label}
                        </p>
                        <div className="space-y-0.5">
                          {items.map((item) => (
                            <ResultRow
                              key={`${item.kind}-${item.id}`}
                              item={item}
                              onNavigate={close}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )
                }
              )}
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              {searching
                ? "Searching..."
                : `No results for "${query.trim()}"`}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
