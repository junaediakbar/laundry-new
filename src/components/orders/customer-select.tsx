"use client"

import { searchCustomersAction } from "@/actions/customer-search-actions"

import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CustomerSelectProps = {
  /** Untuk pre-fill saat mode edit (isi dari data order yang sudah ada) */
  defaultCustomerId?: string
  defaultCustomerName?: string
  /** Override URL halaman tambah pelanggan baru */
  addNewHref?: string
  /** Callback opsional saat pilihan berubah */
  onChange?: (option: SearchableOption | null) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerSelect({
  defaultCustomerId = "",
  defaultCustomerName = "",
  addNewHref = "/customers/new",
  onChange,
}: CustomerSelectProps) {
  return (
    <SearchableSelect
      name="customerId"
      label="Pelanggan"
      placeholder="Pilih pelanggan..."
      searchPlaceholder="Cari nama / telepon..."
      defaultValue={defaultCustomerId}
      defaultLabel={defaultCustomerName}
      // Server Action langsung dijadikan fetcher —
      // Next.js menangani serialisasi & keamanan secara otomatis.
      fetcher={searchCustomersAction}
      debounceMs={300}
      addNewHref={addNewHref}
      addNewLabel="Tambah Pelanggan Baru"
      required
      onChange={onChange}
    />
  )
}
