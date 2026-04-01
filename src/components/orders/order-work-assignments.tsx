"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Plus, RotateCcw, Save, Settings2, Trash2, X } from "lucide-react"

type EmployeeOption = {
  id: string
  name: string
}

type Decimalish = string | number | { toString(): string }

type WorkAssignmentRow = {
  id: string
  orderItemId: string
  taskType: string
  employee: EmployeeOption
  percent: Decimalish
  amount: Decimalish
}

type OrderItemRow = {
  id: string
  total: Decimalish
  serviceType: { name: string; unit: string }
  quantity: Decimalish
  workAssignments: WorkAssignmentRow[]
}

type OrderWorkAssignmentsProps = {
  orderId: string
  items: OrderItemRow[]
  employees: EmployeeOption[]
  upsertWorkAssignment: (formData: FormData) => Promise<void>
}

type TaskDef = { key: string; label: string; percent: number }
type TaskGroupDef = { id: string; title: string; tasks: TaskDef[] }
type WorkTemplate = { groups: TaskGroupDef[] }

const STORAGE_KEY = "work_task_templates_v1"

function normalizeServiceName(value: string) {
  return value.trim().toLowerCase()
}

function slugifyKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function formatPercentId(pct: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(pct)
}

function sumPercent(tasks: TaskDef[]) {
  return tasks.reduce((sum, t) => sum + (Number.isFinite(t.percent) ? t.percent : 0), 0)
}

function defaultTemplateBase(): WorkTemplate {
  return {
    groups: [
      {
        id: "pickup",
        title: "Jemput",
        tasks: [
          { key: "pickup_driver", label: "Driver", percent: 2 },
          { key: "pickup_worker_1", label: "Buruh 1", percent: 1.5 },
          { key: "pickup_worker_2", label: "Buruh 2", percent: 1.5 },
          { key: "pickup_fuel", label: "Bensin", percent: 2.5 },
        ],
      },
      {
        id: "dropoff",
        title: "Antar",
        tasks: [
          { key: "dropoff_driver", label: "Driver", percent: 2 },
          { key: "dropoff_worker_1", label: "Buruh 1", percent: 1.5 },
          { key: "dropoff_worker_2", label: "Buruh 2", percent: 1.5 },
          { key: "dropoff_fuel", label: "Bensin", percent: 2.5 },
        ],
      },
      {
        id: "work",
        title: "Produksi",
        tasks: [
          { key: "dust_removal", label: "Rontok", percent: 4 },
          { key: "brushing", label: "Sikat", percent: 4 },
          { key: "rinse_sprayer", label: "Bilas", percent: 4 },
          { key: "spin_dry_1", label: "Spin & Jemur 1", percent: 2.5 },
          { key: "spin_dry_2", label: "Spin & Jemur 2", percent: 2.5 },
          { key: "finishing_1", label: "Finishing 1", percent: 4 },
          { key: "finishing_2", label: "Finishing 2", percent: 4 },
        ],
      },
    ],
  }
}

function defaultTemplateCuciKarpet(): WorkTemplate {
  return {
    groups: [
      {
        id: "pickup",
        title: "Jemput",
        tasks: [
          { key: "pickup_driver", label: "Driver", percent: 2 },
          { key: "pickup_worker_1", label: "Buruh 1", percent: 1.5 },
          { key: "pickup_worker_2", label: "Buruh 2", percent: 1.5 },
          { key: "pickup_fuel", label: "Bensin", percent: 2.5 },
        ],
      },
      {
        id: "dropoff",
        title: "Antar",
        tasks: [
          { key: "dropoff_driver", label: "Driver", percent: 2 },
          { key: "dropoff_worker_1", label: "Buruh 1", percent: 1.5 },
          { key: "dropoff_worker_2", label: "Buruh 2", percent: 1.5 },
          { key: "dropoff_fuel", label: "Bensin", percent: 2.5 },
        ],
      },
      {
        id: "work",
        title: "Produksi",
        tasks: [
          { key: "dust_removal", label: "Rontok", percent: 4 },
          { key: "brushing", label: "Sikat", percent: 4 },
          { key: "rinse_sprayer", label: "Bilas", percent: 4 },
          { key: "spin_dry_1", label: "Spin & Jemur 1", percent: 2.5 },
          { key: "spin_dry_2", label: "Spin & Jemur 2", percent: 2.5 },
          { key: "finishing_1", label: "Finishing 1", percent: 4 },
          { key: "finishing_2", label: "Finishing 2", percent: 4 },
        ],
      },
    ],
  }
}

function defaultTemplateForService(serviceName: string): WorkTemplate {
  const key = normalizeServiceName(serviceName)
  if (key === "cuci karpet") return defaultTemplateCuciKarpet()
  return defaultTemplateBase()
}

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

