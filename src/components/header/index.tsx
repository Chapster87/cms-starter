import Link from "@components/link"
import AuthStatus from "./_components/auth-status"
import Logo from "./_components/logo"

import s from "./styles.module.css"

interface NavItem {
  title: string
  url: string
  icon: React.ReactNode
}

const NAV: NavItem[] = [
  {
    title: "Content",
    url: "/editor",
    icon: (
      <svg className={`feather-icon ${s.navIcon}`} width="16" height="16">
        <use href="/feather-sprite.svg#edit" />
      </svg>
    ),
  },
  {
    title: "Schema",
    url: "/schema",
    icon: (
      <svg className={`feather-icon ${s.navIcon}`} width="16" height="16">
        <use href="/feather-sprite.svg#layers" />
      </svg>
    ),
  },
]

export default function Header() {
  return (
    <>
      {/* <div className={s.headerBanner}>
        <div>
          <svg
            className={`feather-icon ${s.bannerIcon}`}
            width="16"
            height="16"
          >
            <use href="../feather-sprite.svg#cpu" />
          </svg>
        </div>
        <Text className={s.bannerText}>Top Banner!</Text>
        <Link href="/temp" className={s.bannerLink}>
          Temp page Link
        </Link>
      </div> */}
      <header className={s.header}>
        <div className={s.headerMain}>
          <Logo />
          <AuthStatus />
        </div>
        <div className={s.headerSub}>
          <nav className={s.nav}>
            <ul className={s.navList}>
              {NAV.map((item) => (
                <li key={item.title}>
                  <Link href={item.url} className={s.navLink}>
                    {item.icon}
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  )
}
