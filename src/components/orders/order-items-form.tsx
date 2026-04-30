"use client"

import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import { isM2AreaUnit } from "@/lib/order-item-display"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select"
import { Select } from "@/components/ui/select"
import { Trash2, X } from "lucide-react"

type ServiceTypeOption = {
  id: string
  name: string
  unit: string
  defaultPrice: number
}

type DiscountMode = "fixed" | "percent"

type OrderItemDraft = {
  serviceTypeId: string
  quantity: number
  unitPrice: number
  discount: number
  discountMode: DiscountMode
  length?: number
  width?: number
  imageFile: File | null
}

function lineSubtotal(item: Pick<OrderItemDraft, "quantity" | "unitPrice">) {
  return Math.max(item.quantity * item.unitPrice, 0)
}

function discountAsRupiah(item: OrderItemDraft) {
  const subtotal = lineSubtotal(item)
  if (subtotal <= 0) return 0
  if (item.discountMode === "percent") {
    const pct = Math.max(0, item.discount)
    return Math.min(subtotal * (pct / 100), subtotal)
  }
  return Math.min(Math.max(0, item.discount), subtotal)
}

function toApiPayloadItem(item: OrderItemDraft, serviceTypes: ServiceTypeOption[]) {
  const discount = Math.round(discountAsRupiah(item) * 100) / 100
  const st = serviceTypes.find((s) => s.id === item.serviceTypeId)
  const len = item.length ?? 0
  const wid = item.width ?? 0
  const base = {
    serviceTypeId: item.serviceTypeId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount,
  }
  if (st && isM2AreaUnit(st.unit) && len > 0 && wid > 0) {
    return { ...base, lengthM: len, widthM: wid }
  }
  return base
}

type OrderItemsFormProps = {
  serviceTypes: ServiceTypeOption[]
}

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