export function OrderWorkAssignments({ orderId, items, employees, upsertWorkAssignment }: OrderWorkAssignmentsProps) {
  const [pending, startTransition] = useTransition()
  const [templatesByService, setTemplatesByService] = useState<Record<string, WorkTemplate>>({})
  const [editingService, setEditingService] = useState<string | null>(null)
  const [draftByService, setDraftByService] = useState<Record<string, WorkTemplate>>({})

  useEffect(() => {
    const loaded = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw) as unknown
        if (!parsed || typeof parsed !== "object") return {}
        return parsed as Record<string, WorkTemplate>
      } catch {
        return {}
      }
    })()
    setTemplatesByService(loaded)
  }, [])

  function getTemplate(serviceName: string): WorkTemplate {
    const key = normalizeServiceName(serviceName)
    return templatesByService[key] ?? defaultTemplateForService(serviceName)
  }

  function persistTemplates(next: Record<string, WorkTemplate>) {
    setTemplatesByService(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch { }
  }

  function openEditTemplate(serviceName: string) {
    const key = normalizeServiceName(serviceName)
    setEditingService(key)
    const current = getTemplate(serviceName)
    setDraftByService((prev) => ({
      ...prev,
      [key]: JSON.parse(JSON.stringify(current)) as WorkTemplate,
    }))
  }

  function closeEditTemplate() {
    setEditingService(null)
  }

  function saveTemplate(serviceName: string) {
    const key = normalizeServiceName(serviceName)
    const draft = draftByService[key]
    if (!draft) {
      closeEditTemplate()
      return
    }

    const cleaned: WorkTemplate = {
      groups: draft.groups.map((g) => ({
        id: g.id,
        title: g.title.trim() || g.id,
        tasks: g.tasks
          .map((t) => ({
            key: String(t.key).trim(),
            label: String(t.label).trim() || String(t.key).trim(),
            percent: Number(t.percent),
          }))
          .filter((t) => t.key && t.label && Number.isFinite(t.percent) && t.percent > 0),
      })),
    }

    persistTemplates({ ...templatesByService, [key]: cleaned })
    closeEditTemplate()
  }

  function resetTemplate(serviceName: string) {
    const key = normalizeServiceName(serviceName)
    const next = { ...templatesByService }
    delete next[key]
    persistTemplates(next)
    setDraftByService((prev) => {
      const out = { ...prev }
      delete out[key]
      return out
    })
    closeEditTemplate()
  }

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
            const serviceKey = normalizeServiceName(item.serviceType.name)
            const isEditing = editingService === serviceKey
            const template = isEditing ? draftByService[serviceKey] ?? getTemplate(item.serviceType.name) : getTemplate(item.serviceType.name)

            const percentByTask = new Map<string, number>()
            for (const wa of item.workAssignments) {
              const pct = Number(wa.percent.toString())
              if (Number.isFinite(pct)) percentByTask.set(wa.taskType, pct)
            }

            const templateKeys = new Set<string>()
            for (const g of template.groups) {
              for (const t of g.tasks) templateKeys.add(t.key)
            }
            const otherTasks: TaskDef[] = item.workAssignments
              .filter((wa) => !templateKeys.has(wa.taskType))
              .map((wa) => {
                const pct = Number(wa.percent.toString())
                return {
                  key: wa.taskType,
                  label: wa.taskType,
                  percent: Number.isFinite(pct) && pct > 0 ? pct : 1,
                }
              })

            return (
              <div key={item.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.serviceType.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {qty.toLocaleString("id-ID")} {item.serviceType.unit} • Subtotal Rp {formatIdr(itemTotal)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveTemplate(item.serviceType.name)}
                          disabled={pending}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => resetTemplate(item.serviceType.name)}
                          disabled={pending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={closeEditTemplate} disabled={pending}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEditTemplate(item.serviceType.name)}
                        disabled={pending}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-4 rounded-lg border bg-muted/20 p-4">
                    <p className="text-sm font-semibold">Template Pekerjaan</p>
                    <div className="grid gap-4 lg:grid-cols-3">
                      {template.groups.map((g) => (
                        <div key={g.id} className="space-y-3 rounded-lg border bg-background p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <Input
                                value={g.title}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setDraftByService((prev) => {
                                    const current = prev[serviceKey] ?? template
                                    const nextGroups = current.groups.map((x) => (x.id === g.id ? { ...x, title: v } : x))
                                    return { ...prev, [serviceKey]: { groups: nextGroups } }
                                  })
                                }}
                              />
                              <p className="mt-1 text-xs text-muted-foreground">Total {formatPercentId(sumPercent(g.tasks))}%</p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const base = slugifyKey("pos") || "pos"
                                setDraftByService((prev) => {
                                  const current = prev[serviceKey] ?? template
                                  const used = new Set(current.groups.flatMap((x) => x.tasks.map((t) => t.key)))
                                  let key = base
                                  let n = 2
                                  while (used.has(key)) {
                                    key = `${base}_${n}`
                                    n += 1
                                  }
                                  const nextGroups = current.groups.map((x) =>
                                    x.id === g.id ? { ...x, tasks: [...x.tasks, { key, label: "Pos Baru", percent: 1 }] } : x,
                                  )
                                  return { ...prev, [serviceKey]: { groups: nextGroups } }
                                })
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {g.tasks.map((t) => (
                              <div key={t.key} className="grid grid-cols-12 gap-2">
                                <div className="col-span-7">
                                  <Input
                                    value={t.label}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      setDraftByService((prev) => {
                                        const current = prev[serviceKey] ?? template
                                        const nextGroups = current.groups.map((x) =>
                                          x.id === g.id
                                            ? { ...x, tasks: x.tasks.map((y) => (y.key === t.key ? { ...y, label: v } : y)) }
                                            : x,
                                        )
                                        return { ...prev, [serviceKey]: { groups: nextGroups } }
                                      })
                                    }}
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Input
                                    inputMode="decimal"
                                    value={String(t.percent)}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      setDraftByService((prev) => {
                                        const current = prev[serviceKey] ?? template
                                        const nextGroups = current.groups.map((x) =>
                                          x.id === g.id
                                            ? {
                                              ...x,
                                              tasks: x.tasks.map((y) =>
                                                y.key === t.key ? { ...y, percent: Number(v) } : y,
                                              ),
                                            }
                                            : x,
                                        )
                                        return { ...prev, [serviceKey]: { groups: nextGroups } }
                                      })
                                    }}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                      setDraftByService((prev) => {
                                        const current = prev[serviceKey] ?? template
                                        const nextGroups = current.groups.map((x) =>
                                          x.id === g.id ? { ...x, tasks: x.tasks.filter((y) => y.key !== t.key) } : x,
                                        )
                                        return { ...prev, [serviceKey]: { groups: nextGroups } }
                                      })
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-6 lg:grid-cols-3">
                  {template.groups.map((g) => (
                    <TaskGroup
                      key={g.id}
                      title={g.title}
                      tasks={g.tasks}
                      itemId={item.id}
                      orderId={orderId}
                      employees={employees}
                      selectedByItemAndTask={selectedByItemAndTask}
                      pending={pending}
                      getPercent={(taskKey, fallback) => {
                        if (isEditing) return fallback
                        const fromAssignment = percentByTask.get(taskKey)
                        if (fromAssignment != null && Number.isFinite(fromAssignment)) return fromAssignment
                        return fallback
                      }}
                      onSubmit={(formData) => {
                        startTransition(async () => {
                          try {
                            await upsertWorkAssignment(formData)
                            toast.success("Tersimpan")
                          } catch (e) {
                            const msg = e instanceof Error && e.message.trim() ? e.message : "Gagal menyimpan"
                            toast.error(msg)
                          }
                        })
                      }}
                    />
                  ))}
                  {otherTasks.length > 0 ? (
                    <TaskGroup
                      title="Lainnya"
                      tasks={otherTasks}
                      itemId={item.id}
                      orderId={orderId}
                      employees={employees}
                      selectedByItemAndTask={selectedByItemAndTask}
                      pending={pending}
                      getPercent={(_, fallback) => fallback}
                      onSubmit={(formData) => {
                        startTransition(async () => {
                          try {
                            await upsertWorkAssignment(formData)
                            toast.success("Tersimpan")
                          } catch (e) {
                            const msg = e instanceof Error && e.message.trim() ? e.message : "Gagal menyimpan"
                            toast.error(msg)
                          }
                        })
                      }}
                    />
                  ) : null}
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
  getPercent,
  onSubmit,
}: {
  title: string
  tasks: Array<{ key: string; label: string; percent: number }>
  itemId: string
  orderId: string
  employees: EmployeeOption[]
  selectedByItemAndTask: Map<string, string>
  pending: boolean
  getPercent: (taskKey: string, fallbackPercent: number) => number
  onSubmit: (formData: FormData) => void
}) {
  const total = tasks.reduce((sum, t) => sum + getPercent(t.key, t.percent), 0)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs font-semibold text-muted-foreground">Total {formatPercentId(total)}%</p>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => {
          const selectedEmployeeId = selectedByItemAndTask.get(`${itemId}:${task.key}`) ?? ""
          const pct = getPercent(task.key, task.percent)
          return (
            <form
              key={task.key}
              action={(formData) => onSubmit(formData)}
              className="grid gap-2 rounded-md border bg-muted/20 p-3 sm:grid-cols-12 sm:items-center"
            >
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="orderItemId" value={itemId} />
              <input type="hidden" name="taskType" value={task.key} />
              <input type="hidden" name="percent" value={String(pct)} />

              <div className="sm:col-span-5">
                <p className="text-sm font-medium">
                  {task.label} <span className="text-xs text-muted-foreground">({formatPercentId(pct)}%)</span>
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
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )
        })}
      </div>
    </div>
  )
}
