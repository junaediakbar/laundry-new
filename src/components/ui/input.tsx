"use client"

import {
  forwardRef,
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type MutableRefObject,
  type Ref,
} from "react"

import { cn } from "@/lib/utils"

type InputProps = InputHTMLAttributes<HTMLInputElement>

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value)
  else if (ref != null) (ref as MutableRefObject<T | null>).current = value
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type, ...props },
  ref,
) {
  const localRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (type !== "number") return
    const el = localRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [type])

  return (
    <input
      ref={(node) => {
        localRef.current = node
        assignRef(ref, node)
      }}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  )
})
