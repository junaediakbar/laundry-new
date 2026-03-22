# Laundry Record Management

Web app manajemen data laundry untuk usaha kecil dengan fokus CRUD cepat, alur kerja jelas, dan pelaporan sederhana.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui style components
- Prisma ORM
- Supabase PostgreSQL
- Supabase Auth
- Zod

## Fitur

- Login dan logout (Supabase Auth)
- CRUD pelanggan + koordinat lokasi (latitude/longitude) dan link Google Maps
- CRUD jenis pesanan (Service Types)
- Nota / pesanan:
  - Multi item layanan (Order Items)
  - Workflow: `received`, `washing`, `drying`, `ironing`, `finished`, `picked_up`
  - Pembayaran + status otomatis: `unpaid`, `partial`, `paid`
  - Input tanggal masuk (`receivedDate`) dan tanggal selesai (`completedDate`)
  - Upload gambar nota (attachments) via Supabase Storage
- Karyawan + performa:
  - CRUD karyawan
  - Upah/pengerjaan per item (Work Assignments)
  - Halaman performa karyawan
- Perencanaan pengiriman:
  - Buat rencana pengiriman dari daftar pelanggan yang punya koordinat
  - Urutan rute sederhana (nearest-neighbor) + link Google Maps Directions
- Laporan:
  - Filter tanggal
  - Export CSV
- WhatsApp (opsional, transactional notifications):
  - Preview + konfirmasi sebelum kirim
  - Edge Functions (send + webhook) + log tabel

## Struktur Aplikasi

```text
src/
  app/
    (auth)/login
    (protected)/
      dashboard
      customers
      delivery-planning
      employees
      orders
      reports
      service-types
      whatsapp
    api/
      orders/[id]/attachments
      whatsapp/preview
      whatsapp/send
  actions/
  components/
  lib/
prisma/
  migrations/
  schema.prisma
  seed.ts
supabase/
  functions/
  sql/
```

## Aturan Bisnis

- Nomor invoice otomatis: `LDR-YYYYMMDD-XXX`
- Total order: `quantity * unit_price - discount`
- Status pembayaran: `unpaid`, `partial`, `paid`
- Jika total pembayaran >= total order, status jadi `paid`
- Saat workflow jadi `picked_up`, `pickup_date` otomatis terisi
- Saat workflow jadi `finished`, `completed_date` otomatis terisi (jika belum ada)

## Setup

1. Install dependency:

```bash
npm install
```

2. Copy environment:

```bash
cp .env.example .env
```

3. Isi variabel berikut di `.env` (wajib):

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Opsional (disarankan):

- `SUPABASE_FUNCTION_INTERNAL_TOKEN` (untuk trigger Edge Function WhatsApp secara aman)
- `WHATSAPP_ADMIN_EMAILS` (allowlist email admin untuk halaman `/whatsapp`)

Catatan deploy (Vercel):

- Jika `db.<ref>.supabase.co` tidak bisa diakses dari environment deploy (umumnya karena IPv6-only), gunakan connection string **pooler** Supabase sebagai `DATABASE_URL` (port 6543).
- Simpan connection string direct sebagai `DIRECT_URL` untuk kebutuhan migrasi (port 5432).
- Jika memakai pooler (PgBouncer) dan muncul error `prepared statement "...\" does not exist` / `already exists`, pastikan `DATABASE_URL` menyertakan `pgbouncer=true&statement_cache_size=0&connection_limit=1`.

4. Generate Prisma Client:

```bash
npm run db:generate
```

5. Jalankan migration:

```bash
npm run db:migrate
```

6. Seed data:

```bash
npm run db:seed
```

Seed cepat (opsional):

```bash
SEED_CUSTOMER_COUNT=30 SEED_ORDER_COUNT=30 npm run db:seed
```

7. Jalankan development server:

```bash
npm run dev
```

App akan tersedia di `http://localhost:3000`.

## Setup Storage (Gambar Nota)

Fitur upload gambar nota menggunakan Supabase Storage bucket `order-images`.

- Buat bucket: `order-images`
- Mode yang paling mudah: set bucket sebagai Public
- Policy minimal (jika memakai Supabase Auth):
  - allow authenticated users upload ke bucket `order-images`
  - allow read public (atau tetap public bucket)

Catatan: attachment yang tersimpan tercatat di tabel `order_attachments`.

## WhatsApp Notifications (Opsional)

Sistem WhatsApp bersifat transactional (template messages), tidak ada fitur chat.

Komponen:

- Next.js admin tools: `/whatsapp`
- Edge Function: `send-order-whatsapp` dan `whatsapp-webhook`
- DB: `whatsapp_templates_map`, `whatsapp_message_logs`, `whatsapp_webhook_logs` (lihat `supabase/sql/whatsapp_notifications.sql`)

Secrets yang harus diset di Supabase Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `FUNCTION_INTERNAL_TOKEN` (harus sama dengan `SUPABASE_FUNCTION_INTERNAL_TOKEN` di Next.js)
- `APP_PUBLIC_URL`

## Performa & UX

- Perpindahan halaman di production bisa terasa lebih lambat karena server-side render + middleware auth + query database (latency Vercel ↔ Supabase).
- Navigasi tombol “Detail” memakai prefetch berbasis intent (hover/focus) agar tetap responsif tanpa membebani halaman list.
- Tombol login memakai state pending agar tidak bisa submit berkali-kali.

## Akun dan Role

Role yang digunakan:

- `owner`
- `admin`
- `cashier`

Authentication menggunakan Supabase Auth. Pastikan user sudah tersedia di Supabase.
