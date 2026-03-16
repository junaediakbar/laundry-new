import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { previewOrderWhatsAppNotification, type WhatsAppEventKey } from "@/lib/whatsapp-notifications"

type Body = {
  orderId?: string
  eventKey?: WhatsAppEventKey
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function isAdminEmail(email: string | undefined | null) {
  if (!email) return false

  const allowlist = process.env.WHATSAPP_ADMIN_EMAILS?.split(",").map((e) => e.trim()).filter(Boolean) ?? []
  if (allowlist.length > 0) {
    return allowlist.includes(email)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return false

  return user.role === "owner" || user.role === "admin"
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const allowed = await isAdminEmail(user.email)
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as Body | null
  const orderId = typeof body?.orderId === "string" ? body.orderId : ""
  const eventKey = typeof body?.eventKey === "string" ? (body.eventKey as WhatsAppEventKey) : null

  const allowedEvents: WhatsAppEventKey[] = ["invoice_created", "shipping_soon", "pickup_ready"]
  if (!isUuid(orderId) || !eventKey || !allowedEvents.includes(eventKey)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  try {
    const result = await previewOrderWhatsAppNotification({ orderId, eventKey })
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Preview failed", message }, { status: 500 })
  }
}

