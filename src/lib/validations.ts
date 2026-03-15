import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export const customerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().min(8, "No. telepon terlalu pendek").optional().or(z.literal("")),
  address: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  notes: z.string().optional(),
})

export const orderSchema = z.object({
  customerId: z.string().min(1, "Pelanggan wajib dipilih"),
  items: z
    .array(
      z.object({
        serviceTypeId: z.string().min(1, "Layanan wajib dipilih"),
        quantity: z.coerce.number().positive("Qty harus lebih dari 0"),
        unitPrice: z.coerce.number().nonnegative("Harga tidak boleh negatif"),
        discount: z.coerce.number().nonnegative("Diskon tidak boleh negatif").default(0),
      }),
    )
    .min(1, "Minimal 1 item pesanan"),
  note: z.string().optional(),
})

export const paymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.coerce.number().positive("Nominal pembayaran wajib diisi"),
  method: z.string().min(2, "Metode wajib diisi"),
  note: z.string().optional(),
})

export const reportFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})
