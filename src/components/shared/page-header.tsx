import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3",
        "landscape:mb-4 landscape:sm:mb-6",
        className,
      )}
    >
      <div className="min-w-0 animate-fade-in-up">
        <div className="mb-1 h-1 w-12 rounded-full bg-primary/80" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="shrink-0 animate-fade-in-up">
          <Button className="shadow-md shadow-primary/15 transition-transform hover:scale-[1.02] active:scale-[0.98]">
            {actionLabel}
          </Button>
        </Link>
      ) : null}
    </div>
  )
}
