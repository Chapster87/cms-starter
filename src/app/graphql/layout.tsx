import { Metadata } from "next"

export const metadata: Metadata = {
  title: "GraphQL Playground",
}

export default function GraphQLLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
