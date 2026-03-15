"use client"

import { useMemo, useState } from "react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"

type ExportCsvButtonProps = {
  href: string
  filename: string
}

export function ExportCsvButton({ href, filename }: ExportCsvButtonProps) {
  const [loading, setLoading] = useState(false)

  const safeFilename = useMemo(() => {
    const trimmed = filename.trim()
    if (!trimmed) return "report.csv"
    return trimmed.toLowerCase().endsWith(".csv") ? trimmed : `${trimmed}.csv`
  }, [filename])

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        try {
          const response = await fetch(href)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const blob = await response.blob()
          const url = URL.createObjectURL(blob)

          const a = document.createElement("a")
          a.href = url
          a.download = safeFilename
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)

          toast.success("Export berhasil")
        } catch {
          toast.error("Export gagal")
        } finally {
          setLoading(false)
        }
      }}
    >
      {loading ? "Menyiapkan..." : "Export CSV"}
    </Button>
  )
}
