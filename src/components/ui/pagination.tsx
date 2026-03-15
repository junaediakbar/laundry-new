import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PaginationProps = {
  page: number
  pageSize: number
  totalItems: number
  buildHref: (nextPage: number) => string
  className?: string
}

export function Pagination({ page, pageSize, totalItems, buildHref, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)

  const canPrev = current > 1
  const canNext = current < totalPages

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 p-4", className)}>
      <p className="text-sm text-muted-foreground">
        Page {current} of {totalPages} • {totalItems.toLocaleString("id-ID")} data
      </p>
      <div className="flex items-center gap-2">
        <Link href={buildHref(1)} aria-disabled={!canPrev} tabIndex={!canPrev ? -1 : undefined}>
          <Button size="sm" variant="outline" disabled={!canPrev}>
            First
          </Button>
        </Link>
        <Link
          href={buildHref(current - 1)}
          aria-disabled={!canPrev}
          tabIndex={!canPrev ? -1 : undefined}
        >
          <Button size="sm" variant="outline" disabled={!canPrev}>
            Prev
          </Button>
        </Link>
        <Link
          href={buildHref(current + 1)}
          aria-disabled={!canNext}
          tabIndex={!canNext ? -1 : undefined}
        >
          <Button size="sm" variant="outline" disabled={!canNext}>
            Next
          </Button>
        </Link>
        <Link
          href={buildHref(totalPages)}
          aria-disabled={!canNext}
          tabIndex={!canNext ? -1 : undefined}
        >
          <Button size="sm" variant="outline" disabled={!canNext}>
            Last
          </Button>
        </Link>
      </div>
    </div>
  )
}
