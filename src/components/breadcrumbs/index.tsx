"use client"

import React, { useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "@components/link"
import Text from "@components/typography/text"
import s from "./style.module.css"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  /**
   * An object where keys are dynamic segment names (e.g., 'id') and values are the desired
   * labels for those segments in the breadcrumbs (e.g., 'Project Title').
   */
  dynamicSegments?: { [key: string]: string }
}

/**
 * Global Breadcrumbs component that dynamically detects its location in the app router stack
 * and builds the breadcrumbs.
 *
 * @param {BreadcrumbsProps} props - The properties for the Breadcrumbs component.
 * @param {Object} [props.dynamicSegments] - An object mapping dynamic segment keys to their display labels.
 * @returns {React.ReactElement} The Breadcrumbs component.
 */
const Breadcrumbs = ({
  dynamicSegments,
}: BreadcrumbsProps): React.ReactElement => {
  const pathname = usePathname()

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    if (!pathname) {
      return [{ label: "Home", href: "/" }]
    }

    const pathSegments = pathname.split("/").filter(Boolean)
    const homeBreadcrumb: BreadcrumbItem = { label: "Home", href: "/" }

    const dynamicBreadcrumbs = pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/")
      const label =
        dynamicSegments && dynamicSegments[segment]
          ? dynamicSegments[segment]
          : segment
              .replace(/-/g, " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")

      return { label, href }
    })

    return [homeBreadcrumb, ...dynamicBreadcrumbs]
  }, [pathname, dynamicSegments])

  return (
    <nav aria-label="Breadcrumbs">
      <ol className={s.breadcrumbsList}>
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.label} className={s.breadcrumbItem}>
            {breadcrumb.href && index < breadcrumbs.length - 1 ? (
              <Link href={breadcrumb.href} className={s.breadcrumbLink}>
                {breadcrumb.label}
              </Link>
            ) : (
              <Text variant="span" className={s.currentBreadcrumb}>
                {breadcrumb.label}
              </Text>
            )}
            {index < breadcrumbs.length - 1 && (
              <span className={s.separator} aria-hidden="true">
                <svg
                  className={`feather-icon ${s.separatorIcon}`}
                  width="18"
                  height="18"
                >
                  <use href="/feather-sprite.svg#chevron-right" />
                </svg>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
