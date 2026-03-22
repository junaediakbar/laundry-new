import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { authCookieName, verifySession } from "@/lib/auth-session"

export default async function HomePage() {
  const token = cookies().get(authCookieName())?.value
  const session = verifySession(token)
  redirect(session ? "/dashboard" : "/login")
}
