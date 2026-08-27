# Laundry Record Management (Frontend)

Web app manajemen data laundry untuk usaha kecil: CRUD cepat, alur kerja jelas, dan pelaporan sederhana.

Repo ini adalah **frontend Next.js (BFF)**. Semua data diambil dari **backend Go** terpisah lewat HTTP (`/api/v1/...`). Tidak ada koneksi database langsung dari frontend.

## Tech Stack

- Next.js 14 (App Router) + React 18
- TypeScript
- Tailwind CSS 3
- Komponen bergaya shadcn/ui (cva + clsx + tailwind-merge + lucide-react)
- Zod (validasi input)
- Recharts (grafik dashboard)
- react-toastify (notifikasi), date-fns, lodash

## Arsitektur

- **Data**: Server Actions (`src/actions/*`) memanggil backend Go via helper `backendFetch` (`src/lib/backend.ts`). Base URL diatur lewat `BACKEND_BASE_URL` (default `http://localhost:8080`), request ke path `/api/v1/...`.
- **Auth**: `loginAction` mem-POST kredensial ke backend `/api/v1/auth/login`, lalu frontend menerbitkan **cookie session bertanda tangan HMAC-SHA256** (`AUTH_SECRET`). `middleware.ts` memverifikasi cookie di setiap request area `(protected)`.
- **Role**: `owner`, `admin`, `cashier`. Session juga menyimpan `employeeId`.
- **Nota publik**: halaman `/receipt/[token]` (tanpa login) mengambil data dari `/api/v1/public/receipts/`.

## Fitur

- Login / logout (cookie session bertanda tangan)
- CRUD pelanggan + koordinat lokasi (latitude/longitude) dan link Google Maps
- CRUD jenis pesanan (Service Types)
- Nota / pesanan: multi item, workflow status, pembayaran, upload gambar nota (attachments)
- Karyawan + halaman performa (Work Assignments)
- Perencanaan pengiriman: rencana rute dari pelanggan berkoordinat, urutan nearest-neighbor + link Google Maps Directions
- Laporan: filter tanggal + export CSV
- Manajemen user (owner/admin/cashier)
- WhatsApp (opsional, notifikasi transactional lewat backend)

> Aturan bisnis (nomor invoice, perhitungan total, status pembayaran, tanggal otomatis) ditangani di **backend Go**, bukan di frontend ini.

## Struktur

```text
src/
  app/
    (auth)/login
    (protected)/
      dashboard  customers  orders  service-types
      employees (+ performance)  delivery-planning
      reports (+ export)  users  whatsapp
    receipt/[token]        # nota publik
  actions/                 # server actions (panggil backend)
  components/              # UI per domain + shared/ui
  lib/
    backend.ts             # backendFetch helper
    auth-session.ts        # sign/verify cookie session
    validations.ts         # skema zod
  middleware.ts            # proteksi route + verifikasi session
```

## Setup

1. Install dependency:

```bash
npm install
```

2. Copy environment:

```bash
cp .env.example .env
```

3. Isi variabel di `.env`:

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `BACKEND_BASE_URL` | ✅ | URL backend Go, mis. `http://localhost:8080` |
| `BACKEND_API_KEY` | ✅ | API key untuk otentikasi frontend → backend |
| `AUTH_SECRET` | ✅ | Secret HMAC untuk menandatangani cookie session (string acak panjang) |
| `ADMIN_EMAIL` | ✅ | Kredensial admin awal |
| `ADMIN_PASSWORD` | ✅ | Kredensial admin awal |
| `REPORT_TZ` | opsional | Timezone untuk perhitungan laporan (default server) |

4. Jalankan backend Go terlebih dulu (lihat repo backend), pastikan tersedia di `BACKEND_BASE_URL`.

5. Jalankan development server:

```bash
npm run dev
```

App tersedia di `http://localhost:3000`.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # jalankan hasil build
npm run lint       # eslint (next lint)
npm run typecheck  # tsc --noEmit
```

## Deploy (Vercel)

- Set semua env di atas pada project Vercel.
- Pastikan `BACKEND_BASE_URL` menunjuk ke backend Go yang bisa diakses publik dan `AUTH_SECRET` konsisten antar environment agar cookie session valid.

## Catatan UX

- Perpindahan halaman di production dipengaruhi latency frontend ↔ backend Go.
- Tombol "Detail" memakai prefetch berbasis intent (hover/focus).
- Tombol login memakai state pending agar tidak submit ganda.
