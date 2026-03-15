import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function requireAuth() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return user
}
