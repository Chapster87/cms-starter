import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Media Library",
}

export default function MediaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
