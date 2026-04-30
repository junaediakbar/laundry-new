"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, ChevronsUpDown, Loader2, Plus, SearchX } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SearchableOption = {
    /** Value yang disimpan di form (misal: id) */
    value: string
    /** Teks utama yang ditampilkan */
    label: string
    /** Teks sekunder opsional (misal: nomor telepon, email) */
    sublabel?: string | null
}

type SearchableSelectProps = {
    /** Label di atas input */
    label?: string
    /** Placeholder saat belum ada yang dipilih */
    placeholder?: string
    /** Placeholder input pencarian */
    searchPlaceholder?: string
    /** Nama field hidden input (untuk form submission) */
    name: string
    /** Nilai awal (controlled dari luar, misal defaultCustomerId) */
    defaultValue?: string
    /** Label awal jika value sudah ada (agar tidak perlu fetch ulang) */
    defaultLabel?: string
    /**
     * Fungsi fetch opsi berdasarkan query.
     * Menerima string query, mengembalikan Promise<SearchableOption[]>.
     * Debounce ditangani di dalam komponen.
     */
    fetcher: (query: string) => Promise<SearchableOption[]>
    /** Delay debounce dalam ms. Default: 300 */
    debounceMs?: number
    /** URL halaman untuk menambah data baru (opsional) */
    addNewHref?: string
    /** Label tombol tambah baru. Default: "Tambah Baru" */
    addNewLabel?: string
    /** Required validation */
    required?: boolean
    /** Disabled state */
    disabled?: boolean
    /** Callback saat nilai berubah */
    onChange?: (option: SearchableOption | null) => void
}

// ---------------------------------------------------------------------------
// Hook: useDebounce
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debounced
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchableSelect({
    label,
    placeholder = "Pilih...",
    searchPlaceholder = "Cari...",
    name,
    defaultValue = "",
    defaultLabel = "",
    fetcher,
    debounceMs = 300,
    addNewHref,
    addNewLabel = "Tambah Baru",
    required = false,
    disabled = false,
    onChange,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [options, setOptions] = useState<SearchableOption[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedValue, setSelectedValue] = useState(defaultValue)
    const [selectedLabel, setSelectedLabel] = useState(defaultLabel)

    const containerRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const debouncedQuery = useDebounce(query, debounceMs)

    // Fetch saat debouncedQuery berubah dan popover terbuka
    useEffect(() => {
        if (!open) return
        if (typeof fetcher !== "function") {
            setOptions([])
            setLoading(false)
            return
        }
        let cancelled = false
        setLoading(true)
        fetcher(debouncedQuery)
            .then((results) => {
                if (!cancelled) setOptions(results)
            })
            .catch(() => {
                if (!cancelled) setOptions([])
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [debouncedQuery, open, fetcher])

    // Fokus ke search input saat popover terbuka
    useEffect(() => {
        if (open) {
            setTimeout(() => searchRef.current?.focus(), 50)
        } else {
            setQuery("")
        }
    }, [open])

    // Tutup popover saat klik di luar
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Keyboard: Escape menutup popover
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [])

    const handleSelect = useCallback(
        (option: SearchableOption) => {
            setSelectedValue(option.value)
            setSelectedLabel(option.label)
            setOpen(false)
            onChange?.(option)
        },
        [onChange],
    )

    const handleClear = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation()
            setSelectedValue("")
            setSelectedLabel("")
            onChange?.(null)
        },
        [onChange],
    )

    const isEmpty = !loading && options.length === 0

    return (
        <div className="relative " ref={containerRef}>
            {/* Hidden input untuk form submission */}
            <input type="hidden" name={name} value={selectedValue} />

            {label && (
                <Label className="text-sm font-medium">
                    {label}
                    {required && <span className="ml-0.5 text-destructive">*</span>}
                </Label>
            )}

            {/* Trigger button */}
            <button
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background",
                    "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    open && "ring-2 ring-ring ring-offset-2",
                )}
            >
                <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
                    {selectedLabel || placeholder}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                    {selectedValue && !disabled && (
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Hapus pilihan"
                            onClick={handleClear}
                            onKeyDown={(e) => e.key === "Enter" && handleClear(e as unknown as React.MouseEvent)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            ✕
                        </span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                </div>
            </button>

            {/* Popover dropdown */}
            {open && (
                <div
                    role="listbox"
                    className={cn(
                        "absolute left-0 z-50 mt-1 w-full min-w-[220px] rounded-md border bg-popover shadow-md",
                        "animate-in fade-in-0 zoom-in-95 bg-white",
                    )}
                    style={{
                        // Lebar mengikuti trigger (sama persis)
                        width: containerRef.current?.getBoundingClientRect().width,
                    }}
                >
                    {/* Search input di dalam popover */}
                    <div className="border-b px-2 py-2">
                        <Input
                            ref={searchRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-8 text-sm"
                        />
                    </div>

                    {/* List opsi */}
                    <ul className="max-h-52 overflow-y-auto py-1">
                        {loading && (
                            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Memuat...
                            </li>
                        )}

                        {!loading && isEmpty && (
                            <li className="flex flex-col items-center gap-2 px-3 py-4 text-center">
                                <SearchX className="h-5 w-5 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    {query ? `Tidak ada hasil untuk "${query}"` : "Tidak ada data."}
                                </p>
                                {addNewHref && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-1 h-7 gap-1.5 text-xs"
                                        onClick={() => {
                                            setOpen(false)
                                            window.open(addNewHref, "_blank")
                                        }}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        {addNewLabel}
                                    </Button>
                                )}
                            </li>
                        )}

                        {!loading &&
                            options.map((option) => {
                                const isSelected = option.value === selectedValue
                                return (
                                    <li
                                        key={option.value}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(option)}
                                        className={cn(
                                            "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                                            "hover:bg-accent hover:text-accent-foreground",
                                            isSelected && "bg-accent/60 font-medium",
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate">{option.label}</p>
                                            {option.sublabel && (
                                                <p className="truncate text-xs text-muted-foreground">{option.sublabel}</p>
                                            )}
                                        </div>
                                        {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                                    </li>
                                )
                            })}
                    </ul>

                    {/* Footer: tombol tambah baru (selalu tampil jika addNewHref ada) */}
                    {addNewHref && !isEmpty && (
                        <div className="border-t px-2 py-1.5">
                            <Button
                                type="button"

                                size="sm"
                                className="h-7 w-full justify-start gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    setOpen(false)
                                    window.open(addNewHref, "_blank")
                                }}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {addNewLabel}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
