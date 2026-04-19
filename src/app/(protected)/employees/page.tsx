import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { ToastQuery } from "@/components/shared/toast-query"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { backendFetch } from "@/lib/backend"
import { inOwnerGroup } from "@/lib/owner-group"

type EmployeeRow = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

/** Satu baris tabel setelah penggabungan nama "Owner". */
type EmployeeListItem =
  | { kind: "single"; row: EmployeeRow }
  | { kind: "owner-merged"; rows: EmployeeRow[] }

function roleLabel(role: string) {
  switch (role) {
    case "employee":
      return "Karyawan"
    case "admin":
      return "Admin"
    case "owner":
      return "Owner"
    case "cashier":
      return "Kasir"
    default:
      return role
  }
}

/** Satu baris Owner: semua akun role `owner` atau nama "Owner". */
function buildEmployeeListItems(rows: EmployeeRow[]): EmployeeListItem[] {
  const owners: EmployeeRow[] = []
  const others: EmployeeRow[] = []
  for (const r of rows) {
    if (inOwnerGroup(r)) owners.push(r)
    else others.push(r)
  }

  others.sort((a, b) => a.name.localeCompare(b.name, "id"))

  const out: EmployeeListItem[] = []
  if (owners.length > 0) {
    out.push({ kind: "owner-merged", rows: owners })
  }
  for (const r of others) {
    out.push({ kind: "single", row: r })
  }
  return out
}

function statusLabelForGroup(rows: EmployeeRow[]) {
  const active = rows.filter((r) => r.isActive).length
  const total = rows.length
  if (active === total) return "Aktif"
  if (active === 0) return "Nonaktif"
  return `${active}/${total} aktif`
}

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

  const raw = await backendFetch<EmployeeRow[]>(`/api/v1/employees`).catch(() => [])
  const all = Array.isArray(raw) ? raw : []

  const filtered = q
    ? all.filter((row) => {
        const hay = `${row.name} ${row.email}`.toLowerCase()
        return hay.includes(q.toLowerCase())
      })
    : all

  const listItems = buildEmployeeListItems(filtered)
  const total = listItems.length
  const slice = listItems.slice((page - 1) * pageSize, page * pageSize)

  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    params.set("page", String(nextPage))
    const query = params.toString()
    return query ? `/employees?${query}` : "/employees"
  }

  return (
    <div>
      <ToastQuery successParam="saved" successMessage="Data berhasil disimpan" />
      <PageHeader
        title="Tim & akun"
        description="Satu data per orang: profil operasional dan kredensial login pada baris yang sama. Semua akun Owner (nama atau role) ditampilkan dalam satu baris."
        actionHref="/employees/new"
        actionLabel="Tambah anggota"
      />
      <form className="mb-4 flex max-w-md gap-2">
        <Input name="q" defaultValue={q} placeholder="Cari nama atau email..." />
        <Button type="submit" variant="secondary">
          Cari
        </Button>
      </form>
      <div className="mb-4">
        <Link href="/employees/performance">
          <Button variant="outline">Lihat performa</Button>
        </Link>
      </div>

      <Card className="p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">Anggota tim</p>
          <p className="text-xs text-muted-foreground">
            Setiap baris memiliki nama, email login, role, dan status aktif/nonaktif.
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[1%] whitespace-nowrap">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((item) =>
                item.kind === "single" ? (
                  <TableRow key={item.row.id}>
                    <TableCell className="font-medium">{item.row.name}</TableCell>
                    <TableCell>{item.row.email}</TableCell>
                    <TableCell>{roleLabel(item.row.role)}</TableCell>
                    <TableCell>{item.row.isActive ? "Aktif" : "Nonaktif"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Link href={`/employees/${item.row.id}/edit`}>
                        <Button size="sm" variant="outline">
                          Kelola
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={item.rows.map((r) => r.id).join("-")}>
                    <TableCell className="font-medium">Owner</TableCell>
                    <TableCell>
                      <ul className="list-none space-y-1">
                        {item.rows.map((r) => (
                          <li key={r.id} className="break-all text-sm">
                            {r.email}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>{roleLabel("owner")}</TableCell>
                    <TableCell>{statusLabelForGroup(item.rows)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {item.rows.length > 1 ? (
                        `${item.rows.length} akun digabung`
                      ) : (
                        <Link href={`/employees/${item.rows[0].id}/edit`}>
                          <Button size="sm" variant="outline">
                            Kelola
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ),
              )}
              {slice.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Belum ada data.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>

      {total > 0 ? (
        <div className="mt-4">
          <Pagination page={page} pageSize={pageSize} totalItems={total} buildHref={buildHref} />
        </div>
      ) : null}
    </div>
  )
}
