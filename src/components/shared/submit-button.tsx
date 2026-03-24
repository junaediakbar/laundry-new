"use client"

import { Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SubmitButtonProps = {
  label: string
  loadingLabel?: string
  className?: string
}

export function SubmitButton({ label, loadingLabel = "Memproses...", className }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className={cn("gap-2", className)} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>{loadingLabel}</span>
        </>
      ) : (
        label
      )}
    </Button>
  )
}
