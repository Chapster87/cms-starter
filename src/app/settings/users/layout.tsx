import { Metadata } from "next"

export const metadata: Metadata = {
  title: "User Management",
}

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
