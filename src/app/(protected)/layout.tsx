import { ProtectedShell } from "@/components/layout/protected-shell"
import { requireAuth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()

  return <ProtectedShell role={session.role}>{children}</ProtectedShell>
}
