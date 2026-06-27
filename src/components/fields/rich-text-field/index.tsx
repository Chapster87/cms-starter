"use client"

import React from "react"
import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import * as Select from "@radix-ui/react-select"
import { Color } from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import Underline from "@tiptap/extension-underline"
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
} from "lucide-react"

import Button from "@/components/button"
import FieldWrapper from "../field-wrapper"

import s from "./style.module.css"

interface RichTextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
  name?: string
  enabledTools?: string[]
  placeholder?: string
}

const MenuBar = ({
  editor,
  enabledTools,
}: {
  editor: Editor | null
  enabledTools?: string[]
}) => {
  const [currentHeading, setCurrentHeading] = React.useState("p")

  React.useEffect(() => {
    if (!editor) return

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

    // Initial check
    updateHeading()

    return () => {
      editor.off("selectionUpdate", updateHeading)
      editor.off("transaction", updateHeading)
    }
  }, [editor])

  if (!editor) return null

  const addLink = () => {
    const url = window.prompt("URL")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt("URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

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
              className={editor.isActive("bold") ? s.isActive : ""}
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
              className={editor.isActive("italic") ? s.isActive : ""}
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
              className={editor.isActive("underline") ? s.isActive : ""}
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
              className={editor.isActive("strike") ? s.isActive : ""}
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
              className={editor.isActive("highlight") ? s.isActive : ""}
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
            className={editor.isActive({ textAlign: "left" }) ? s.isActive : ""}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </Button>
          <Button
            variant="secondary"
            unstyled
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={
              editor.isActive({ textAlign: "center" }) ? s.isActive : ""
            }
            title="Align Center"
          >
            <AlignCenter size={16} />
          </Button>
          <Button
            variant="secondary"
            unstyled
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={
              editor.isActive({ textAlign: "right" }) ? s.isActive : ""
            }
            title="Align Right"
          >
            <AlignRight size={16} />
          </Button>
          <Button
            variant="secondary"
            unstyled
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={
              editor.isActive({ textAlign: "justify" }) ? s.isActive : ""
            }
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
              className={editor.isActive("bulletList") ? s.isActive : ""}
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
              className={editor.isActive("orderedList") ? s.isActive : ""}
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
              className={editor.isActive("blockquote") ? s.isActive : ""}
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
                className={editor.isActive("link") ? s.isActive : ""}
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
              title="Add Image"
            >
              <ImageIcon size={16} />
            </Button>
          )}
          <div className={s.divider} />
        </>
      )}

      {isEnabled("color") && (
        <>
          <div className={s.colorPickerWrapper}>
            <input
              type="color"
              onInput={(event) =>
                editor
                  .chain()
                  .focus()
                  .setColor((event.target as HTMLInputElement).value)
                  .run()
              }
              value={editor.getAttributes("textStyle").color || "#000000"}
              className={s.colorPicker}
              title="Text Color"
            />
          </div>
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
            title="Redo"
          >
            <Redo size={16} />
          </Button>
        </>
      )}
    </div>
  )
}

/**
 * A specialized WYSIWYG editor field using Tiptap.
 */
export default function RichTextField({
  label,
  value,
  onChange,
  description,
  fieldNote,
  required,
  disabled,
  enabledTools,
  placeholder,
}: RichTextFieldProps) {
  const id = React.useId()
  // Trigger re-renders on selection changes to update the toolbar state
  const [, setSelectionUpdate] = React.useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit includes Link by default in some versions,
        // we'll be explicit to avoid duplicates if possible
      }),
      TextStyle,
      Color,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image,
      Highlight.configure({ multicolor: true }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onSelectionUpdate: () => {
      setSelectionUpdate((prev) => prev + 1)
    },
    onTransaction: () => {
      setSelectionUpdate((prev) => prev + 1)
    },
  })

  // Sync content if value changes from outside (e.g. initial load)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      fieldNote={fieldNote}
      required={required}
    >
      <div className={s.editorContainer}>
        <MenuBar editor={editor} enabledTools={enabledTools} />
        <EditorContent editor={editor} className={s.editorContent} />
      </div>
    </FieldWrapper>
  )
}
