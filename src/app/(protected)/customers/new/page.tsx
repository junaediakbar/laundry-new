import Link from "next/link"

import { createCustomerAction } from "@/actions/customer-actions"
import { PageHeader } from "@/components/shared/page-header"
import { SubmitButton } from "@/components/shared/submit-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function NewCustomerPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const error = searchParams?.error
  return (
    <div>
      <PageHeader title="Tambah Pelanggan" />
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      <Card className="max-w-xl">
        <form action={createCustomerAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" name="address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapsLink">Google Maps Link (opsional)</Label>
            <Input
              id="mapsLink"
              name="mapsLink"
              placeholder="https://www.google.com/maps/place/… (salin dari tombol Bagikan)"
            />
            <p className="text-xs text-muted-foreground">
              Untuk pin yang tepat, tempel URL lengkap halaman tempat. Koordinat diambil dari titik lokasi usaha,
              bukan dari posisi kamera peta.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          <div className="flex gap-2">
            <SubmitButton label="Simpan" loadingLabel="Menyimpan..." />
            <Link href="/customers">
              <Button type="button" variant="outline">
                Batal
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
