"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { EmployeeRouteGuard } from "@/components/layout/employee-route-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ProtectedShell({
  children,
  role,
}: {
  children: React.ReactNode
  role: string
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div
      className={cn(
        "min-h-[100dvh] min-h-screen bg-gradient-to-br from-teal-50/90 via-background to-sky-50/40",
        /* Landscape mobile: keep content scrollable; avoid clipping */
        "landscape:min-h-0 landscape:md:min-h-screen",
      )}
    >
      <div className="md:flex md:min-h-[100dvh] md:min-h-screen">
        <div className="hidden md:block">
          <Sidebar role={role} />
        </div>

        <div className="flex min-h-0 min-h-[100dvh] min-w-0 flex-1 flex-col md:min-h-screen">
          <header
            className={cn(
              "safe-top safe-x sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md md:hidden",
              "landscape:py-2 landscape:md:py-3",
            )}
          >
            <Button
              type="button"
              variant="outline"
              className="h-10 w-10 shrink-0 px-0 m-2 transition-transform hover:scale-105 active:scale-95"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold tracking-tight text-primary">Trees Laundry</p>
            <div className="h-10 w-10 shrink-0" aria-hidden />
          </header>

          <main
            className={cn(
              "safe-bottom flex-1 overflow-y-auto p-4 md:p-6",
              "landscape:px-4 landscape:py-3 landscape:md:p-6",
            )}
          >
            <div
              className={cn(
                "mx-auto w-full max-w-6xl animate-[fadeIn_280ms_ease-out] xl:max-w-7xl",
                "landscape:max-w-[min(100%,96rem)]",
              )}
            >
              <EmployeeRouteGuard role={role}>{children}</EmployeeRouteGuard>
            </div>
          </main>
        </div>
      </div>

      <div className={cn("fixed inset-0 z-50 md:hidden", open ? "" : "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[min(18rem,88vw)] max-w-[85vw] transform border-r border-border/60 bg-background/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="safe-top flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="text-sm font-semibold">Menu</p>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-10 px-0 my-2"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Sidebar
            role={role}
            className="max-h-[calc(100dvh-3.5rem)] border-r-0 md:border-r"
            onNavigate={() => setOpen(false)}
          />
        </div>
      </div>
    </div>
  )
}
