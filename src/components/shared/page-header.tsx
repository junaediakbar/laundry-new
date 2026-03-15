import Link from "next/link"

import { Button } from "@/components/ui/button"

type PageHeaderProps = {
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
}

export function PageHeader({ title, description, actionHref, actionLabel }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
    </div>
  )
}
