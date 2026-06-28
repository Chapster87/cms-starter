"use client"

import React, { useMemo } from "react"
import { usePathname } from "next/navigation"
import { useAtomValue } from "jotai"
import { activeRecordAtom } from "@/client/editor-store"
import { useModels } from "@/hooks/use-models"
import { getRecordDisplayName } from "@/helpers/record-helpers"
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
  hideOnRoot?: boolean
}

/**
 * Global Breadcrumbs component that dynamically detects its location in the app router stack
 * and builds the breadcrumbs.
 *
 * @param {BreadcrumbsProps} props - The properties for the Breadcrumbs component.
 * @param {Object} [props.dynamicSegments] - An object mapping dynamic segment keys to their display labels.
 * @returns {React.ReactElement} The Breadcrumbs component.
 */
export default function Breadcrumbs({
  dynamicSegments,
  hideOnRoot = false,
}: BreadcrumbsProps): React.ReactElement {
  const pathname = usePathname()
  const { models } = useModels()
  const activeRecord = useAtomValue(activeRecordAtom)

  // On a record editor page, the breadcrumb might need to show the display name
  // even before the activeRecordAtom is hydrated (e.g. on hard refresh).
  // We can try to infer it from the document title or meta if available,
  // but better to check if we're on the ID segment and use the same logic.

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    if (!pathname) {
      return [{ label: "Dashboard", href: "/" }]
    }

    const pathSegments = pathname.split("/").filter(Boolean)
    const homeBreadcrumb: BreadcrumbItem = { label: "Dashboard", href: "/" }

    const dynamicBreadcrumbs = pathSegments
      .map((segment, index) => {
        const href = "/" + pathSegments.slice(0, index + 1).join("/")

        // Check if this segment is a model slug
        const model = models.find((m) => m.slug === segment)

        // If previous segment was a singleton model, we might want to skip this segment (the ID)
        const prevSegment = index > 0 ? pathSegments[index - 1] : null
        const prevModel = prevSegment
          ? models.find((m) => m.slug === prevSegment)
          : null

        if (prevModel?.is_singleton) {
          return null // Skip the ID segment for singletons
        }

        let label =
          dynamicSegments && dynamicSegments[segment]
            ? dynamicSegments[segment]
            : model
              ? model.friendly_name
              : segment
                  .replace(/-/g, " ")
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")

        // If this is an editor path and we're at the ID segment, try to use the active record's display name
        if (pathSegments[0] === "editor" && index === 2 && prevModel) {
          if (activeRecord) {
            label = getRecordDisplayName(
              activeRecord,
              prevModel.friendly_name,
              prevModel.is_singleton,
              prevModel.list_columns
            )
          } else if (typeof document !== "undefined" && document.title) {
            // Fallback: Use page title minus "Edit " prefix if atom not yet hydrated
            const title = document.title.split(" | ")[0]
            if (title.startsWith("Edit ")) {
              label = title.replace("Edit ", "")
            } else if (title !== prevModel.friendly_name) {
              label = title
            }
          }
        }

        const item: BreadcrumbItem = { label, href }
        return item
      })
      .filter((crumb): crumb is BreadcrumbItem => crumb !== null)

    return [homeBreadcrumb, ...dynamicBreadcrumbs]
  }, [pathname, dynamicSegments, models])

  if (hideOnRoot && pathname === "/") {
    return <></>
  }

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
