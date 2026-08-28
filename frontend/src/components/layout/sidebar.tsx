"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { mainNav, secondaryNav } from "@/lib/navigation"
import type { University } from "@/lib/types"
import { Logo } from "@/components/layout/logo"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

function NavLink({
  title,
  href,
  icon: Icon,
  active,
}: (typeof mainNav)[number] & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active &&
          "bg-accent font-semibold text-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{title}</span>
    </Link>
  )
}

export function Sidebar({
  university,
  accent,
}: {
  university: University
  accent?: string
}) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname.startsWith(href)

  return (
    <div className="flex h-full flex-col gap-4 border-r bg-sidebar py-5">
      <div className="px-6">
        <Logo
          name={university.name}
          shortName={university.shortName}
          color={accent}
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main navigation">
        {mainNav.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
          />
        ))}

        <Separator className="my-3" />

        {secondaryNav.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      <div className="relative z-[1] shrink-0 overflow-hidden border-t px-6 pt-4 pb-2 text-xs text-muted-foreground">
        <p className="truncate font-medium text-foreground/80" title={university.name}>
          {university.name}
        </p>
        <p className="mt-0.5 truncate" title={university.address}>
          {university.address}
        </p>
      </div>
    </div>
  )
}
