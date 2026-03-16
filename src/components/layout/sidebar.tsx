"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ReceiptText, Users, FileText, LogOut, User, Tags, MessageSquareText, Truck } from "lucide-react"

import { signOutAction } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const menus = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/customers", label: "Pelanggan", icon: Users },
  { href: "/orders", label: "Pesanan", icon: ReceiptText },
  { href: "/service-types", label: "Jenis Pesanan", icon: Tags },
  { href: "/delivery-planning", label: "Perencanaan Pengiriman", icon: Truck },
  { href: "/employees", label: "Karyawan", icon: User },
  { href: "/reports", label: "Laporan", icon: FileText },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageSquareText },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full border-r bg-background md:sticky md:top-0 md:h-screen md:w-64">
      <div className="border-b px-4 py-5">
        <p className="text-lg font-semibold leading-none">Laundry Records</p>
        <p className="mt-1 text-xs text-muted-foreground">Manajemen operasional harian</p>
      </div>
      <nav className="space-y-1 p-3">
        {menus.map((menu) => {
          const Icon = menu.icon
          const active = pathname.startsWith(menu.href)
          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{menu.label}</span>
            </Link>
          )
        })}
      </nav>
      <form action={signOutAction} className="p-3">
        <Button type="submit" variant="outline" className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </form>
    </aside>
  )
}
