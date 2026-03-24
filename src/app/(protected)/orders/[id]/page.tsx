import Link from "next/link"
import { notFound } from "next/navigation"

import { createPaymentAction, updateWorkflowAction } from "@/actions/order-actions"
import { OrderDeleteButton } from "@/components/orders/order-delete-button"
import { upsertWorkAssignmentAction } from "@/actions/work-actions"
import { OrderDetailForms } from "@/components/orders/order-detail-forms"
import { OrderAttachments } from "@/components/orders/order-attachments"
import { OrderWorkAssignments } from "@/components/orders/order-work-assignments"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/format"
import { BackendFetchError, backendFetch } from "@/lib/backend"

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
  image?: string | null
  items: OrderItemRow[]
  payments: PaymentRow[]
  attachments: Array<{ id: string; filePath: string; createdAt: string }>
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { error?: string }
}) {
  const employeesPromise = backendFetch<EmployeeOption[]>(`/api/v1/employees?active=true`).catch(() => [])
  let order: OrderDetail | null = null
  let orderError: unknown = null
  try {
    order = await backendFetch<OrderDetail>(`/api/v1/orders/${params.id}`)
  } catch (e) {
    order = null
    orderError = e
  }
  const employees = await employeesPromise

  if (!order) {
    if (orderError instanceof BackendFetchError && orderError.status === 404) {
      notFound()
    }
    return (
      <div className="space-y-4">
        <PageHeader title="Gagal memuat nota" />
        <Card>
          <p className="text-sm text-muted-foreground">
            {orderError instanceof Error ? orderError.message : "Terjadi kesalahan saat mengambil detail nota."}
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="/orders">
              <Button variant="outline">Kembali</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Login ulang</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const orderId = order.id
  const backendBase = (process.env.BACKEND_BASE_URL || "http://localhost:8080").replace(/\/$/, "")
  const orderImageUrl =
    order.image && order.image.length > 0
      ? order.image.startsWith("http://") || order.image.startsWith("https://")
        ? order.image
        : `${backendBase}${order.image.startsWith("/") ? "" : "/"}${order.image}`
      : null
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
  const errMsg = searchParams?.error?.trim()

  return (
    <div className="space-y-4">
      {errMsg ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <p className="text-sm text-destructive">{errMsg}</p>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">{order.invoiceNumber}</h1>
              <p className="text-sm text-muted-foreground">{order.customer.name}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <OrderDeleteButton orderId={orderId} />
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

      <Card>
        <p className="text-sm text-muted-foreground">Gambar Nota</p>
        {orderImageUrl ? (
          <a href={orderImageUrl} target="_blank" rel="noreferrer" className="mt-2 block">
            <img src={orderImageUrl} alt="order image" className="max-h-80 w-full rounded-md border object-cover" />
          </a>
        ) : (
          <p className="mt-2 text-sm font-medium">-</p>
        )}
      </Card>

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
