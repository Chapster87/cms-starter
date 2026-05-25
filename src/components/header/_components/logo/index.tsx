import Link from "next/link"
import SiteLogo from "@svg/logo"
import s from "./styles.module.css"

export default function Logo({ showText = true }) {
  return (
    <>
      <Link href="/" className={s.navbarBrand}>
        <SiteLogo />
        {showText && <p className={s.logoText}>Logo</p>}
      </Link>
    </>
  )
}
