"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-toastify"

type ToastQueryProps = {
  successParam?: string
  successMessage?: string
  errorParam?: string
  errorMessageFallback?: string
}

export function ToastQuery({
  successParam,
  successMessage = "Berhasil",
  errorParam,
  errorMessageFallback = "Terjadi kesalahan",
}: ToastQueryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    let didToast = false

    if (successParam && params.has(successParam)) {
      toast.success(successMessage, { toastId: `qs:${successParam}:${successMessage}` })
      params.delete(successParam)
      didToast = true
    }

    if (errorParam && params.has(errorParam)) {
      const msg = params.get(errorParam) || errorMessageFallback
      toast.error(msg, { toastId: `qs:${errorParam}:${msg}` })
      params.delete(errorParam)
      didToast = true
    }

    if (didToast) {
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    }
  }, [errorMessageFallback, errorParam, pathname, router, searchParams, successMessage, successParam])

  return null
}
