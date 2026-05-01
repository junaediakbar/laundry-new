"use client"

import { useEffect, useState } from "react"
import { backendFetch } from "@/lib/backend"
import { resolveOrderImageUrls } from "@/lib/order-images"

type OrderImageCellProps = {
  orderId: string
  invoiceNumber: string
}

type OrderDetail = {
  items: Array<{
    image?: string | null
  }>
}

function getBackendBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080"
  return raw.endsWith("/") ? raw.slice(0, -1) : raw
}

export function OrderImageCell({ orderId, invoiceNumber }: OrderImageCellProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageCount, setImageCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchImage() {
      setLoading(true)
      try {
        const data = await backendFetch<OrderDetail>(`/api/v1/orders/${orderId}`)
        if (cancelled) return

        const items = data?.items ?? []
        const imagesWithUrl = items.filter((item) => item.image && item.image.trim() !== "").map((item) => item.image!)

        if (imagesWithUrl.length > 0) {
          // Resolve relative URLs to absolute URLs
          const resolvedUrls = resolveOrderImageUrls(getBackendBaseUrl(), null, imagesWithUrl)
          if (resolvedUrls.length > 0) {
            setImageUrl(resolvedUrls[0])
            setImageCount(resolvedUrls.length)
          }
        }
      } catch {
        // Ignore errors
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchImage()

    return () => {
      cancelled = true
    }
  }, [orderId])

  if (loading) {
    return <span className="text-xs text-muted-foreground">...</span>
  }

  if (imageUrl) {
    return (
      <div className="flex gap-1">
        <a href={`/orders/${orderId}`} className="block">
          <img
            src={imageUrl}
            alt={invoiceNumber}
            className="h-12 w-12 rounded-md object-cover border border-border/50"
          />
        </a>
        {imageCount > 1 && (
          <span className="text-xs text-muted-foreground flex items-center">+{imageCount - 1}</span>
        )}
      </div>
    )
  }

  return <span className="text-xs text-muted-foreground">-</span>
}
