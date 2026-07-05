import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Site Configuration",
}

export default function SiteSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
