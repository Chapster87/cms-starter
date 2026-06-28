import type { Metadata } from "next"
import { Inter, Merriweather_Sans } from "next/font/google"
import Navigation from "@/components/navigation"
import Header from "@/components/header"
import BreakpointIndicator from "@components/breakpoint-indicator"
import { ToastContainer } from "@/components/toast"

import "@styles/globals.css"
import s from "./styles.module.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})
const merriweatherSans = Merriweather_Sans({
  variable: "--font-merriweather-sans",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
})

export const metadata: Metadata = {
  title: {
    default: "Forge CMS",
    template: "%s | Forge CMS",
  },
  description: "Custom CMS developed by: Andy Chapman",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${merriweatherSans.variable}`}
      data-scroll-behavior="smooth"
    >
      <body data-theme="light">
        <div className={s.site}>
          <BreakpointIndicator />
          <Navigation />
          <div className={s.primary}>
            <Header />
            <main className={s.content}>{children}</main>
          </div>
          <ToastContainer />
        </div>
      </body>
    </html>
  )
}
