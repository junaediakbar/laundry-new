import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const paymentMap: Record<string, string> = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
}

const paymentLabels: Record<string, string> = {
  unpaid: "Belum lunas",
  partial: "Sebagian",
  paid: "Lunas",
}

const workflowMap: Record<string, string> = {
  received: "bg-slate-100 text-slate-700",
  washing: "bg-blue-100 text-blue-700",
  drying: "bg-indigo-100 text-indigo-700",
  ironing: "bg-purple-100 text-purple-700",
  finished: "bg-zinc-900 text-white",
  delivered: "bg-zinc-800 text-white",
  picked_up: "bg-emerald-100 text-emerald-700",
}

const workflowLabels: Record<string, string> = {
  received: "Diterima",
  washing: "Sudah dirontok",
  drying: "Sudah dijemur",
  ironing: "Sudah finishing",
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
  const styles = type === "payment" ? paymentMap[value] : workflowMap[value]
  return (
    <Badge className={cn("border-0 px-2 py-1", styles)} variant="secondary">
      {type === "payment" ? paymentLabel(value) : workflowLabel(value)}
    </Badge>
  )
}
