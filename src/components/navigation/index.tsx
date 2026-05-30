"use client"

import { usePathname } from "next/navigation"

import Link from "@components/link"
import Logo from "./_components/logo"
import s from "./style.module.css"

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
      <svg className={`feather-icon ${s.navIcon}`} width="24" height="24">
        <use href="/feather-sprite.svg#edit" />
      </svg>
    ),
  },
  {
    title: "Schema",
    url: "/schema",
    icon: (
      <svg className={`feather-icon ${s.navIcon}`} width="24" height="24">
        <use href="/feather-sprite.svg#layers" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className={s.nav}>
      <Logo showText={false} />
      <ul className={s.navList}>
        {NAV.map((item) => {
          const isActive =
            item.url === "/"
              ? pathname === item.url
              : pathname.startsWith(item.url)

          return (
            <li key={item.title}>
              <Link
                href={item.url}
                className={`${s.navLink} ${isActive ? s.active : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={s.navLinkIcon}>{item.icon}</span>
                <span className={s.navLinkTitle}>{item.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
