import React from "react"
import Link from "next/link"
import s from "./style.module.css"

interface ModelRegistryEntry {
  id: string
  table_name: string
  slug: string
  friendly_name: string
  group_name?: string
  is_singleton: boolean
  display_order: number
}

interface ModelListProps {
  models: ModelRegistryEntry[]
  onDelete: (modelName: string) => Promise<void>
}

/**
 * Renders a list of models (Supabase tables).
 * @param {ModelListProps} props - The component props.
 */
export default function ModelList({ models, onDelete }: ModelListProps) {
  return (
    <div className={s.pageListContainer}>
      <h2>Existing Models</h2>
      {models.length === 0 ? (
        <p>No models found. Create a new one!</p>
      ) : (
        <ul className={s.pageList}>
          {models.map((model) => (
            <li key={model.id} className={s.pageListItem}>
              <div>
                <strong>{model.friendly_name}</strong>
                <code style={{ marginLeft: "8px", fontSize: "0.8em" }}>
                  ({model.slug})
                </code>
                {model.is_singleton && (
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "0.7em",
                      background: "#eee",
                      padding: "2px 4px",
                      borderRadius: "4px",
                    }}
                  >
                    Singleton
                  </span>
                )}
              </div>
              <div className={s.actions}>
                <Link href={`/schema/${model.slug}`}>
                  <button type="button" className={s.settingsButton}>
                    Fields & Settings
                  </button>
                </Link>
                <Link href={`/editor/${model.slug}`}>
                  <button type="button" className={s.editButton}>
                    {model.is_singleton ? "Edit Content" : "View Records"}
                  </button>
                </Link>
                <button
                  onClick={() => onDelete(model.table_name)}
                  className={s.deleteButton}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
