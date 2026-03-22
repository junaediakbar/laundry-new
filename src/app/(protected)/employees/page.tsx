import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { backendFetch } from "@/lib/backend"

type EmployeesPageProps = {
  searchParams?: {
    q?: string
    page?: string
  }
}

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
  const q = searchParams?.q?.trim()
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1)
  const pageSize = 20

  const all = await backendFetch<Array<{ id: string; name: string; isActive: boolean }>>(
    `/api/v1/employees`,
  ).catch(() => [])
  const filtered = q
    ? all.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))
    : all
  const totalEmployees = filtered.length
  const employees = filtered.slice((page - 1) * pageSize, page * pageSize)

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    params.set("page", String(nextPage))
    const query = params.toString()
    return query ? `/employees?${query}` : "/employees"
  }

  return (
    <div>
      <PageHeader title="Karyawan" actionHref="/employees/new" actionLabel="Tambah Karyawan" />
      <form className="mb-4 flex max-w-md gap-2">
        <Input name="q" defaultValue={q} placeholder="Cari nama karyawan..." />
        <Button type="submit" variant="secondary">
          Cari
        </Button>
      </form>
      <div className="mb-4">
        <Link href="/employees/performance">
          <Button variant="outline">Lihat Performa</Button>
        </Link>
      </div>
      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[1%] whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.isActive ? "Aktif" : "Nonaktif"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/employees/${employee.id}/edit`}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                    Belum ada data karyawan.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        <Pagination page={page} pageSize={pageSize} totalItems={totalEmployees} buildHref={buildHref} />
      </Card>
    </div>
  )
}
