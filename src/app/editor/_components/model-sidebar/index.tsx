"use client"

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import clsx from "clsx"
import { ModelRegistryEntry } from "@/hooks/use-models"
import s from "./style.module.css"

interface ModelSidebarProps {
  models: ModelRegistryEntry[]
}

/**
 * Sidebar component for the editor route that lists all available models.
 */
export default function ModelSidebar({ models }: ModelSidebarProps) {
  const params = useParams()
  const currentModelSlug = params?.model as string | undefined

  return (
    <div className={s.sidebarContainer}>
      <div className={s.header}>
        <h2>Content Models</h2>
      </div>
      <div className={s.scrollArea}>
        <nav>
          <ul className={s.modelList}>
            {models.map((model) => {
              const isActive = currentModelSlug === model.slug
              return (
                <li
                  key={model.id}
                  className={clsx(s.modelListItem, isActive && s.active)}
                >
                  <Link href={`/editor/${model.slug}`} className={s.modelLink}>
                    <span className={s.emoji}>
                      {model.emoji || (
                        <svg
                          className={s.fallbackIcon}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ width: "16px", height: "16px" }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}
                    </span>
                    <span className={s.modelName}>{model.friendly_name}</span>
                  </Link>
                </li>
              )
            })}
            {models.length === 0 && (
              <li className={s.modelListItem}>
                <p className={s.placeholder}>No models found.</p>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  )
}
