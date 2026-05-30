import Link from "next/link"
import SiteLogo from "@svg/logo"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import s from "./styles.module.css"

export default function Logo({ showText = true }) {
  return (
    <>
      <Link href="/" className={s.navbarBrand}>
        <SiteLogo />
        {showText ? (
          <p className={s.logoText}>Custom CMS</p>
        ) : (
          <VisuallyHidden>Custom CMS</VisuallyHidden>
        )}
      </Link>
    </>
  )
}
