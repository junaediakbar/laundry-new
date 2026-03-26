"use client"

import { useRef, useTransition } from "react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

type OrderDetailFormsProps = {
  orderId: string
  workflowStatus: string
  workflowOptions: string[]
  updateWorkflow: (formData: FormData) => Promise<void>
  createPayment: (formData: FormData) => Promise<void>
}

export function OrderDetailForms({
  orderId,
  workflowStatus,
  workflowOptions,
  updateWorkflow,
  createPayment,
}: OrderDetailFormsProps) {
  const [savingStatus, startSavingStatus] = useTransition()
  const [savingPayment, startSavingPayment] = useTransition()
  const paymentFormRef = useRef<HTMLFormElement | null>(null)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <form
          action={(formData) => {
            startSavingStatus(async () => {
              try {
                await updateWorkflow(formData)
                toast.success("Status berhasil disimpan")
              } catch {
                toast.error("Gagal menyimpan status")
              }
            })
          }}
          className="space-y-3"
        >
          <h2 className="font-semibold">Update Workflow</h2>
          <Select name="workflowStatus" defaultValue={workflowStatus} disabled={savingStatus}>
            {workflowOptions.map((workflow) => (
              <option key={workflow} value={workflow}>
                {workflow}
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
              } catch (e) {
                const msg =
                  e instanceof Error && e.message.trim()
                    ? e.message
                    : "Gagal menyimpan pembayaran"
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
  )
}
