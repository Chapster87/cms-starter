"use client"

import { usePathname } from "next/navigation"
import * as Tooltip from "@radix-ui/react-tooltip"

import Link from "@components/link"
import Logo from "./_components/logo"
import s from "./style.module.css"

interface NavItem {
  title: string
  url: string
  icon: React.ReactNode
}

const NAV_TOP: NavItem[] = [
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
  {
    title: "Media Library",
    url: "/media",
    icon: (
      <svg className={`feather-icon ${s.navIcon}`} width="24" height="24">
        <use href="/feather-sprite.svg#image" />
      </svg>
    ),
  },
]

const NAV_BOTTOM: NavItem[] = [
  {
    title: "Site Settings",
    url: "/settings",
    icon: (
      <svg className={`feather-icon ${s.navIcon}`} width="24" height="24">
        <use href="/feather-sprite.svg#settings" />
      </svg>
    ),
  },
  {
    title: "GraphQL Playground",
    url: "/graphql",
    icon: (
      <svg className={`feather-icon ${s.navIcon}`} width="24" height="24">
        <use href="/feather-sprite.svg#code" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className={s.nav}>
      <Logo showText={false} />
      <div className={s.navInner}>
        <Tooltip.Provider delayDuration={0}>
          <ul className={s.navList}>
            {NAV_TOP.map((item) => {
              const isActive =
                item.url === "/"
                  ? pathname === item.url
                  : pathname.startsWith(item.url)

              return (
                <li key={item.title}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Link
                        href={item.url}
                        className={`${s.navLink} ${isActive ? s.active : ""}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className={s.navLinkIcon}>{item.icon}</span>
                        <span className={s.navLinkTitle}>{item.title}</span>
                      </Link>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className={`${s.tooltipContent} ${s.brand}`}
                        side="right"
                        sideOffset={4}
                      >
                        {item.title}
                        <Tooltip.Arrow className={s.tooltipArrow} />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </li>
              )
            })}
          </ul>
          <ul className={s.navList}>
            {NAV_BOTTOM.map((item) => {
              const isActive =
                item.url === "/"
                  ? pathname === item.url
                  : pathname.startsWith(item.url)

              return (
                <li key={item.title}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Link
                        href={item.url}
                        className={`${s.navLink} ${isActive ? s.active : ""}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className={s.navLinkIcon}>{item.icon}</span>
                        <span className={s.navLinkTitle}>{item.title}</span>
                      </Link>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className={`${s.tooltipContent} ${s.brand}`}
                        side="right"
                        sideOffset={4}
                      >
                        {item.title}
                        <Tooltip.Arrow className={s.tooltipArrow} />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </li>
              )
            })}
          </ul>
        </Tooltip.Provider>
      </div>
    </nav>
  )
}
