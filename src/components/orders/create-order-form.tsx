"use client"

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"

import { createOrderAction } from "@/actions/order-actions"
import type { DeliveryServiceCategory } from "@/lib/delivery-service"

type RegisterItemImages = (files: (File | null)[]) => void

const ItemImagesContext = createContext<RegisterItemImages | null>(null)

type CreateOrderPricingContextValue = {
  deliveryCategory: DeliveryServiceCategory
  setDeliveryCategory: (category: DeliveryServiceCategory) => void
  itemsSubtotal: number
  setItemsSubtotal: (subtotal: number) => void
}

const CreateOrderPricingContext =
  createContext<CreateOrderPricingContextValue | null>(null)

export function useRegisterOrderItemImages() {
  return useContext(ItemImagesContext)
}

export function useCreateOrderPricing() {
  return useContext(CreateOrderPricingContext)
}

type CreateOrderFormProps = {
  children: ReactNode
}

/**
 * Saat submit, lampirkan gambar item dari state React (bukan input file native)
 * agar indeks tidak bergeser setelah hapus/tambah baris di form.
 */
export function CreateOrderForm({ children }: CreateOrderFormProps) {
  const itemImageFilesRef = useRef<(File | null)[]>([])
  const [deliveryCategory, setDeliveryCategory] =
    useState<DeliveryServiceCategory>("reguler")
  const [itemsSubtotal, setItemsSubtotal] = useState(0)

  const registerItemImageFiles = useCallback<RegisterItemImages>((files) => {
    itemImageFilesRef.current = files
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    for (const key of [...fd.keys()]) {
      if (key.startsWith("item-images-")) {
        fd.delete(key)
      }
    }

    itemImageFilesRef.current.forEach((file, index) => {
      if (file && file.size > 0) {
        fd.append(`item-images-${index}`, file)
      }
    })

    await createOrderAction(fd)
  }

  return (
    <CreateOrderPricingContext.Provider
      value={{
        deliveryCategory,
        setDeliveryCategory,
        itemsSubtotal,
        setItemsSubtotal,
      }}
    >
      <ItemImagesContext.Provider value={registerItemImageFiles}>
        <form encType="multipart/form-data" className="space-y-4" onSubmit={handleSubmit}>
          {children}
        </form>
      </ItemImagesContext.Provider>
    </CreateOrderPricingContext.Provider>
  )
}
