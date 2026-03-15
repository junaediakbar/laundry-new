import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { prisma } from "@/lib/prisma"

type CustomersPageProps = {
  searchParams?: {
    q?: string
    page?: string
  }
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const q = searchParams?.q?.trim()
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1)
  const pageSize = 20

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : undefined

  const [customers, totalCustomers] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ])

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    params.set("page", String(nextPage))
    const query = params.toString()
    return query ? `/customers?${query}` : "/customers"
  }

  return (
    <div>
      <PageHeader title="Pelanggan" actionHref="/customers/new" actionLabel="Tambah Pelanggan" />
      <form className="mb-4 flex max-w-md gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Cari nama / nomor telepon..."
        />
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
                <TableHead>Telepon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[1%] whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone ?? "-"}</TableCell>
                  <TableCell>{customer.email ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/customers/${customer.id}`}>
                      <Button size="sm" variant="outline">
                        Detail
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Belum ada data pelanggan.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} pageSize={pageSize} totalItems={totalCustomers} buildHref={buildHref} />
      </Card>
    </div>
  )
}
