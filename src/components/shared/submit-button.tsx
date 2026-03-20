"use client"

import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"

type SubmitButtonProps = {
  label: string
  loadingLabel?: string
  className?: string
}

export function SubmitButton({ label, loadingLabel = "Memproses...", className }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className={className} disabled={pending}>
      {pending ? loadingLabel : label}
    </Button>
  )
}
