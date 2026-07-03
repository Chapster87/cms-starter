"use client"

import React, { useState, useEffect } from "react"
import { clsx } from "clsx"
import { Editor } from "@tiptap/react"
import * as Select from "@radix-ui/react-select"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
  Plus,
} from "lucide-react"

import Button from "@/components/button"

import s from "./style.module.css"

interface MenuBarProps {
  editor: Editor | null
  enabledTools?: string[]
  onAddBlock: () => void
}

/**
 * Toolbar component for the Structured Text Editor
 * @param props MenuBarProps
 * @returns React.JSX.Element | null
 */
export default function MenuBar({
  editor,
  enabledTools,
  onAddBlock,
}: MenuBarProps) {
  const [currentHeading, setCurrentHeading] = useState("p")

  useEffect(() => {
    if (!editor) return

    /**
     * Update the current heading state based on editor selection
     */
    const updateHeading = () => {
      if (editor.isActive("heading", { level: 1 })) setCurrentHeading("1")
      else if (editor.isActive("heading", { level: 2 })) setCurrentHeading("2")
      else if (editor.isActive("heading", { level: 3 })) setCurrentHeading("3")
      else if (editor.isActive("heading", { level: 4 })) setCurrentHeading("4")
      else if (editor.isActive("heading", { level: 5 })) setCurrentHeading("5")
      else if (editor.isActive("heading", { level: 6 })) setCurrentHeading("6")
      else setCurrentHeading("p")
    }

    editor.on("selectionUpdate", updateHeading)
    editor.on("transaction", updateHeading)

    updateHeading()

    return () => {
      editor.off("selectionUpdate", updateHeading)
      editor.off("transaction", updateHeading)
    }
  }, [editor])

  if (!editor) return null

  /**
   * Prompt user for URL and set link in editor
   */
  const addLink = () => {
    const url = window.prompt("URL")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  /**
   * Prompt user for URL and set image in editor
   */
  const addImage = () => {
    const url = window.prompt("URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  /**
   * Set heading level or paragraph in editor
   * @param level heading level or 'p'
   */
  const setHeading = (level: string) => {
    if (level === "p") {
      editor.chain().focus().setParagraph().run()
    } else {
      const l = parseInt(level) as 1 | 2 | 3 | 4 | 5 | 6
      editor.chain().focus().toggleHeading({ level: l }).run()
    }
  }

  const headingOptions = [
    { value: "p", label: "Normal Text", className: s.optionP },
    { value: "1", label: "Heading 1", className: s.optionH1 },
    { value: "2", label: "Heading 2", className: s.optionH2 },
    { value: "3", label: "Heading 3", className: s.optionH3 },
    { value: "4", label: "Heading 4", className: s.optionH4 },
    { value: "5", label: "Heading 5", className: s.optionH5 },
    { value: "6", label: "Heading 6", className: s.optionH6 },
  ]

  const activeOption = headingOptions.find(
    (opt) => opt.value === currentHeading
  )

  /**
   * Check if a tool is enabled
   * @param toolId tool ID
   * @returns boolean
   */
  const isEnabled = (toolId: string) =>
    !enabledTools || enabledTools.includes(toolId)

  return (
    <div className={s.menuBar}>
      {isEnabled("headings") && (
        <>
          <Select.Root value={currentHeading} onValueChange={setHeading}>
            <Select.Trigger className={s.selectTrigger}>
              <Select.Value>
                <span className={activeOption?.className}>
                  {activeOption?.label}
                </span>
              </Select.Value>
              <Select.Icon className={s.selectIcon}>
                <ChevronDown size={14} />
              </Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content
                className={s.selectContent}
                position="popper"
                sideOffset={4}
              >
                <Select.Viewport className={s.selectViewport}>
                  {headingOptions.map((opt) => (
                    <Select.Item
                      key={opt.value}
                      value={opt.value}
                      className={s.selectItem}
                    >
                      <Select.ItemText>
                        <span className={opt.className}>{opt.label}</span>
                      </Select.ItemText>
                      <Select.ItemIndicator className={s.selectItemIndicator}>
                        <Check size={14} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          <div className={s.divider} />
        </>
      )}

      <Button
        variant="secondary"
        unstyled
        type="button"
        onClick={onAddBlock}
        title="Insert Block"
        className={s.actionBtn}
      >
        <Plus size={16} />
      </Button>
      <div className={s.divider} />

      {(isEnabled("bold") ||
        isEnabled("italic") ||
        isEnabled("underline") ||
        isEnabled("strike") ||
        isEnabled("highlight")) && (
        <>
          {isEnabled("bold") && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={clsx(
                s.actionBtn,
                editor.isActive("bold") && s.isActive
              )}
              title="Bold"
            >
              <Bold size={16} />
            </Button>
          )}
          {isEnabled("italic") && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={clsx(
                s.actionBtn,
                editor.isActive("italic") && s.isActive
              )}
              title="Italic"
            >
              <Italic size={16} />
            </Button>
          )}
          {isEnabled("underline") && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={clsx(
                s.actionBtn,
                editor.isActive("underline") && s.isActive
              )}
              title="Underline"
            >
              <UnderlineIcon size={16} />
            </Button>
          )}
          {isEnabled("strike") && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={clsx(
                s.actionBtn,
                editor.isActive("strike") && s.isActive
              )}
              title="Strikethrough"
            >
              <Strikethrough size={16} />
            </Button>
          )}
          {isEnabled("highlight") && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={clsx(
                s.actionBtn,
                editor.isActive("highlight") && s.isActive
              )}
              title="Highlight"
            >
              <Highlighter size={16} />
            </Button>
          )}
          <div className={s.divider} />
        </>
      )}

      {isEnabled("align") && (
        <>
          <Button
            variant="secondary"
            unstyled
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={clsx(
              s.actionBtn,
              editor.isActive({ textAlign: "left" }) && s.isActive
            )}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </Button>
          <Button
            variant="secondary"
            unstyled
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={clsx(
              s.actionBtn,
              editor.isActive({ textAlign: "center" }) && s.isActive
            )}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </Button>
          <Button
            variant="secondary"
            unstyled
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={clsx(
              s.actionBtn,
              editor.isActive({ textAlign: "right" }) && s.isActive
            )}
            title="Align Right"
          >
            <AlignRight size={16} />
          </Button>
          <Button
            variant="secondary"
            unstyled
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={clsx(
              s.actionBtn,
              editor.isActive({ textAlign: "justify" }) && s.isActive
            )}
            title="Align Justify"
          >
            <AlignJustify size={16} />
          </Button>
          <div className={s.divider} />
        </>
      )}

      {(isEnabled("list_bullet") ||
        isEnabled("list_ordered") ||
        isEnabled("blockquote") ||
        isEnabled("hr")) && (
        <>
          {isEnabled("list_bullet") && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={clsx(
                s.actionBtn,
                editor.isActive("bulletList") && s.isActive
              )}
              title="Bullet List"
            >
              <List size={16} />
            </Button>
          )}
          {isEnabled("list_ordered") && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={clsx(
                s.actionBtn,
                editor.isActive("orderedList") && s.isActive
              )}
              title="Ordered List"
            >
              <ListOrdered size={16} />
            </Button>
          )}
          {isEnabled("blockquote") && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={clsx(
                s.actionBtn,
                editor.isActive("blockquote") && s.isActive
              )}
              title="Blockquote"
            >
              <Quote size={16} />
            </Button>
          )}
          {isEnabled("hr") && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className={s.actionBtn}
              title="Horizontal Rule"
            >
              <Minus size={16} />
            </Button>
          )}
          <div className={s.divider} />
        </>
      )}

      {(isEnabled("link") || isEnabled("image")) && (
        <>
          {isEnabled("link") && (
            <>
              <Button
                variant="secondary"
                unstyled
                type="button"
                onClick={addLink}
                className={clsx(
                  s.actionBtn,
                  editor.isActive("link") && s.isActive
                )}
                title="Add Link"
              >
                <LinkIcon size={16} />
              </Button>
              <Button
                variant="secondary"
                unstyled
                type="button"
                onClick={() => editor.chain().focus().unsetLink().run()}
                disabled={!editor.isActive("link")}
                className={s.actionBtn}
                title="Remove Link"
              >
                <Link2Off size={16} />
              </Button>
            </>
          )}
          {isEnabled("image") && (
            <Button
              variant="secondary"
              unstyled
              type="button"
              onClick={addImage}
              className={s.actionBtn}
              title="Add Image"
            >
              <ImageIcon size={16} />
            </Button>
          )}
          <div className={s.divider} />
        </>
      )}

      {isEnabled("history") && (
        <>
          <Button
            variant="secondary"
            unstyled
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className={s.actionBtn}
            title="Undo"
          >
            <Undo size={16} />
          </Button>
          <Button
            variant="secondary"
            unstyled
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className={s.actionBtn}
            title="Redo"
          >
            <Redo size={16} />
          </Button>
        </>
      )}
    </div>
  )
}
