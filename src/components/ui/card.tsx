import { type HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 text-card-foreground shadow-sm transition-shadow duration-200",
        className,
      )}
      {...props}
    />
  )
}
