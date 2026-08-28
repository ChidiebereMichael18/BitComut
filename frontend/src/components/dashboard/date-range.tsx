"use client"

import { useState } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const RANGES = [
  "Today",
  "Last 7 days",
  "Last 30 days",
  "This semester",
  "Custom",
] as const

export function DateRange() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("Last 30 days")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarDays className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">{range}</span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {RANGES.map((r) => (
          <DropdownMenuItem
            key={r}
            onSelect={() => setRange(r)}
            disabled={r === "Custom"}
          >
            {r}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
