import Link from "next/link"
import { notFound } from "next/navigation"

import { deleteUserAction, updateUserAction } from "@/actions/user-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { backendFetch } from "@/lib/backend"

const roleOptions = ["owner", "admin", "cashier"]

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const user = await backendFetch<{
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
  }>(`/api/v1/users/${params.id}`).catch(() => null)

  if (!user) notFound()

  const updateAction = updateUserAction.bind(null, user.id)
  const deleteAction = deleteUserAction.bind(null, user.id)

  return (
    <div>
      <PageHeader title={`Edit ${user.name}`} />
      <Card className="max-w-xl">
        <form action={updateAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required defaultValue={user.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required defaultValue={user.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" required defaultValue={user.role}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password (opsional)</Label>
            <Input id="password" name="password" type="password" />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked={user.isActive} />
            <Label htmlFor="isActive">Aktif</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Simpan Perubahan</Button>
            <Link href="/users">
              <Button type="button" variant="outline">
                Batal
              </Button>
            </Link>
          </div>
        </form>

        <form action={deleteAction} className="mt-4 border-t pt-4">
          <Button type="submit" variant="destructive">
            Hapus User
          </Button>
        </form>
      </Card>
    </div>
  )
}

