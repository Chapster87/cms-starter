import Heading from "@/components/typography/heading"
import Text from "@/components/typography/text"

import s from "./styles.module.css"

export default function TempPage() {
  return (
    <div className={s.page}>
      <div className={s.pageSection}>
        <Heading level="h1">Example</Heading>
        <Text>
          A minimal starter for Next.js with TypeScript, and my custom
          components.
        </Text>
      </div>
    </div>
  )
}
