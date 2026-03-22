import { notFound } from "next/navigation"

import { createPaymentAction, updateWorkflowAction } from "@/actions/order-actions"
import { upsertWorkAssignmentAction } from "@/actions/work-actions"
import { OrderDetailForms } from "@/components/orders/order-detail-forms"
import { OrderAttachments } from "@/components/orders/order-attachments"
import { OrderWorkAssignments } from "@/components/orders/order-work-assignments"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/format"
import { backendFetch } from "@/lib/backend"

const workflowOptions = ["received", "washing", "drying", "ironing", "finished", "picked_up"]

type EmployeeOption = { id: string; name: string }

type WorkAssignmentRow = {
  id: string
  orderItemId: string
  taskType: string
  employee: EmployeeOption
  percent: string
  amount: string
}

type OrderItemRow = {
  id: string
  quantity: string
  unitPrice: string
  discount: string
  total: string
  serviceType: { name: string; unit: string }
  workAssignments: WorkAssignmentRow[]
}

type PaymentRow = {
  id: string
  paidAt: string
  method: string
  amount: string
  note: string | null
}

type OrderDetail = {
  id: string
  invoiceNumber: string
  customer: { name: string }
  total: string
  paymentStatus: string
  workflowStatus: string
  receivedDate: string
  completedDate: string | null
  pickupDate: string | null
  items: OrderItemRow[]
  payments: PaymentRow[]
  attachments: Array<{ id: string; filePath: string; createdAt: string }>
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, employees] = await Promise.all([
    backendFetch<OrderDetail>(`/api/v1/orders/${params.id}`),
    backendFetch<EmployeeOption[]>(`/api/v1/employees?active=true`),
  ]).catch(() => [null, []] as const)

  if (!order) {
    notFound()
  }

  const orderId = order.id
  const paidAmount = order.payments.reduce(
    (sum: number, payment: { amount: string }) => sum + Number(payment.amount),
    0,
  )
  const remaining = Number(order.total) - paidAmount

  async function updateWorkflow(formData: FormData) {
    "use server"
    const workflowStatus = String(formData.get("workflowStatus") ?? "")
    await updateWorkflowAction(orderId, workflowStatus)
  }

  const itemCount = order.items.length

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">{order.invoiceNumber}</h1>
              <p className="text-sm text-muted-foreground">{order.customer.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge type="payment" value={order.paymentStatus} />
              <StatusBadge type="workflow" value={order.workflowStatus} />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Item</p>
              <p className="text-sm font-medium">{itemCount} item</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-sm font-medium">{formatCurrency(Number(order.total))}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Terbayar</p>
              <p className="text-sm font-medium">{formatCurrency(paidAmount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sisa</p>
              <p className="text-sm font-medium">{formatCurrency(remaining)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Diterima</p>
              <p className="text-sm font-medium">{formatDate(order.receivedDate)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Selesai</p>
              <p className="text-sm font-medium">
                {order.completedDate ? formatDate(order.completedDate) : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Diambil</p>
              <p className="text-sm font-medium">
                {order.pickupDate ? formatDate(order.pickupDate) : "-"}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-muted-foreground">Jumlah Pembayaran</p>
          <p className="mt-2 text-3xl font-semibold">{order.payments.length}</p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Item Pesanan</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layanan</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.serviceType.name}</TableCell>
                  <TableCell>
                    {Number(item.quantity).toLocaleString("id-ID")} {item.serviceType.unit}
                  </TableCell>
                  <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                  <TableCell>{formatCurrency(Number(item.discount))}</TableCell>
                  <TableCell>{formatCurrency(Number(item.total))}</TableCell>
                </TableRow>
              ))}
              {order.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Belum ada item.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>

      <OrderWorkAssignments orderId={orderId} items={order.items} employees={employees} upsertWorkAssignment={upsertWorkAssignmentAction} />

      <OrderAttachments
        orderId={orderId}
        attachments={order.attachments.map((a) => ({ id: a.id, filePath: a.filePath, createdAt: a.createdAt }))}
      />

      <OrderDetailForms
        orderId={orderId}
        workflowStatus={order.workflowStatus}
        workflowOptions={workflowOptions}
        updateWorkflow={updateWorkflow}
        createPayment={createPaymentAction}
      />

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paidAt)}</TableCell>
                  <TableCell className="capitalize">{payment.method}</TableCell>
                  <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                  <TableCell>{payment.note ?? "-"}</TableCell>
                </TableRow>
              ))}
              {order.payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Belum ada pembayaran.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
