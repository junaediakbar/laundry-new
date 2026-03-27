import { loginAction } from "@/actions/auth-actions"
import { SubmitButton } from "@/components/shared/submit-button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Droplets, Sparkles } from "lucide-react"

type LoginPageProps = {
  searchParams?: {
    error?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error

  return (
    <div className="relative flex min-h-[100dvh] min-h-screen flex-col lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Brand panel — full on lg; compact strip on mobile */}
      <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600 px-6 py-10 text-white safe-top lg:min-h-screen lg:px-12 lg:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative z-10 max-w-md">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm ring-1 ring-white/20">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Operasional lebih rapi
          </div>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-lg ring-2 ring-white/30 backdrop-blur-sm">
              <Droplets className="h-8 w-8" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Trees Laundry</h1>
              <p className="mt-0.5 text-sm text-teal-50">Manajemen nota & pelanggan</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-teal-50 lg:text-base">
            Masuk untuk mengelola pesanan, status cucian, dan pembayaran — di kantor atau di kasir.
          </p>
        </div>
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 top-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-8 safe-bottom lg:px-10 lg:py-12">
        <Card className="w-full max-w-md border-border/80 p-6 shadow-xl shadow-primary/5 ring-1 ring-border/50 lg:p-8">
          <h2 className="text-xl font-bold tracking-tight lg:text-2xl">Masuk</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gunakan email dan password akun Anda.
          </p>
          <form action={loginAction} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-11 transition-shadow focus-visible:ring-primary/30"
                placeholder="nama@perusahaan.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-11 transition-shadow focus-visible:ring-primary/30"
                placeholder="••••••••"
              />
            </div>
            {error ? (
              <p
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <SubmitButton
              label="Login"
              loadingLabel="Masuk..."
              className="h-11 w-full text-base shadow-md shadow-primary/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            />
          </form>
        </Card>
      </div>
    </div>
  )
}
