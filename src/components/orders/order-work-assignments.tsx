"use client"

import { useMemo, useTransition } from "react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select } from "@/components/ui/select"

type EmployeeOption = {
  id: string
  name: string
}

type WorkAssignmentRow = {
  id: string
  orderItemId: string
  taskType: string
  employee: EmployeeOption
  percent: { toString(): string }
  amount: { toString(): string }
}

type OrderItemRow = {
  id: string
  total: { toString(): string }
  serviceType: { name: string; unit: string }
  quantity: { toString(): string }
  workAssignments: WorkAssignmentRow[]
}

type OrderWorkAssignmentsProps = {
  orderId: string
  items: OrderItemRow[]
  employees: EmployeeOption[]
  upsertWorkAssignment: (formData: FormData) => Promise<void>
}

const pickupTasks = [
  { key: "pickup", label: "Jemput", percent: 5 },
  { key: "dropoff", label: "Antar", percent: 5 },
  { key: "fuel_vehicle", label: "Bensin & Mobil", percent: 5 },
  { key: "driver", label: "Driver", percent: 5 },
]

const workTasks = [
  { key: "dust_removal", label: "Rontok Debu", percent: 5 },
  { key: "brushing", label: "Sikat", percent: 5 },
  { key: "rinse_sprayer", label: "Bilas Sprayer", percent: 5 },
  { key: "spin_dry", label: "Spinner & Jemur", percent: 5 },
  { key: "finishing_packing", label: "Finishing Packing", percent: 10 },
]

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

export function OrderWorkAssignments({ orderId, items, employees, upsertWorkAssignment }: OrderWorkAssignmentsProps) {
  const [pending, startTransition] = useTransition()

  const totalsByEmployee = useMemo(() => {
    const map = new Map<string, { name: string; amount: number }>()
    for (const item of items) {
      for (const assignment of item.workAssignments) {
        const amount = Number(assignment.amount.toString())
        const current = map.get(assignment.employee.id)
        if (current) {
          current.amount += amount
        } else {
          map.set(assignment.employee.id, { name: assignment.employee.name, amount })
        }
      }
    }
    return Array.from(map.entries())
      .map(([employeeId, value]) => ({ employeeId, ...value }))
      .sort((a, b) => b.amount - a.amount)
  }, [items])

  const selectedByItemAndTask = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of items) {
      for (const assignment of item.workAssignments) {
        map.set(`${item.id}:${assignment.taskType}`, assignment.employee.id)
      }
    }
    return map
  }, [items])

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Performa Karyawan</p>
          <p className="text-xs text-muted-foreground">Catat pengerjaan dan antar-jemput per sub-nota.</p>
        </div>
        <LinkToEmployees />
      </div>

      {totalsByEmployee.length > 0 ? (
        <div className="border-t px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground">Ringkasan Upah (nota ini)</p>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {totalsByEmployee.map((row) => (
              <div key={row.employeeId} className="rounded-md border bg-background p-3">
                <p className="text-sm font-medium">{row.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">Rp {formatIdr(row.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="border-t p-4">
        <div className="space-y-6">
          {items.map((item) => {
            const itemTotal = Number(item.total.toString())
            const qty = Number(item.quantity.toString())

            return (
              <div key={item.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.serviceType.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {qty.toLocaleString("id-ID")} {item.serviceType.unit} • Subtotal Rp {formatIdr(itemTotal)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-6 lg:grid-cols-2">
                  <TaskGroup
                    title="Antar Jemput (20%)"
                    tasks={pickupTasks}
                    itemId={item.id}
                    orderId={orderId}
                    employees={employees}
                    selectedByItemAndTask={selectedByItemAndTask}
                    pending={pending}
                    onSubmit={(formData) => {
                      startTransition(async () => {
                        try {
                          await upsertWorkAssignment(formData)
                          toast.success("Tersimpan")
                        } catch {
                          toast.error("Gagal menyimpan")
                        }
                      })
                    }}
                  />

                  <TaskGroup
                    title="Pengerjaan (30%)"
                    tasks={workTasks}
                    itemId={item.id}
                    orderId={orderId}
                    employees={employees}
                    selectedByItemAndTask={selectedByItemAndTask}
                    pending={pending}
                    onSubmit={(formData) => {
                      startTransition(async () => {
                        try {
                          await upsertWorkAssignment(formData)
                          toast.success("Tersimpan")
                        } catch {
                          toast.error("Gagal menyimpan")
                        }
                      })
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function LinkToEmployees() {
  return (
    <a href="/employees" className="text-xs text-muted-foreground underline underline-offset-4">
      Kelola karyawan
    </a>
  )
}

function TaskGroup({
  title,
  tasks,
  itemId,
  orderId,
  employees,
  selectedByItemAndTask,
  pending,
  onSubmit,
}: {
  title: string
  tasks: Array<{ key: string; label: string; percent: number }>
  itemId: string
  orderId: string
  employees: EmployeeOption[]
  selectedByItemAndTask: Map<string, string>
  pending: boolean
  onSubmit: (formData: FormData) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">{title}</p>
      <div className="space-y-3">
        {tasks.map((task) => {
          const selectedEmployeeId = selectedByItemAndTask.get(`${itemId}:${task.key}`) ?? ""
          return (
            <form
              key={task.key}
              action={(formData) => onSubmit(formData)}
              className="grid gap-2 rounded-md border bg-muted/20 p-3 sm:grid-cols-12 sm:items-center"
            >
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="orderItemId" value={itemId} />
              <input type="hidden" name="taskType" value={task.key} />

              <div className="sm:col-span-5">
                <p className="text-sm font-medium">
                  {task.label} <span className="text-xs text-muted-foreground">({task.percent}%)</span>
                </p>
              </div>
              <div className="sm:col-span-5">
                <Select name="employeeId" defaultValue={selectedEmployeeId} disabled={pending}>
                  <option value="">-</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" size="sm" className="w-full" disabled={pending}>
                  Simpan
                </Button>
              </div>
            </form>
          )
        })}
      </div>
    </div>
  )
}
