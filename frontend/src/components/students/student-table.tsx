import Link from "next/link"

import type { StudentSummary } from "@/lib/services/students"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function StatusBadge({ status }: { status: StudentSummary["status"] }) {
  const active = status === "Active"
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
      )}
    >
      {status === "Graduated" ? "Graduated" : active ? "Active" : "Inactive"}
    </Badge>
  )
}

export function StudentTable({ students }: { students: StudentSummary[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Imported</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.id}</TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {initials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium hover:underline">{student.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{student.email}</TableCell>
                <TableCell>
                  <StatusBadge status={student.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.createdAt ? formatDate(student.createdAt) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/students/${student.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {students.map((student) => (
          <Link
            key={student.id}
            href={`/dashboard/students/${student.id}`}
            className="block rounded-lg border p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs">
                    {initials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.id}</p>
                  <p className="text-xs text-muted-foreground">{student.email}</p>
                </div>
              </div>
              <StatusBadge status={student.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Imported</span>
              <span>{student.createdAt ? formatDate(student.createdAt) : "—"}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
