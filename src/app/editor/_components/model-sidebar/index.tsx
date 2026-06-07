"use client"

import React, { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import clsx from "clsx"
import { ChevronDown, ChevronRight } from "lucide-react"

import { ModelRegistryEntry, ModelGroup } from "@/hooks/use-models"
import { flattenTree } from "@/helpers/tree-helpers"
import {
  buildTree,
  TreeItemModel,
  TreeItemGroup,
  FlattenedTreeItem,
} from "../../../schema/_helpers/model-tree-helpers"

import s from "./style.module.css"

interface ModelSidebarProps {
  models: ModelRegistryEntry[]
  groups: ModelGroup[]
}

/**
 * Sidebar component for the editor route that lists all available models organized by groups.
 */
export default function ModelSidebar({ models, groups }: ModelSidebarProps) {
  const params = useParams()
  const currentModelSlug = params?.model as string | undefined

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())

  const tree = useMemo(() => buildTree(models, groups), [models, groups])

  const flattened = useMemo(() => {
    const allFlat = flattenTree(tree) as FlattenedTreeItem[]
    const visible: typeof allFlat = []

    allFlat.forEach((item: FlattenedTreeItem) => {
      // Check if any ancestor is collapsed
      let isHidden = false
      let currentParentId = item.parentId
      while (currentParentId) {
        if (collapsedIds.has(currentParentId)) {
          isHidden = true
          break
        }
        // Find parent's parent
        const parent = allFlat.find(
          (p: FlattenedTreeItem) => p.id === currentParentId
        )
        currentParentId = parent?.parentId || null
      }

      if (!isHidden) {
        visible.push(item)
      }
    })

    return visible
  }, [tree, collapsedIds])

  const toggleGroup = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  return (
    <div className={s.sidebarContainer}>
      <div className={s.header}>
        <h2>Content Models</h2>
      </div>
      <div className={s.scrollArea}>
        <nav>
          <ul className={s.modelList}>
            {flattened.map((fItem: FlattenedTreeItem) => {
              const isModel = fItem.type === "model"
              const item = fItem
              const isActive =
                isModel && currentModelSlug === (item as TreeItemModel).slug
              const isExpanded = !collapsedIds.has(fItem.id)

              return (
                <li
                  key={fItem.id}
                  className={clsx(
                    s.modelListItem,
                    isActive && s.active,
                    !isModel && s.groupItem
                  )}
                  style={{
                    marginLeft: `${fItem.depth * 24}px`,
                  }}
                  onClick={!isModel ? () => toggleGroup(fItem.id) : undefined}
                >
                  {/* Indentation Guides */}
                  <div className={s.guidesContainer}>
                    {Array.from({ length: fItem.depth }).map((_, i) => (
                      <div
                        key={i}
                        className={s.guidePath}
                        style={{ left: `-${(fItem.depth - i) * 24 + 12}px` }}
                      />
                    ))}
                  </div>

                  {!isModel && (
                    <button
                      type="button"
                      className={s.expandButton}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleGroup(fItem.id)
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                  )}

                  {isModel ? (
                    <Link
                      href={`/editor/${(item as TreeItemModel).slug}`}
                      className={s.modelLink}
                    >
                      <span className={s.emoji}>
                        {item.emoji || (isModel ? "📄" : "📁")}
                      </span>
                      <span className={s.modelName}>
                        {(item as TreeItemModel).friendly_name}
                      </span>
                    </Link>
                  ) : (
                    <div className={s.groupHeader}>
                      <span className={s.emoji}>
                        {item.emoji || (isModel ? "📄" : "📁")}
                      </span>
                      <span className={s.groupName}>
                        {(item as TreeItemGroup).name}
                      </span>
                    </div>
                  )}
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
