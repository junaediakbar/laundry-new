"use client"

import { useCallback, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select"
import { Trash2 } from "lucide-react"


type ServiceTypeOption = {
  id: string
  name: string
  unit: string
  defaultPrice: number
}

type OrderItemDraft = {
  serviceTypeId: string
  quantity: number
  unitPrice: number
  discount: number
  length?: number
  width?: number
}

type OrderItemsFormProps = {
  serviceTypes: ServiceTypeOption[]
}

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

export function OrderItemsForm({ serviceTypes }: OrderItemsFormProps) {
  const [items, setItems] = useState<OrderItemDraft[]>([
    { serviceTypeId: "", quantity: 1, unitPrice: 0, discount: 0 },
  ])

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice - item.discount
      return sum + Math.max(lineTotal, 0)
    }, 0)
  }, [items])

  const serialized = useMemo(() => JSON.stringify(items), [items])

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
            setItems((prev) => [...prev, { serviceTypeId: "", quantity: 1, unitPrice: 0, discount: 0 }])
          }}
        >
          Tambah Baris
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const selected = serviceTypes.find((s) => s.id === item.serviceTypeId)
          const lineTotal = Math.max(item.quantity * item.unitPrice - item.discount, 0)
          const rowKey = `${index}-${item.serviceTypeId}`
          const isM2 = selected?.unit === "m2"
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
                      setItems((prev) =>
                        prev.map((p, i) =>
                          i === index
                            ? {
                              ...p,
                              serviceTypeId: nextId,
                              unitPrice: nextService ? nextService.defaultPrice : p.unitPrice,
                            }
                            : p,
                        ),
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

                <div className="md:col-span-2">
                  <Label htmlFor={`discount-${index}`}>Diskon</Label>
                  <Input
                    id={`discount-${index}`}
                    type="number"
                    min="0"
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
                    <Trash2 className="w-10 h-10" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
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
