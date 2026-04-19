import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { ToastQuery } from "@/components/shared/toast-query"
import { ServiceTypeDeleteButton } from "@/components/service-types/service-type-delete-button"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"
import { backendFetch } from "@/lib/backend"

type ServiceTypesPageProps = {
  searchParams?: {
    q?: string
    page?: string
  }
}

export default async function ServiceTypesPage({ searchParams }: ServiceTypesPageProps) {
  const q = searchParams?.q?.trim()
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1)
  const pageSize = 20

  const all = await backendFetch<
    Array<{
      id: string
      name: string
      unit: string
      defaultPrice: string
      isActive: boolean
    }>
  >(`/api/v1/service-types`).catch(() => [])

  const filtered = q
    ? all.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
    : all

  const totalItems = filtered.length
  const serviceTypes = filtered.slice((page - 1) * pageSize, page * pageSize)

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    params.set("page", String(nextPage))
    const query = params.toString()
    return query ? `/service-types?${query}` : "/service-types"
  }

  return (
    <div>
      <ToastQuery successParam="saved" successMessage="Data berhasil disimpan" />
      <PageHeader title="Jenis Pesanan" actionHref="/service-types/new" actionLabel="Tambah Jenis" />
      <form className="mb-4 flex max-w-md gap-2">
        <Input name="q" defaultValue={q} placeholder="Cari jenis pesanan..." />
        <Button type="submit" variant="secondary">
          Cari
        </Button>
      </form>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[1%] whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypes.map((serviceType) => (
                <TableRow key={serviceType.id}>
                  <TableCell className="font-medium">{serviceType.name}</TableCell>
                  <TableCell>{serviceType.unit}</TableCell>
                  <TableCell>{formatCurrency(Number(serviceType.defaultPrice))}</TableCell>
                  <TableCell>{serviceType.isActive ? "Aktif" : "Nonaktif"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link href={`/service-types/${serviceType.id}/edit`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                      <ServiceTypeDeleteButton serviceTypeId={serviceType.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {serviceTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Belum ada jenis pesanan.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} pageSize={pageSize} totalItems={totalItems} buildHref={buildHref} />
      </Card>
    </div>
  )
}
