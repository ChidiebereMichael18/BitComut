import { Metadata } from "next"

import { PageSkeleton } from "@/components/shared/page-skeleton"

export const metadata: Metadata = {
  title: "Loading",
}

export default function Loading() {
  return <PageSkeleton />
}
