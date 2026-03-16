import { PageHeader } from "@/components/shared/page-header"
import { PlanBuilder } from "@/components/delivery-planning/plan-builder"
import { prisma } from "@/lib/prisma"

export default async function NewDeliveryPlanPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const error = searchParams?.error

  const prismaCustomer = prisma as unknown as {
    customer: {
      findMany(args: unknown): Promise<
        Array<{
          id: string
          name: string
          address: string | null
          latitude: { toString(): string } | number | null
          longitude: { toString(): string } | number | null
        }>
      >
    }
  }

  const customers = await prismaCustomer.customer.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, address: true, latitude: true, longitude: true },
  })

  const options = customers.map((c) => ({
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
