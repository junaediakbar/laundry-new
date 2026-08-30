"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Droplets,
  FileText,
  Home,
  LogOut,
  ReceiptText,
  Tags,
  Truck,
  UserCog,
  Users,
} from "lucide-react"

import { signOutAction } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const staffMenus = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/customers", label: "Pelanggan", icon: Users },
  { href: "/orders", label: "Pesanan", icon: ReceiptText },
  { href: "/service-types", label: "Jenis Pesanan", icon: Tags },
  { href: "/delivery-planning", label: "Perencanaan Pengiriman", icon: Truck },
  { href: "/employees", label: "Tim & akun", icon: UserCog },
  { href: "/reports", label: "Laporan", icon: FileText },
] as const

const employeeMenus = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/orders", label: "Daftar Nota", icon: ReceiptText },
] as const

type SidebarProps = {
  className?: string
  onNavigate?: () => void
  role?: string
}

export function Sidebar({ className, onNavigate, role }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = role === "owner" || role === "admin"
  const menus =
    role === "employee"
      ? employeeMenus
      : isAdmin
        ? [
            ...staffMenus,
            { href: "/employees/performance", label: "Performa Karyawan", icon: BarChart3 },
          ]
        : staffMenus
  // Highlight menu paling spesifik saja (mis. /employees/performance, bukan /employees).
  const activeHref = menus
    .filter((m) => pathname.startsWith(m.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  return (
    <aside
      className={cn(
        "flex w-full flex-col border-r border-border/60 bg-background/95 backdrop-blur-sm md:sticky md:top-0 md:h-screen md:w-64",
        "landscape:max-h-[100dvh] landscape:overflow-hidden md:landscape:h-screen",
        className,
      )}
    >
      <div className="border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10">
            <Droplets className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-semibold leading-none tracking-tight">Trees Laundry</p>
            <p className="mt-1 text-xs text-muted-foreground">Manajemen operasional harian</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 [scrollbar-width:thin]">
        {menus.map((menu) => {
          const Icon = menu.icon
          const active = menu.href === activeHref
          return (
            <Link
              key={menu.href}
              href={menu.href}
              onClick={() => onNavigate?.()}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-sm",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                  active
                    ? "bg-primary-foreground/15"
                    : "bg-muted group-hover:bg-background/80",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{menu.label}</span>
            </Link>
          )
        })}
      </nav>
      <form action={signOutAction} className="border-t border-border/60 p-3 safe-bottom">
        <Button
          type="submit"
          variant="outline"
          className="w-full justify-start gap-2 transition-transform hover:bg-secondary active:scale-[0.99]"
          onClick={() => onNavigate?.()}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </form>
    </aside>
  )
}
