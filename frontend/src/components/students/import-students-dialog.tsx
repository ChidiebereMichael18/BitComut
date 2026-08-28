"use client"

import { useRef, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTenantSlug } from "@/components/tenant-provider"
import { importStudentsToTenant, type ImportStudentsSummary } from "@/app/actions/tenant"
import {
  parseStudentCsv,
  downloadStudentCsvTemplate,
  MAX_CSV_SIZE,
  CSV_TEMPLATE_COLUMNS,
  type CsvParseResult,
} from "@/lib/csv"
import type { Student } from "@/lib/types"

type Step = "upload" | "preview" | "importing" | "done"

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function ErrorList({ rows }: { rows: CsvParseResult[] }) {
  return (
    <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      {rows.map((r) => (
        <div key={r.rowNumber} className="text-sm">
          <p className="font-medium text-destructive">Row {r.rowNumber}: {r.studentId || r.name || "(no ID)"}</p>
          <ul className="mt-0.5 list-inside list-disc text-muted-foreground">
            {r.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function ImportStudentsDialog({ onImported }: { onImported: () => void }) {
  const slug = useTenantSlug()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("upload")
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [headerError, setHeaderError] = useState<string | null>(null)
  const [validRows, setValidRows] = useState<CsvParseResult[]>([])
  const [invalidRows, setInvalidRows] = useState<CsvParseResult[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [summary, setSummary] = useState<ImportStudentsSummary | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep("upload")
    setFileName(null)
    setFileError(null)
    setHeaderError(null)
    setValidRows([])
    setInvalidRows([])
    setShowErrors(false)
    setSummary(null)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const processFile = (file: File) => {
    setFileError(null)
    setHeaderError(null)
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Invalid file type. Please upload a .csv file.")
      return
    }
    if (file.size > MAX_CSV_SIZE) {
      setFileError(`File is too large (${formatBytes(file.size)}). Maximum size is 10 MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      const { headerError, rows } = parseStudentCsv(text)
      if (headerError) {
        setHeaderError(headerError)
        setFileName(file.name)
        return
      }
      setFileName(file.name)
      setValidRows(rows.filter((r) => r.errors.length === 0))
      setInvalidRows(rows.filter((r) => r.errors.length > 0))
      setStep("preview")
    }
    reader.onerror = () => {
      setFileError("Unable to read the file. Please try again.")
    }
    reader.readAsText(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // reset so selecting the same file again re-triggers change
    e.target.value = ""
  }

  const handleImport = async () => {
    setStep("importing")
    const students: Student[] = validRows.map((r) => ({
      id: r.studentId,
      name: r.name,
      email: r.email,
      status: r.status,
      program: "General",
      year: "Year 1",
      createdAt: new Date().toISOString(),
    }))
    try {
      const result = await importStudentsToTenant(slug, students)
      setSummary(result)
      setStep("done")
      toast.success("Students imported", {
        description: `${result.imported} students imported, ${result.duplicates} existing skipped.`,
      })
    } catch {
      setStep("preview")
      setFileError("Unable to import students. Please check your CSV file and try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="size-4" aria-hidden="true" />
          Import Students
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" aria-hidden="true" />
            Import Students
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file containing your university&apos;s student records.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 text-sm">
              <div>
                <p className="font-medium">Required format</p>
                <p className="font-mono text-xs text-muted-foreground">{CSV_TEMPLATE_COLUMNS.join(",")}</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadStudentCsvTemplate}>
                <FileText className="mr-2 size-4" aria-hidden="true" />
                Download CSV Template
              </Button>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const file = e.dataTransfer.files?.[0]
                if (file) processFile(file)
              }}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
              }`}
            >
              <Upload className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium">Drag &amp; drop your CSV here</p>
              <p className="text-sm text-muted-foreground">or</p>
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground">Maximum file size: 10 MB · .csv only</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInput}
            />

            {fileError && (
              <Alert variant="destructive">
                <AlertTitle>Unable to use file</AlertTitle>
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}
            {!fileError && headerError && (
              <Alert variant="destructive">
                <AlertTitle>Invalid CSV format</AlertTitle>
                <AlertDescription>
                  {headerError}. Expected columns: {CSV_TEMPLATE_COLUMNS.join(", ")}.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ve found{" "}
              <span className="font-medium text-foreground">{validRows.length + invalidRows.length}</span>{" "}
              student records in {fileName}.
            </p>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validRows.slice(0, 5).map((r) => (
                    <TableRow key={r.rowNumber}>
                      <TableCell className="font-mono text-muted-foreground">{r.studentId}</TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email}</TableCell>
                      <TableCell>{r.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {validRows.length > 5 && (
              <p className="text-xs text-muted-foreground">
                Showing first 5 of {validRows.length} records.
              </p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {validRows.length} valid
              </span>
              {invalidRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowErrors((s) => !s)}
                  className="font-medium text-destructive hover:underline"
                >
                  {invalidRows.length} invalid {showErrors ? "(hide)" : "(view)"}
                </button>
              )}
            </div>

            {showErrors && invalidRows.length > 0 && <ErrorList rows={invalidRows} />}

            {fileError && (
              <Alert variant="destructive">
                <AlertTitle>Import failed</AlertTitle>
                <AlertDescription>{fileError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={reset}>
                <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
              >
                Import {validRows.length} Student{validRows.length === 1 ? "" : "s"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-8 text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-primary" aria-hidden="true" />
            <p className="font-medium">Importing students...</p>
            <p className="text-sm text-muted-foreground">Please don&apos;t close this window.</p>
          </div>
        )}

        {step === "done" && summary && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border bg-emerald-500/10 p-4">
              <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
              <div>
                <p className="font-semibold">Students imported successfully</p>
                <p className="text-sm text-muted-foreground">
                  {summary.imported + summary.updated + summary.duplicates} student records were
                  processed.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Imported", value: summary.imported },
                { label: "Updated", value: summary.updated },
                { label: "Existing skipped", value: summary.duplicates },
                { label: "Failed", value: summary.failed },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setOpen(false)
                  reset()
                  onImported()
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
