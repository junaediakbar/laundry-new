import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import { ToastProvider } from "@/components/providers/toast-provider"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Laundry Record Management",
  description: "Aplikasi manajemen laundry",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
}

/** Supports portrait & landscape; safe-area on notched devices. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#ccfbf1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="h-full">
      <body className={`${inter.className} min-h-[100dvh] min-h-screen`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
