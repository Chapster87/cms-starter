import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import Button from "@/components/button"
import { createClient } from "@/utils/supabase-server"

export const metadata: Metadata = {
  title: "Block Management",
}

export default async function BlocksRedirectPage() {
  const supabase = await createClient()
  const { data: blocks } = await supabase
    .from("blocks")
    .select("id")
    .order("label", { ascending: true })
    .limit(1)

  if (blocks && blocks.length > 0) {
    redirect(`/schema/block/${blocks[0].id}`)
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>No Blocks Found</h1>
      <p style={{ color: "var(--color-grey-500)", marginBottom: "24px" }}>
        Blocks are reusable groups of fields used in Modular Content.
      </p>
      <Link href="/schema/block?action=new-block">
        <Button>Create Your First Block</Button>
      </Link>
    </div>
  )
}
