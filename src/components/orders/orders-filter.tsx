"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

type OrdersFilterProps = {
    defaultQ?: string
    defaultSort?: string
    defaultDir?: string
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debounced
}

export function OrdersFilter({ defaultQ = "", defaultSort = "created_at", defaultDir = "desc" }: OrdersFilterProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [q, setQ] = useState(defaultQ)
    const [sort, setSort] = useState(defaultSort)
    const [dir, setDir] = useState(defaultDir)
    const [isPending, setIsPending] = useState(false)

    const debouncedQ = useDebounce(q, 400)
    const isFirstRender = useRef(true)

    const navigate = useCallback(
        (nextQ: string, nextSort: string, nextDir: string) => {
            setIsPending(true)
            const params = new URLSearchParams(searchParams.toString())
            if (nextQ) params.set("q", nextQ)
            else params.delete("q")
            params.set("sort", nextSort)
            params.set("dir", nextDir)
            params.delete("page") // reset ke page 1 saat filter berubah
            router.push(`${pathname}?${params.toString()}`)
            // isPending akan di-reset saat navigasi selesai (komponen re-render dari server)
        },
        [router, pathname, searchParams],
    )

    // Trigger saat debounced search query berubah
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        navigate(debouncedQ, sort, dir)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQ])

    // Reset pending saat render baru dari server tiba
    useEffect(() => {
        setIsPending(false)
    }, [searchParams])

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextSort = e.target.value
        setSort(nextSort)
        navigate(q, nextSort, dir)
    }

    const handleDirChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextDir = e.target.value
        setDir(nextDir)
        navigate(q, sort, nextDir)
    }

    return (
        <div className="mb-4 flex w-full flex-col gap-2 sm:flex-row sm:items-end">
            <div className="relative flex w-full gap-2 sm:flex-1">
                <Input
                    name="q"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Cari invoice / nama pelanggan..."
                    className="w-full"
                />
                {isPending && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        {/* Spinner sederhana pakai CSS */}
                        <svg
                            className="h-4 w-4 animate-spin text-muted-foreground"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                    </span>
                )}
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
                <Select name="sort" value={sort} onChange={handleSortChange} className="w-full sm:w-44">
                    <option value="created_at">Terbaru</option>
                    <option value="received_date">Tanggal masuk</option>
                    <option value="total">Total</option>
                    <option value="customer_name">Nama pelanggan</option>
                    <option value="invoice_number">Invoice</option>
                </Select>
                <Select name="dir" value={dir} onChange={handleDirChange} className="w-full sm:w-28">
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                </Select>
            </div>
        </div>
    )
}