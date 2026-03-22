import Link from "next/link"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { backendFetch } from "@/lib/backend"

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export default async function UsersPage() {
  const users = (await backendFetch<UserRow[]>(`/api/v1/users`).catch(() => [])) ?? []

  return (
    <div>
      <PageHeader title="Users" actionHref="/users/new" actionLabel="Tambah User" />

      <Card className="p-0">
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
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell>{u.isActive ? "Aktif" : "Nonaktif"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Link href={`/users/${u.id}/edit`}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Belum ada user.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="mt-4">
        <Link href="/dashboard">
          <Button variant="secondary">Kembali</Button>
        </Link>
      </div>
    </div>
  )
}

