import { ProtectedShell } from "@/components/layout/protected-shell"
import { requireAuth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <ProtectedShell>{children}</ProtectedShell>
  )
}
