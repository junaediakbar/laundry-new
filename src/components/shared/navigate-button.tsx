"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type NavigateButtonProps = {
  href: string
  label: string
  loadingLabel?: string
  prefetchOnIntent?: boolean
  variant?: "default" | "secondary" | "outline" | "destructive"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function NavigateButton({
  href,
  label,
  loadingLabel = "Memuat...",
  prefetchOnIntent = true,
  variant = "outline",
  size = "sm",
  className,
}: NavigateButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const prefetchedRef = useRef(false)

  const prefetchOnce = () => {
    if (!prefetchOnIntent) return
    if (prefetchedRef.current) return
    prefetchedRef.current = true
    router.prefetch(href)
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onMouseEnter={prefetchOnce}
      onFocus={prefetchOnce}
      onTouchStart={prefetchOnce}
      onClick={() => {
        startTransition(() => {
          router.push(href)
        })
      }}
    >
      {pending ? loadingLabel : label}
    </Button>
  )
}