export function OrderItemsForm({ serviceTypes }: OrderItemsFormProps) {
  const [items, setItems] = useState<OrderItemDraft[]>([
    { serviceTypeId: "", quantity: 1, unitPrice: 0, discount: 0, discountMode: "fixed", imageFile: null },
  ])

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const d = discountAsRupiah(item)
      const lineTotal = lineSubtotal(item) - d
      return sum + Math.max(lineTotal, 0)
    }, 0)
  }, [items])

  const serialized = useMemo(
    () => JSON.stringify(items.map((it) => toApiPayloadItem(it, serviceTypes))),
    [items, serviceTypes],
  )

  const serviceTypeFetcher = useCallback(
    async (query: string): Promise<SearchableOption[]> => {
      const q = query.trim().toLowerCase()
      const filtered = q ? serviceTypes.filter((s) => s.name.toLowerCase().includes(q)) : serviceTypes
      return filtered.map((s) => ({
        value: s.id,
        label: s.name,
        sublabel: `Rp ${formatIdr(s.defaultPrice)}/${s.unit}`,
      }))
    },
    [serviceTypes],
  )

  return (
    <div className="space-y-4">
      <input type="hidden" name="items" value={serialized} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Item Pesanan</p>
          <p className="text-xs text-muted-foreground">Tambah beberapa layanan dalam satu nota.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setItems((prev) => [
              ...prev,
              { serviceTypeId: "", quantity: 1, unitPrice: 0, discount: 0, discountMode: "fixed", imageFile: null },
            ])
          }}
        >
          Tambah Baris
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const selected = serviceTypes.find((s) => s.id === item.serviceTypeId)
          const lineTotal = Math.max(lineSubtotal(item) - discountAsRupiah(item), 0)
          const rowKey = `${index}-${item.serviceTypeId}`
          const isM2 = isM2AreaUnit(selected?.unit)
          const isM1 = selected?.unit === "m1"

          return (
            <div key={rowKey} className="rounded-lg border bg-background p-3">
              <div className="grid gap-3 md:grid-cols-12">
                <div className="md:col-span-5">
                  <SearchableSelect
                    key={`serviceType-${rowKey}`}
                    name={`serviceTypeId-${index}`}
                    label="Layanan"
                    placeholder="Pilih layanan..."
                    searchPlaceholder="Cari layanan..."
                    defaultValue={item.serviceTypeId}
                    defaultLabel={selected?.name ?? ""}
                    fetcher={serviceTypeFetcher}
                    debounceMs={200}
                    required
                    onChange={(opt) => {
                      const nextId = opt?.value ?? ""
                      const nextService = serviceTypes.find((s) => s.id === nextId)
                      const nextM2 = nextService ? isM2AreaUnit(nextService.unit) : false
                      setItems((prev) =>
                        prev.map((p, i) => {
                          if (i !== index) return p
                          if (nextM2) {
                            const len = p.length ?? 0
                            const wid = p.width ?? 0
                            return {
                              ...p,
                              serviceTypeId: nextId,
                              unitPrice: nextService ? nextService.defaultPrice : p.unitPrice,
                              length: len,
                              width: wid,
                              quantity: Math.max(len * wid, 0),
                            }
                          }
                          return {
                            ...p,
                            serviceTypeId: nextId,
                            unitPrice: nextService ? nextService.defaultPrice : p.unitPrice,
                            length: undefined,
                            width: undefined,
                          }
                        }),
                      )
                    }}
                  />
                </div>

                {isM2 ? (
                  <>
                    <div className="md:col-span-2">
                      <Label htmlFor={`length-${index}`}>Panjang (m)</Label>
                      <Input
                        id={`length-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.length ?? 0}
                        onFocus={(e) => {
                          if (e.currentTarget.value === "0") {
                            e.currentTarget.select()
                          }
                        }}
                        onChange={(e) => {
                          const nextLength = Number(e.target.value || 0)
                          setItems((prev) =>
                            prev.map((p, i) => {
                              if (i !== index) return p
                              const width = p.width ?? 0
                              const qty = Math.max(nextLength * width, 0)
                              return { ...p, length: nextLength, quantity: qty }
                            }),
                          )
                        }}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`width-${index}`}>Lebar (m)</Label>
                      <Input
                        id={`width-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.width ?? 0}
                        onFocus={(e) => {
                          if (e.currentTarget.value === "0") {
                            e.currentTarget.select()
                          }
                        }}
                        onChange={(e) => {
                          const nextWidth = Number(e.target.value || 0)
                          setItems((prev) =>
                            prev.map((p, i) => {
                              if (i !== index) return p
                              const length = p.length ?? 0
                              const qty = Math.max(length * nextWidth, 0)
                              return { ...p, width: nextWidth, quantity: qty }
                            }),
                          )
                        }}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Qty dihitung otomatis (m2)</p>
                    </div>
                  </>
                ) : isM1 ? (
                  <>
                    <div className="md:col-span-2">
                      <Label htmlFor={`length-${index}`}>Panjang (m)</Label>
                      <Input
                        id={`length-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.length ?? 0}
                        onFocus={(e) => {
                          if (e.currentTarget.value === "0") {
                            e.currentTarget.select()
                          }
                        }}
                        onChange={(e) => {
                          const nextLength = Number(e.target.value || 0)
                          setItems((prev) =>
                            prev.map((p, i) =>
                              i === index ? { ...p, length: nextLength, quantity: Math.max(nextLength, 0) } : p,
                            ),
                          )
                        }}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Qty dihitung otomatis (m1)</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`quantity-${index}`}>Qty</Label>
                      <Input id={`quantity-${index}`} type="number" value={item.quantity} disabled />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <Label htmlFor={`quantity-${index}`}>Qty</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = Number(e.target.value || 0)
                        setItems((prev) => prev.map((p, i) => (i === index ? { ...p, quantity: value } : p)))
                      }}
                    />
                    {selected ? <p className="mt-1 text-xs text-muted-foreground">Unit: {selected.unit}</p> : null}
                  </div>
                )}

                <div className="md:col-span-2">
                  <Label htmlFor={`unitPrice-${index}`}>Harga</Label>
                  <Input
                    id={`unitPrice-${index}`}
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onFocus={(e) => {
                      if (e.currentTarget.value === "0") {
                        e.currentTarget.select()
                      }
                    }}
                    onChange={(e) => {
                      const value = Number(e.target.value || 0)
                      setItems((prev) => prev.map((p, i) => (i === index ? { ...p, unitPrice: value } : p)))
                    }}
                  />
                </div>

                <div className="md:col-span-6">
                  <Label htmlFor={`discount-${index}`}>Diskon</Label>
                  <div className="flex gap-2">
                    <Select
                      className="w-[4.75rem] shrink-0"
                      aria-label="Satuan diskon"
                      value={item.discountMode}
                      onChange={(e) => {
                        const mode = e.target.value as DiscountMode
                        setItems((prev) =>
                          prev.map((p, i) =>
                            i === index ? { ...p, discountMode: mode, discount: 0 } : p,
                          ),
                        )
                      }}
                    >
                      <option value="fixed">Rp</option>
                      <option value="percent">%</option>
                    </Select>
                    <Input
                      id={`discount-${index}`}
                      className="min-w-0 flex-1 w-32"
                      type="number"
                      min="0"
                      max={item.discountMode === "percent" ? "100" : undefined}
                      step={item.discountMode === "percent" ? "0.01" : "1"}
                      value={item.discount}
                      onFocus={(e) => {
                        if (e.currentTarget.value === "0") {
                          e.currentTarget.select()
                        }
                      }}
                      onChange={(e) => {
                        const value = Number(e.target.value || 0)
                        setItems((prev) => prev.map((p, i) => (i === index ? { ...p, discount: value } : p)))
                      }}
                    />
                  </div>
                  {item.discountMode === "percent" ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Persen dari subtotal baris (qty × harga). Setara ~Rp{" "}
                      {formatIdr(Math.round(discountAsRupiah(item)))}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-1">
                  <Label>&nbsp;</Label>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    disabled={items.length === 1}
                    onClick={() => {
                      setItems((prev) => prev.filter((_, i) => i !== index))
                    }}
                  >
                    <Trash2 className="w-5 md:w-10 h-5 md:h-10" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 space-y-2 mb-2">
                <Label htmlFor={`item-image-${index}`}>Gambar Item   (opsional)</Label>
                <Input
                  id={`item-image-${index}`}
                  name={`item-images-${index}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setItems((prev) =>
                        prev.map((p, i) =>
                          i === index ? { ...p, imageFile: file } : p,
                        ),
                      )
                    }
                  }}
                />
                {item.imageFile && (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border">
                      <Image
                        src={URL.createObjectURL(item.imageFile)}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.imageFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(item.imageFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      className="h-8 w-8 shrink-0 p-0"
                      onClick={() => {
                        setItems((prev) =>
                          prev.map((p, i) =>
                            i === index ? { ...p, imageFile: null } : p,
                          ),
                        )
                        // Reset file input
                        const input = document.getElementById(`item-image-${index}`) as HTMLInputElement
                        if (input) input.value = ''
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">Subtotal baris</p>
                <p className="text-sm font-semibold">Rp {formatIdr(lineTotal)}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
        <p className="text-sm font-semibold">Total Nota</p>
        <p className="text-sm font-semibold">Rp {formatIdr(total)}</p>
      </div>
    </div>
  )
}
