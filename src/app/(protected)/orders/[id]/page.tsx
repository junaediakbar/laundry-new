import Link from "next/link"
import { notFound } from "next/navigation"

import { createPaymentAction, deletePaymentAction, updateWorkflowAction } from "@/actions/order-actions"
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
import { getSession } from "@/lib/auth"
import { formatCurrency, formatDate } from "@/lib/format"
import { formatOrderItemQtyDescription } from "@/lib/order-item-display"
import { resolveOrderImageUrls } from "@/lib/order-images"
import { BackendFetchError, backendFetch } from "@/lib/backend"

const workflowOptions = [
  "received",
  "rontok_done",
  "jemur_done",
  "downy_done",
  "packing_done",
  "delivered",
  "picked_up",
]

type EmployeeOption = { id: string; name: string; role?: string }

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
  lengthM?: string | null
  widthM?: string | null
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
  images?: string[] | null
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
  const [session, employees] = await Promise.all([
    getSession(),
    backendFetch<EmployeeOption[]>(`/api/v1/employees?active=true`).catch(() => []),
  ])
  let order: OrderDetail | null = null
  let orderError: unknown = null
  try {
    order = await backendFetch<OrderDetail>(`/api/v1/orders/${params.id}`)
  } catch (e) {
    order = null
    orderError = e
  }

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
  const orderImageUrls = resolveOrderImageUrls(backendBase, order.image, order.images)
  /** Selaraskan dengan backend: ROUND(SUM(amount),0) >= ROUND(total,0) */
  const totalIdr = Math.round(Number(order.total))
  const paidIdr = Math.round(order.payments.reduce((s, p) => s + Number(p.amount), 0))
  const paidAmount = order.payments.reduce((sum: number, payment) => sum + Number(payment.amount), 0)
  const remaining = Math.max(totalIdr - paidIdr, 0)
  const paymentStatus =
    totalIdr <= 0 || paidIdr >= totalIdr ? "paid" : paidIdr > 0 ? "partial" : "unpaid"

  async function updateWorkflow(formData: FormData) {
    "use server"
    const workflowStatus = String(formData.get("workflowStatus") ?? "")
    await updateWorkflowAction(orderId, workflowStatus)
  }

  const itemCount = order.items.length
  const errMsg = searchParams?.error?.trim()
  const isEmployeeViewer = session?.role === "employee"

  const attachmentRows = order.attachments.map((a) => ({
    id: a.id,
    filePath: a.filePath,
    createdAt: a.createdAt,
  }))

  if (isEmployeeViewer) {
    return (
      <div className="space-y-4">
        {errMsg ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <p className="text-sm text-destructive">{errMsg}</p>
          </Card>
        ) : null}
        <div className="space-y-1">
          <p className="text-sm font-semibold">{order.invoiceNumber}</p>
          <p className="text-xs text-muted-foreground">{order.customer.name}</p>
        </div>
        <OrderAttachments
          orderId={orderId}
          orderImageUrls={orderImageUrls}
          attachments={attachmentRows}
          heading="Gambar saya"
          description="Foto nota dan lampiran untuk referensi Anda."
        />
        <OrderWorkAssignments
          orderId={orderId}
          items={order.items}
          employees={employees}
          upsertWorkAssignment={upsertWorkAssignmentAction}
          lockFilledAssignmentsForEmployee
          viewerRole={session?.role}
        />
      </div>
    )
  }

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
              <StatusBadge type="payment" value={paymentStatus} />
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
                  <TableCell className="tabular-nums leading-snug">
                    {formatOrderItemQtyDescription({
                      unit: item.serviceType.unit,
                      quantity: item.quantity,
                      lengthM: item.lengthM,
                      widthM: item.widthM,
                    })}
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

      <OrderWorkAssignments
        orderId={orderId}
        items={order.items}
        employees={employees}
        upsertWorkAssignment={upsertWorkAssignmentAction}
        lockFilledAssignmentsForEmployee={session?.role === "employee"}
        viewerRole={session?.role}
      />

      <OrderAttachments
        orderId={orderId}
        orderImageUrls={orderImageUrls}
        attachments={attachmentRows}
        canUpload
      />

      <OrderDetailForms
        orderId={orderId}
        workflowStatus={order.workflowStatus}
        workflowOptions={workflowOptions}
        updateWorkflow={updateWorkflow}
        createPayment={createPaymentAction}
        deletePayment={deletePaymentAction}
        payments={order.payments}
      />
    </div>
  )
}
