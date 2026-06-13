"use client"

import React from "react"
import Link from "next/link"
import s from "./style.module.css"

/**
 * Renders the Settings Dashboard.
 */
export default function SettingsDashboard() {
  return (
    <div className={s.container}>
      <header className={s.header}>
        <h1 className={s.title}>Site Settings</h1>
        <p className={s.subtitle}>
          Manage your CMS configuration, users, and global site preferences.
        </p>
      </header>

      <div className={s.grid}>
        <Link href="/settings/users" className={s.card}>
          <h3>User Management</h3>
          <p>Create and manage CMS users, assign roles, and control access.</p>
        </Link>
        <div className={s.card}>
          <h3>Audit Logs</h3>
          <p>
            (Coming Soon) Track changes across your content and schema registry.
          </p>
        </div>
        <div className={s.card}>
          <h3>Global Config</h3>
          <p>(Coming Soon) Manage site-wide variables and API settings.</p>
        </div>
      </div>
    </div>
  )
}
