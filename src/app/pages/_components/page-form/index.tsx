import React, { useState } from "react"
import s from "./style.module.css"
import { Page } from "@customTypes/page"
import * as Label from "@radix-ui/react-label"

/**
 * Props for the PageForm component.
 * @typedef {object} PageFormProps
 * @property {Page | null} [initialData] - Initial page data for editing. Null for creating a new page.
 * @property {(page: Page) => void} onSubmit - Callback function when the form is submitted.
 * @property {() => void} onCancel - Callback function when the form is cancelled.
 */
interface PageFormProps {
  initialData?: Page | null
  onSubmit: (page: Omit<Page, "id" | "created_at" | "updated_at">) => void
  onCancel: () => void
}

/**
 * Renders a form for creating or editing a page.
 * @param {PageFormProps} props - The component props.
 */
export default function PageForm({
  initialData,
  onSubmit,
  onCancel,
}: PageFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [slug, setSlug] = useState(initialData?.slug ?? "")
  const [content, setContent] = useState(initialData?.content ?? "")

  /**
   * Handles the form submission.
   * @param {React.FormEvent} event - The form submission event.
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // Basic validation
    if (!title || !slug) {
      alert("Title and Slug are required.")
      return
    }
    onSubmit({ title, slug, content })
  }

  return (
    <form className={s.pageForm} onSubmit={handleSubmit}>
      <h2>{initialData ? "Edit Page" : "Create New Page"}</h2>
      <div className={s.formGroup}>
        <Label.Root className={s.label} htmlFor="title">
          Title:
        </Label.Root>
        <input
          className={s.input}
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className={s.formGroup}>
        <Label.Root className={s.label} htmlFor="slug">
          Slug:
        </Label.Root>
        <input
          className={s.input}
          type="text"
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
      </div>
      <div className={s.formGroup}>
        <Label.Root className={s.label} htmlFor="content">
          Content:
        </Label.Root>
        <textarea
          className={s.input}
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
        />
      </div>
      <div className={s.formActions}>
        <button type="submit" className={s.submitButton}>
          {initialData ? "Update Page" : "Create Page"}
        </button>
        <button type="button" onClick={onCancel} className={s.cancelButton}>
          Cancel
        </button>
      </div>
    </form>
  )
}
