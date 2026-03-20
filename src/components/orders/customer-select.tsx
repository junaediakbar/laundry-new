"use client"

import { useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

type CustomerOption = {
  id: string
  name: string
  phone: string | null
}

type CustomerSelectProps = {
  customers: CustomerOption[]
  defaultCustomerId?: string
}

export function CustomerSelect({ customers, defaultCustomerId = "" }: CustomerSelectProps) {
  const [query, setQuery] = useState("")
  const [customerId, setCustomerId] = useState(defaultCustomerId)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => `${c.name} ${c.phone ?? ""}`.toLowerCase().includes(q))
  }, [customers, query])

  const selected = customers.find((c) => c.id === customerId) ?? null

  return (
    <div className="space-y-2">
      <input type="hidden" name="customerId" value={customerId} />
      <Label>Pelanggan</Label>
      <Input
        placeholder="Cari nama / telepon..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
        <option value="">{selected ? `Terpilih: ${selected.name}` : "Pilih pelanggan"}</option>
        {filtered.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.phone ? ` (${c.phone})` : ""}
          </option>
        ))}
      </Select>
    </div>
  )
}
