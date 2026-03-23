"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="md:flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
            <Button type="button" variant="outline" className="h-10 w-10 px-0" onClick={() => setOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold">Laundry Records</p>
            <div className="h-10 w-10" />
          </header>

          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto w-full max-w-6xl animate-[fadeIn_200ms_ease-out]">{children}</div>
          </main>
        </div>
      </div>

      <div className={cn("fixed inset-0 z-50 md:hidden", open ? "" : "pointer-events-none")}>
        <div
          className={cn("absolute inset-0 bg-black/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] transform bg-background shadow-lg transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">Menu</p>
            <Button type="button" variant="outline" className="h-10 w-10 px-0" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Sidebar className="h-full border-r-0 md:border-r" onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </div>
  )
}

