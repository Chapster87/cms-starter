"use client"

import React from "react"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import Link from "@/components/link"
import s from "./style.module.css"

/**
 * Sidebar for the Settings section.
 */
function SettingsSidebar() {
  const pathname = usePathname()
  const settingsLinks = [
    {
      title: "Dashboard",
      url: "/settings",
      exact: true,
      icon: (
        <svg className="feather-icon" width="18" height="18">
          <use href="/feather-sprite.svg#pie-chart" />
        </svg>
      ),
    },
    {
      title: "Users",
      url: "/settings/users",
      icon: (
        <svg className="feather-icon" width="18" height="18">
          <use href="/feather-sprite.svg#users" />
        </svg>
      ),
    },
    // Future settings pages can be added here
  ]

  return (
    <div className={s.sidebarInner}>
      <div className={s.sidebarHeader}>
        <h2 className={s.sidebarTitle}>Settings</h2>
      </div>
      <nav className={s.sidebarNav}>
        <ul className={s.sidebarList}>
          {settingsLinks.map((link) => {
            const isActive = link.exact
              ? pathname === link.url
              : pathname.startsWith(link.url)
            return (
              <li key={link.url}>
                <Link
                  href={link.url}
                  className={clsx(s.sidebarLink, { [s.active]: isActive })}
                >
                  <span className={s.sidebarIcon}>{link.icon}</span>
                  <span>{link.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

/**
 * Layout for the settings section.
 */
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={s.settingsContainer}>
      <aside className={s.sidebar}>
        <SettingsSidebar />
      </aside>
      <main className={s.mainContent}>{children}</main>
    </div>
  )
}
