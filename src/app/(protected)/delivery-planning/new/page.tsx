import { PageHeader } from "@/components/shared/page-header"
import { PlanBuilder } from "@/components/delivery-planning/plan-builder"
import { backendFetch } from "@/lib/backend"

export default async function NewDeliveryPlanPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const error = searchParams?.error

  const customers = await backendFetch<{
    items: Array<{
      id: string
      name: string
      address: string | null
      latitude: number | null
      longitude: number | null
    }>
  }>(`/api/v1/customers?page=1&pageSize=500&q=`).catch(() => ({ items: [] }))

  const options = customers.items
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      latitude: Number(c.latitude),
      longitude: Number(c.longitude),
    }))

  return (
    <div>
      <PageHeader title="Perencanaan Pengiriman" description="Pilih lokasi pengiriman dan dapatkan urutan rute." />
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      <PlanBuilder customers={options} />
    </div>
  )
}
