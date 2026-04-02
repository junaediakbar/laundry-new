"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/format"
import { workflowLabel } from "@/components/shared/status-badge"

type PaymentRow = {
  id: string
  paidAt: string
  method: string
  amount: string
  note: string | null
}

type OrderDetailFormsProps = {
  orderId: string
  workflowStatus: string
  workflowOptions: string[]
  updateWorkflow: (formData: FormData) => Promise<void>
  createPayment: (formData: FormData) => Promise<void>
  deletePayment: (formData: FormData) => Promise<void>
  payments: PaymentRow[]
}

export function OrderDetailForms({
  orderId,
  workflowStatus,
  workflowOptions,
  updateWorkflow,
  createPayment,
  deletePayment,
  payments,
}: OrderDetailFormsProps) {
  const router = useRouter()
  const [savingStatus, startSavingStatus] = useTransition()
  const [savingPayment, startSavingPayment] = useTransition()
  const [deletingPayment, startDeletingPayment] = useTransition()
  const paymentFormRef = useRef<HTMLFormElement | null>(null)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <form
            action={(formData) => {
              startSavingStatus(async () => {
                try {
                  await updateWorkflow(formData)
                  toast.success("Status berhasil disimpan")
                  router.refresh()
                } catch (e) {
                  const msg = e instanceof Error && e.message.trim() ? e.message : "Gagal menyimpan status"
                  toast.error(msg)
                }
              })
            }}
            className="space-y-3"
          >
            <h2 className="font-semibold">Update Workflow</h2>
            <Select name="workflowStatus" defaultValue={workflowStatus} disabled={savingStatus}>
              {workflowOptions.map((workflow) => (
                <option key={workflow} value={workflow}>
                  {workflowLabel(workflow)}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={savingStatus}>
              {savingStatus ? "Menyimpan..." : "Simpan Status"}
            </Button>
          </form>
        </Card>

        <Card>
          <form
            ref={paymentFormRef}
            action={(formData) => {
              startSavingPayment(async () => {
                try {
                  await createPayment(formData)
                  toast.success("Pembayaran berhasil disimpan")
                  paymentFormRef.current?.reset()
                  router.refresh()
                } catch (e) {
                  const msg =
                    e instanceof Error && e.message.trim() ? e.message : "Gagal menyimpan pembayaran"
                  toast.error(msg)
                }
              })
            }}
            className="space-y-3"
          >
            <h2 className="font-semibold">Tambah Pembayaran</h2>
            <input type="hidden" name="orderId" value={orderId} />
            <div className="space-y-2">
              <Label htmlFor="amount">Nominal</Label>
              <Input id="amount" name="amount" type="number" min="1" required disabled={savingPayment} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Metode</Label>
              <Input id="method" name="method" placeholder="cash / transfer / qris" required disabled={savingPayment} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Catatan</Label>
              <Input id="note" name="note" disabled={savingPayment} />
            </div>
            <Button type="submit" disabled={savingPayment}>
              {savingPayment ? "Menyimpan..." : "Simpan Pembayaran"}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="w-0 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.paidAt)}</TableCell>
                  <TableCell className="capitalize">{p.method}</TableCell>
                  <TableCell>{formatCurrency(Number(p.amount))}</TableCell>
                  <TableCell>{p.note ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <form
                      action={(formData) => {
                        if (!confirm("Batalkan pembayaran ini?")) return
                        startDeletingPayment(async () => {
                          try {
                            await deletePayment(formData)
                            toast.success("Pembayaran dibatalkan")
                            router.refresh()
                          } catch (e) {
                            const msg =
                              e instanceof Error && e.message.trim()
                                ? e.message
                                : "Gagal membatalkan pembayaran"
                            toast.error(msg)
                          }
                        })
                      }}
                    >
                      <input type="hidden" name="orderId" value={orderId} />
                      <input type="hidden" name="paymentId" value={p.id} />
                      <Button type="submit" variant="destructive" size="sm" disabled={deletingPayment}>
                        Batalkan
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
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
