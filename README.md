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

## Fitur MVP

- Login dan logout
- CRUD pelanggan
- CRUD pesanan laundry
- Tracking workflow: `received`, `washing`, `drying`, `ironing`, `finished`, `picked_up`
- Pencatatan pembayaran dan update status pembayaran otomatis
- Dashboard ringkasan
- Laporan dengan filter tanggal dan export CSV

## Struktur Aplikasi

```text
src/
  app/
    (auth)/login
    (protected)/
      dashboard
      customers
      orders
      reports
  actions/
  components/
  lib/
prisma/
  migrations/
  schema.prisma
  seed.ts
```

## Aturan Bisnis

- Nomor invoice otomatis: `LDR-YYYYMMDD-XXX`
- Total order: `quantity * unit_price - discount`
- Status pembayaran: `unpaid`, `partial`, `paid`
- Jika total pembayaran >= total order, status jadi `paid`
- Saat workflow jadi `picked_up`, `pickup_date` otomatis terisi

## Setup

1. Install dependency:

```bash
npm install
```

2. Copy environment:

```bash
cp .env.example .env
```

3. Isi variabel berikut di `.env`:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Generate Prisma Client:

```bash
npm run db:generate
```

5. Jalankan migration:

```bash
npm run db:migrate
```

6. Seed service types:

```bash
npm run db:seed
```

7. Jalankan development server:

```bash
npm run dev
```

App akan tersedia di `http://localhost:3000`.

## Akun dan Role

Role yang digunakan:
- `owner`
- `admin`
- `cashier`

Authentication menggunakan Supabase Auth. Pastikan user sudah tersedia di Supabase.
