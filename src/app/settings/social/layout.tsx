import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Social Media Settings",
}

export default function SocialSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
