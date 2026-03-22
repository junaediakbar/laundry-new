"use client"

import { useMemo } from "react"
import Image from "next/image"

import { Card } from "@/components/ui/card"

type AttachmentRow = {
  id: string
  filePath: string
  createdAt: string
}

type OrderAttachmentsProps = {
  orderId: string
  attachments: AttachmentRow[]
}

function publicFileUrl(filePath: string) {
  if (!filePath) return null
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath
  return null
}

export function OrderAttachments({ orderId, attachments }: OrderAttachmentsProps) {
  void orderId

  const previews = useMemo(() => {
    return attachments
      .map((a) => ({ ...a, url: publicFileUrl(a.filePath) }))
      .filter((a) => a.url)
  }, [attachments])

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Gambar Nota</p>
          <p className="text-xs text-muted-foreground">Upload foto untuk kebutuhan dokumentasi.</p>
        </div>
      </div>

      <div className="border-t p-4">
        {previews.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {previews.map((a) => (
              <a key={a.id} href={a.url as string} target="_blank" rel="noreferrer" className="block">
                <div className="overflow-hidden rounded-md border bg-muted/20">
                  <Image
                    src={a.url as string}
                    alt="order attachment"
                    width={600}
                    height={320}
                    className="h-40 w-full object-cover"
                  />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Belum ada gambar.</p>
        )}
      </div>
    </Card>
  )
}
