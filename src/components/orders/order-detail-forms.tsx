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
import { paymentMethodLabel } from "@/lib/payment-method"
import {
  PICKUP_DELIVERY_FORM_OPTIONS,
  pickupDeliveryToFormValue,
} from "@/lib/pickup-delivery"

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
  pickupDelivery: boolean | null
  updateWorkflow: (formData: FormData) => Promise<void>
  updatePickupDelivery: (formData: FormData) => Promise<void>
  createPayment: (formData: FormData) => Promise<void>
  deletePayment: (formData: FormData) => Promise<void>
  payments: PaymentRow[]
}

export function OrderDetailForms({
  orderId,
  workflowStatus,
  workflowOptions,
  pickupDelivery,
  updateWorkflow,
  updatePickupDelivery,
  createPayment,
  deletePayment,
  payments,
}: OrderDetailFormsProps) {
  const router = useRouter()
  const [savingStatus, startSavingStatus] = useTransition()
  const [savingPickup, startSavingPickup] = useTransition()
  const [savingPayment, startSavingPayment] = useTransition()
  const [deletingPayment, startDeletingPayment] = useTransition()
  const paymentFormRef = useRef<HTMLFormElement | null>(null)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2">
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
              <Select id="method" name="method" defaultValue="cash" required disabled={savingPayment}>
                <option value="cash">{paymentMethodLabel("cash")}</option>
                <option value="qris">{paymentMethodLabel("qris")}</option>
                <option value="lainnya">{paymentMethodLabel("lainnya")}</option>
              </Select>
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

        <Card>
          <form
            action={(formData) => {
              startSavingPickup(async () => {
                try {
                  await updatePickupDelivery(formData)
                  toast.success("Antar jemput disimpan")
                  router.refresh()
                } catch (e) {
                  const msg =
                    e instanceof Error && e.message.trim() ? e.message : "Gagal menyimpan antar jemput"
                  toast.error(msg)
                }
              })
            }}
            className="space-y-3"
          >
            <h2 className="font-semibold">Antar jemput</h2>
            <div className="space-y-2">
              <Label htmlFor={`pickupDelivery-${orderId}`}>Pilihan</Label>
              <Select
                key={`pickup-${orderId}-${pickupDeliveryToFormValue(pickupDelivery)}`}
                id={`pickupDelivery-${orderId}`}
                name="pickupDelivery"
                defaultValue={pickupDeliveryToFormValue(pickupDelivery)}
                disabled={savingPickup}
              >
                {PICKUP_DELIVERY_FORM_OPTIONS.map((opt) => (
                  <option key={opt.value === "" ? "unknown" : opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={savingPickup}>
              {savingPickup ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Tanggal bayar (WITA)</TableHead>
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
                  <TableCell>{paymentMethodLabel(p.method)}</TableCell>
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
