"use client"

import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

type CopyLinkButtonProps = {
  url?: string
  label?: string
}

export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-10 px-0"
      aria-label="Salin link"
      title="Salin link"
      onClick={async () => {
        const shareUrl = url || window.location.href
        try {
          await navigator.clipboard.writeText(shareUrl)
          toast.success("Link disalin")
        } catch {
          toast.error("Gagal menyalin link")
        }
      }}
    >
      <Copy className="w-4 h-4" />
    </Button>
  )
}
