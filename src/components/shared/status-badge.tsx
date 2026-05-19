import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const paymentMap: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
}

const paymentLabels: Record<string, string> = {
  unpaid: "Belum Lunas",
  partial: "Sebagian",
  paid: "Lunas",
}

const workflowMap: Record<string, string> = {
  received: "bg-slate-100 text-slate-700",
  rontok_done: "bg-blue-100 text-blue-800",
  jemur_done: "bg-indigo-100 text-indigo-800",
  downy_done: "bg-violet-100 text-violet-800",
  packing_done: "bg-zinc-800 text-white",
  washing: "bg-blue-100 text-blue-700",
  drying: "bg-indigo-100 text-indigo-700",
  ironing: "bg-purple-100 text-purple-700",
  finished: "bg-zinc-900 text-white",
  delivered: "bg-teal-800 text-white",
  picked_up: "bg-emerald-100 text-emerald-700",
}

const workflowLabels: Record<string, string> = {
  received: "Diterima",
  rontok_done: "Sudah dirontok",
  jemur_done: "Sudah dijemur",
  downy_done: "Sudah didowny",
  packing_done: "Sudah dipacking",
  washing: "Sudah dirontok",
  drying: "Sudah dijemur",
  ironing: "Sudah didowny",
  finished: "Sudah packing",
  delivered: "Sudah diantar",
  picked_up: "Sudah diambil",
}

type StatusBadgeProps = {
  type: "payment" | "workflow"
  value: string
}

export function workflowLabel(value: string) {
  return workflowLabels[value] ?? value
}

export function paymentLabel(value: string) {
  return paymentLabels[value] ?? value
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  const styles =
    type === "payment" ? paymentMap[value] : workflowMap[value] ?? "bg-muted text-foreground"
  return (
    <Badge className={cn("border-0 px-2 py-1 text-xs mx-auto text-center", styles)} variant="secondary">
      {type === "payment" ? paymentLabel(value) : workflowLabel(value)}
    </Badge>
  )
}
