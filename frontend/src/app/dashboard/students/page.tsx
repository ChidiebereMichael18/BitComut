import { StudentsManager } from "@/components/students/students-manager"

export const metadata = {
  title: "Students",
}

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="mt-1 text-muted-foreground">
          All students associated with the university and their payment status.
        </p>
      </div>
      <StudentsManager />
    </div>
  )
}
