"use client"

import { useMemo, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

import { uploadOrderImagesAction } from "@/actions/order-actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type AttachmentRow = {
  id: string
  filePath: string
  createdAt: string
}

type OrderAttachmentsProps = {
  orderId: string
  /** URL gambar dari kolom `orders.image` / `images` (upload saat buat nota). */
  orderImageUrls?: string[]
  attachments: AttachmentRow[]
  /** Judul section (mis. "Gambar saya" untuk role karyawan). */
  heading?: string
  /** Subjudul/deskripsi singkat di bawah judul. */
  description?: string
  /** Admin/kasir/owner: tampilkan form unggah jika belum ada gambar. */
  canUpload?: boolean
}

function publicFileUrl(filePath: string) {
  if (!filePath) return null
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath
  return null
}

function mergeImageUrls(orderUrls: string[] | undefined, attachmentPaths: AttachmentRow[]) {
  const fromAttachments = attachmentPaths
    .map((a) => publicFileUrl(a.filePath))
    .filter((u): u is string => Boolean(u))
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of [...(orderUrls ?? []), ...fromAttachments]) {
    const key = u.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

export function OrderAttachments({
  orderId,
  orderImageUrls,
  attachments,
  heading = "Gambar nota",
  description = "Foto dari nota (upload awal) dan lampiran dokumentasi.",
  canUpload = false,
}: OrderAttachmentsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const previews = useMemo(
    () => mergeImageUrls(orderImageUrls, attachments),
    [orderImageUrls, attachments],
  )

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{heading}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="border-t p-4">
        {previews.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {previews.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                <div className="overflow-hidden rounded-md border bg-muted/20">
                  <Image
                    src={url}
                    alt="gambar nota"
                    width={600}
                    height={320}
                    unoptimized
                    className="h-40 w-full object-cover"
                  />
                </div>
              </a>
            ))}
          </div>
        ) : canUpload ? (
          <form
            className="mt-2 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              startTransition(async () => {
                const r = await uploadOrderImagesAction(orderId, fd)
                if (r.ok) {
                  toast.success("Gambar berhasil ditambahkan")
                  router.refresh()
                } else {
                  toast.error(r.error)
                }
              })
            }}
          >
            <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 px-5 py-5 sm:px-6 sm:py-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Belum ada gambar. Tambahkan foto nota atau dokumentasi (maks. 3 per unggah).
              </p>
              <Input
                type="file"
                name="images"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                required
                disabled={pending}
                className={cn(
                  "h-auto min-h-[3.25rem] w-full cursor-pointer items-center py-3 pl-4 pr-4 text-sm leading-normal",
                  "file:mr-4 file:inline-flex file:h-10 file:shrink-0 file:items-center file:rounded-md file:border file:border-input file:bg-background file:px-4 file:py-2 file:text-sm file:font-medium file:leading-none",
                )}
              />
              <Button type="submit" className="mt-5" disabled={pending}>
                {pending ? "Mengunggah…" : "Unggah gambar"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Belum ada gambar.</p>
        )}
      </div>
    </Card>
  )
}
