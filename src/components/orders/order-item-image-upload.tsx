"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

import { uploadOrderItemImageAction } from "@/actions/order-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload } from "lucide-react"

type OrderItemImageUploadProps = {
  orderItemId: string
  imageUrl: string | null | undefined
}

export function OrderItemImageUpload({ orderItemId, imageUrl }: OrderItemImageUploadProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const inputId = `item-image-${orderItemId}`

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Upload to backend
    const formData = new FormData()
    formData.append("image", file)

    startTransition(async () => {
      const result = await uploadOrderItemImageAction(orderItemId, formData)
      if (result.ok) {
        toast.success(imageUrl ? "Gambar berhasil diperbarui" : "Gambar berhasil ditambahkan")
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={pending}
      />
      <label htmlFor={inputId} className="cursor-pointer">
        <Button
          type="button"
          className="h-8 w-8 p-0"
          disabled={pending}
          onClick={(e) => {
            e.preventDefault()
            document.getElementById(inputId)?.click()
          }}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </label>
    </div>
  )
}
