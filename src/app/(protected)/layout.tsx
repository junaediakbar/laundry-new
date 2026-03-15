import { Sidebar } from "@/components/layout/sidebar"
import { requireAuth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <div className="min-h-screen bg-muted/40 md:flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl animate-[fadeIn_200ms_ease-out]">
          {children}
        </div>
      </main>
    </div>
  )
}
