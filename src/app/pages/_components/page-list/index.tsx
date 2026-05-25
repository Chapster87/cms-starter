import React from "react"
import { Page } from "@customTypes/page"
import s from "./style.module.css"

interface PageListProps {
  pages: Page[]
  onEdit: (page: Page) => void
  onDelete: (id: string) => Promise<void>
}

/**
 * Renders a list of pages.
 * @param {PageListProps} props - The component props.
 */
export default function PageList({ pages, onEdit, onDelete }: PageListProps) {
  return (
    <div className={s.pageListContainer}>
      <h2>Existing Pages</h2>
      {pages.length === 0 ? (
        <p>No pages found. Create a new one!</p>
      ) : (
        <ul className={s.pageList}>
          {pages.map((page) => (
            <li key={page.id} className={s.pageListItem}>
              <span>
                {page.title} (Slug: /{page.slug})
              </span>
              <div className={s.actions}>
                <button onClick={() => onEdit(page)} className={s.editButton}>
                  Edit
                </button>
                <button
                  onClick={() => onDelete(page.id)}
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
