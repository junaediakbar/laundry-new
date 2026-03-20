"use client"

import { useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return null
  return `${url}/storage/v1/object/public/order-images/${filePath}`
}

export function OrderAttachments({ orderId, attachments }: OrderAttachmentsProps) {
  const [pending, startTransition] = useTransition()
  const [files, setFiles] = useState<FileList | null>(null)

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
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={pending}
            onChange={(e) => setFiles(e.target.files)}
          />
          <Button
            type="button"
            disabled={pending || !files || files.length === 0}
            onClick={() => {
              const client = createClient()
              startTransition(async () => {
                try {
                  const uploaded: Array<{ filePath: string; mimeType: string | null; sizeBytes: number | null }> = []
                  for (const file of Array.from(files ?? [])) {
                    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg"
                    const safeExt = ext ? ext.replaceAll(/[^a-zA-Z0-9]/g, "") : "jpg"
                    const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`
                    const filePath = `${orderId}/${filename}`

                    const { error } = await client.storage.from("order-images").upload(filePath, file, {
                      cacheControl: "3600",
                      upsert: false,
                      contentType: file.type,
                    })
                    if (error) {
                      throw new Error(error.message)
                    }

                    uploaded.push({
                      filePath,
                      mimeType: file.type || null,
                      sizeBytes: Number.isFinite(file.size) ? file.size : null,
                    })
                  }

                  const response = await fetch(`/api/orders/${orderId}/attachments`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ files: uploaded }),
                  })
                  if (!response.ok) {
                    const text = await response.text()
                    throw new Error(text || "Upload metadata failed")
                  }

                  toast.success("Gambar tersimpan")
                  window.location.reload()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Gagal upload")
                }
              })
            }}
          >
            {pending ? "Mengupload..." : "Upload"}
          </Button>
        </div>

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
