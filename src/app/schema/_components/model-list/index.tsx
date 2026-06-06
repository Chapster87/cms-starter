"use client"

import { useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

import Button from "@/components/button"
import { useModels, ModelRegistryEntry } from "@/hooks/use-models"
import ContextMenu from "@/components/context-menu"
import SvgIcon from "@/components/svg-icon"
import { Edit2, ExternalLink, Copy, Trash2 } from "lucide-react"
import clsx from "clsx"
import s from "./style.module.css"

interface ModelListProps {
  models: ModelRegistryEntry[]
}

/**
 * Renders a list of models (Supabase tables).
 * @param {ModelListProps} props - The component props.
 */
export default function ModelList({ models }: ModelListProps) {
  const { deleteModel } = useModels()
  const params = useParams()
  const activeModelSlug = params?.model as string | undefined

  const handleDeleteModel = useCallback(
    async (modelName: string) => {
      if (
        !window.confirm(
          `Are you sure you want to delete the model '${modelName}' and all its records?`
        )
      ) {
        return
      }

      try {
        await deleteModel(modelName)
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete model."
        alert(`Error: ${errorMessage}`)
      }
    },
    [deleteModel]
  )

  return (
    <div className={s.modelListContainer}>
      {models.length === 0 ? (
        <p>No models found. Create a new one!</p>
      ) : (
        <ul className={s.modelList}>
          {models.map((model) => (
            <li
              key={model.id}
              className={clsx(
                s.modelListItem,
                activeModelSlug === model.slug && s.active
              )}
            >
              <div>
                <Link href={`/schema/${model.slug}`} className={s.modelLink}>
                  <div className={s.modelName}>
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
                    <span>{model.friendly_name}</span>
                  </div>
                  <code className={s.modelSlug}>{model.slug}</code>
                </Link>

                {model.is_singleton && (
                  <span className={s.singletonBadge}>Singleton</span>
                )}
              </div>

              <div className={s.actions}>
                <ContextMenu>
                  <ContextMenu.Trigger className={s.menuTrigger}>
                    <Button
                      variant="secondary"
                      unstyled
                      type="button"
                      aria-label="More options"
                    >
                      <SvgIcon icon="more-vertical" size={20} />
                    </Button>
                  </ContextMenu.Trigger>

                  <ContextMenu.Content>
                    <ContextMenu.Link
                      href={`?action=edit-model&modelSlug=${model.slug}`}
                      icon={<Edit2 size={14} />}
                    >
                      Edit
                    </ContextMenu.Link>
                    <ContextMenu.Link
                      href={`/editor/${model.slug}`}
                      icon={<ExternalLink size={14} />}
                    >
                      {model.is_singleton ? "Edit Content" : "View Records"}
                    </ContextMenu.Link>
                    <ContextMenu.Link
                      href={`?action=duplicate-model&modelSlug=${model.slug}`}
                      icon={<Copy size={14} />}
                    >
                      Duplicate
                    </ContextMenu.Link>
                    <ContextMenu.Item
                      onSelect={() => handleDeleteModel(model.table_name)}
                      variant="danger"
                      icon={<Trash2 size={14} />}
                    >
                      Delete
                    </ContextMenu.Item>
                  </ContextMenu.Content>
                </ContextMenu>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className={s.footer}>
        <Link href="?action=new-model">
          <Button beforeText="+">Create New Model</Button>
        </Link>
      </div>
    </div>
  )
}
