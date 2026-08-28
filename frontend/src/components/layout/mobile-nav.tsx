"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu } from "lucide-react"

import { mainNav, secondaryNav } from "@/lib/navigation"
import type { University } from "@/lib/types"
import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export function MobileNav({
  university,
  accent,
}: {
  university: University
  accent?: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname.startsWith(href)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col gap-6 p-0">
        <SheetHeader className="px-6 pt-5">
          <SheetTitle className="text-left">
            <Logo name={university.name} shortName={university.shortName} color={accent} />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Mobile navigation">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive(item.href) && "bg-accent font-semibold text-accent-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.title}</span>
            </Link>
          ))}

          <Separator className="my-3" />

          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive(item.href) && "bg-accent font-semibold text-accent-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t px-6 py-4 text-xs text-muted-foreground">
          <p className="truncate font-medium text-foreground">{university.name}</p>
          <p className="mt-0.5 truncate">{university.address}</p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
