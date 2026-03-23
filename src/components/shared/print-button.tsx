"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-10 px-0"
      aria-label="Print"
      title="Print"
      onClick={() => {
        window.print()
      }}
    >
      <Printer className="h-4 w-4" />
    </Button>
  )
}
