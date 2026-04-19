"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

/** Redirects role employee away from routes other than dashboard & orders. */
export function EmployeeRouteGuard({
  role,
  children,
}: {
  role: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (role !== "employee") return
    const isOrderDetail =
      pathname.startsWith("/orders/") &&
      pathname !== "/orders/new" &&
      !pathname.startsWith("/orders/new/")
    const allowed =
      pathname === "/dashboard" ||
      pathname === "/orders" ||
      pathname === "/employees/performance" ||
      isOrderDetail
    if (!allowed) {
      router.replace("/dashboard")
    }
  }, [role, pathname, router])

  return <>{children}</>
}
