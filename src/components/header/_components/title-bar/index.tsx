"use client"

import { usePathname } from "next/navigation"
import clsx from "clsx"
import Heading from "@components/typography/heading"
import Breadcrumbs from "@components/breadcrumbs"
import s from "./style.module.css"

type TitleBarProps = {
  className?: string
}

export default function TitleBar({ className = "" }: TitleBarProps) {
  const pathname = usePathname()

  console.log("Current pathname:", pathname)
  const lastSegment = pathname
    ? pathname.split("/").filter(Boolean).slice(-1)[0]
    : null
  const pageTitle = lastSegment
    ? lastSegment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "Dashboard"

  return (
    <div className={clsx(s.titleBar, className)}>
      <Heading level="h1" display="h5" className={s.pageTitle}>
        {pageTitle}
      </Heading>
      <Breadcrumbs hideOnRoot />
    </div>
  )
}
