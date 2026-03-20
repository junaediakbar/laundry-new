import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase-server"

type Body = {
  files?: Array<{
    filePath: string
    mimeType?: string | null
    sizeBytes?: number | null
  }>
}

function isCuid(value: string) {
  return /^c[^\s]{8,}$/i.test(value)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const orderId = params.id
  if (!isCuid(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Body | null
  const files = Array.isArray(body?.files) ? body?.files ?? [] : []

  const cleaned = files
    .map((f) => ({
      filePath: typeof f.filePath === "string" ? f.filePath.trim() : "",
      mimeType: typeof f.mimeType === "string" ? f.mimeType : null,
      sizeBytes: typeof f.sizeBytes === "number" ? f.sizeBytes : null,
    }))
    .filter((f) => f.filePath.length > 0)

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 })
  }

  const prismaOrder = prisma as unknown as {
    order: {
      findUnique(args: unknown): Promise<{ id: string } | null>
    }
    orderAttachment: {
      createMany(args: unknown): Promise<unknown>
    }
  }

  const order = await prismaOrder.order.findUnique({ where: { id: orderId }, select: { id: true } })
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  await prismaOrder.orderAttachment.createMany({
    data: cleaned.map((f) => ({
      orderId,
      filePath: f.filePath,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
    })),
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}

