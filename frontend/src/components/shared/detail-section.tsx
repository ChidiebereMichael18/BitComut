import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
interface DetailRow {
  label: string
  value: React.ReactNode
}

interface DetailSectionProps {
  title: string
  children?: React.ReactNode
  rows?: DetailRow[]
  className?: string
  contentClassName?: string
}

export function DetailSection({
  title,
  children,
  rows,
  className,
  contentClassName,
}: DetailSectionProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className={contentClassName}>
        {rows ? (
          <dl className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-6 text-sm"
              >
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-right font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
