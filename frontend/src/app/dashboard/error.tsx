"use client"

import { PageError } from "@/components/shared/page-error"

export default function Error({
  retry,
}: {
  retry: () => void
}) {
  return <PageError onRetry={retry} />
}
