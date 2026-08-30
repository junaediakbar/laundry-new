"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { DELIVERY_SERVICE_CATEGORIES } from "@/lib/delivery-service"

type OrdersFilterProps = {
    defaultQ?: string
    defaultSort?: string
    defaultDir?: string
    defaultWorkflow?: string
    defaultPayment?: string
    defaultCategory?: string
    defaultStartDate?: string
    defaultEndDate?: string
}

type FilterState = {
    q: string
    sort: string
    dir: string
    workflow: string
    payment: string
    category: string
    startDate: string
    endDate: string
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debounced
}

export function OrdersFilter({
    defaultQ = "",
    defaultSort = "created_at",
    defaultDir = "desc",
    defaultWorkflow = "",
    defaultPayment = "",
    defaultCategory = "",
    defaultStartDate = "",
    defaultEndDate = "",
}: OrdersFilterProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [q, setQ] = useState(defaultQ)
    const [sort, setSort] = useState(defaultSort)
    const [dir, setDir] = useState(defaultDir)
    const [workflow, setWorkflow] = useState(defaultWorkflow)
    const [payment, setPayment] = useState(defaultPayment)
    const [category, setCategory] = useState(defaultCategory)
    const [startDate, setStartDate] = useState(defaultStartDate)
    const [endDate, setEndDate] = useState(defaultEndDate)
    const [isPending, setIsPending] = useState(false)

    const debouncedQ = useDebounce(q, 400)
    const isFirstRender = useRef(true)

    const navigate = useCallback(
        (next: FilterState) => {
            setIsPending(true)
            const params = new URLSearchParams()
            if (next.q) params.set("q", next.q)
            params.set("sort", next.sort)
            params.set("dir", next.dir)
            if (next.workflow) params.set("workflow", next.workflow)
            if (next.payment) params.set("paymentStatus", next.payment)
            if (next.category) params.set("category", next.category)
            if (next.startDate) params.set("startDate", next.startDate)
            if (next.endDate) params.set("endDate", next.endDate)
            // page sengaja tidak di-set → kembali ke halaman 1 saat filter berubah
            router.push(`${pathname}?${params.toString()}`)
        },
        [router, pathname],
    )

    const current: FilterState = { q, sort, dir, workflow, payment, category, startDate, endDate }
    const apply = (patch: Partial<FilterState>) => navigate({ ...current, ...patch })

    // Trigger saat debounced search query berubah
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        navigate({ ...current, q: debouncedQ })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQ])

    // Reset pending saat render baru dari server tiba
    useEffect(() => {
        setIsPending(false)
    }, [searchParams])

    return (
        <div className="mb-4 flex w-full flex-col gap-2">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end">
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
                    <Select
                        name="sort"
                        value={sort}
                        onChange={(e) => {
                            setSort(e.target.value)
                            apply({ sort: e.target.value })
                        }}
                        className="w-full sm:w-44"
                    >
                        <option value="created_at">Terbaru</option>
                        <option value="received_date">Tanggal masuk</option>
                        <option value="total">Total</option>
                        <option value="customer_name">Nama pelanggan</option>
                        <option value="invoice_number">Invoice</option>
                    </Select>
                    <Select
                        name="dir"
                        value={dir}
                        onChange={(e) => {
                            setDir(e.target.value)
                            apply({ dir: e.target.value })
                        }}
                        className="w-full sm:w-28"
                    >
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                    </Select>
                </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <Select
                    name="workflow"
                    value={workflow}
                    onChange={(e) => {
                        setWorkflow(e.target.value)
                        apply({ workflow: e.target.value })
                    }}
                    className="w-full sm:w-40"
                >
                    <option value="">Semua status</option>
                    <option value="in_progress">Dalam proses</option>
                    <option value="done">Selesai</option>
                </Select>
                <Select
                    name="paymentStatus"
                    value={payment}
                    onChange={(e) => {
                        setPayment(e.target.value)
                        apply({ payment: e.target.value })
                    }}
                    className="w-full sm:w-40"
                >
                    <option value="">Semua pembayaran</option>
                    <option value="unpaid">Belum bayar</option>
                    <option value="partial">Sebagian</option>
                    <option value="paid">Lunas</option>
                </Select>
                <Select
                    name="category"
                    value={category}
                    onChange={(e) => {
                        setCategory(e.target.value)
                        apply({ category: e.target.value })
                    }}
                    className="w-full sm:w-40"
                >
                    <option value="">Semua percepatan</option>
                    {DELIVERY_SERVICE_CATEGORIES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                    <Input
                        type="date"
                        name="startDate"
                        aria-label="Tanggal masuk dari"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value)
                            apply({ startDate: e.target.value })
                        }}
                        className="w-full sm:w-40"
                    />
                    <span className="text-sm text-muted-foreground">s/d</span>
                    <Input
                        type="date"
                        name="endDate"
                        aria-label="Tanggal masuk sampai"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value)
                            apply({ endDate: e.target.value })
                        }}
                        className="w-full sm:w-40"
                    />
                </div>
            </div>
        </div>
    )
}
