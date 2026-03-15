import { loginAction } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LoginPageProps = {
  searchParams?: {
    error?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Masuk</h1>
        <p className="mb-6 text-sm text-muted-foreground">Kelola data laundry dengan cepat.</p>
        <form action={loginAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </Card>
    </div>
  )
}
