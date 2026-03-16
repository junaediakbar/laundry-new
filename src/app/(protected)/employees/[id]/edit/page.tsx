import Link from "next/link"
import { notFound } from "next/navigation"

import { updateEmployeeAction } from "@/actions/employee-actions"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { prisma } from "@/lib/prisma"

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
  const prismaEmployee = prisma as unknown as {
    employee: {
      findUnique(args: unknown): Promise<{ id: string; name: string; isActive: boolean } | null>
    }
  }

  const employee = await prismaEmployee.employee.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, isActive: true },
  })

  if (!employee) {
    notFound()
  }

  const updateAction = updateEmployeeAction.bind(null, employee.id)

  return (
    <div>
      <PageHeader title={`Edit ${employee.name}`} />
      <Card className="max-w-xl">
        <form action={updateAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required defaultValue={employee.name} />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" name="isActive" type="checkbox" defaultChecked={employee.isActive} />
            <Label htmlFor="isActive">Aktif</Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Simpan Perubahan</Button>
            <Link href="/employees">
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
