"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { useEditor, EditorContent, JSONContent } from "@tiptap/react"
import * as Tabs from "@radix-ui/react-tabs"

import FieldWrapper from "../field-wrapper"
import StructuredTextRenderer from "@/components/structured-text-renderer"
import BlockSelectorModal from "../modular-content-field/_components/block-selector-modal"
import MenuBar from "./_components/menu-bar"
import { getExtensions } from "./_helpers/setup"
import { useBlockManagement } from "./_hooks/use-block-management"

import s from "./style.module.css"

interface StructuredTextFieldProps {
  label: string
  value: JSONContent | string
  onChange: (value: JSONContent) => void
  description?: string
  fieldNote?: string
  required?: boolean
  disabled?: boolean
  name?: string
  enabledTools?: string[]
  placeholder?: string
  allowedBlocks?: string[]
}

/**
 * A ProseMirror-based structured text field that allows interleaving blocks.
 * @param props StructuredTextFieldProps
 * @returns React.JSX.Element
 */
export default function StructuredTextField({
  label,
  value,
  onChange,
  description,
  fieldNote,
  required,
  disabled,
  enabledTools,
  placeholder,
  allowedBlocks,
}: StructuredTextFieldProps) {
  const id = React.useId()
  const [activeTab, setActiveTab] = useState("write")
  const isInternalUpdate = useRef(false)

  /**
   * Parse the value into a Tiptap-compatible JSON object
   */
  const parsedValue = useMemo(() => {
    if (!value) return null
    if (typeof value === "object") return value
    try {
      return JSON.parse(value)
    } catch (_e) {
      return null
    }
  }, [value])

  const editor = useEditor({
    extensions: getExtensions(),
    content: parsedValue,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true
      onChange(editor.getJSON())
    },
  })

  const { isModalOpen, setIsModalOpen, availableBlocks, handleAddBlock } =
    useBlockManagement(editor, allowedBlocks)

  /**
   * Sync external value changes to the editor
   */
  useEffect(() => {
    if (editor && parsedValue) {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false
        return
      }

      const currentJSON = JSON.stringify(editor.getJSON())
      const nextJSON = JSON.stringify(parsedValue)

      if (currentJSON !== nextJSON) {
        // Defer setContent to avoid "flushSync was called from inside a lifecycle method"
        // and ensure we're outside the React render/commit phase.
        const timeoutId = setTimeout(() => {
          editor.commands.setContent(parsedValue)
        }, 0)
        return () => clearTimeout(timeoutId)
      }
    }
  }, [parsedValue, editor])

  return (
    <FieldWrapper
      id={id}
      label={label}
      description={description}
      fieldNote={fieldNote}
      required={required}
    >
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className={s.tabsRoot}
      >
        <Tabs.List className={s.tabsList}>
          <Tabs.Trigger value="write" className={s.tabsTrigger}>
            Write
          </Tabs.Trigger>
          <Tabs.Trigger value="preview" className={s.tabsTrigger}>
            Preview
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="write" className={s.tabsContent}>
          <div className={s.editorContainer}>
            <MenuBar
              editor={editor}
              enabledTools={enabledTools}
              onAddBlock={() => setIsModalOpen(true)}
            />
            <EditorContent
              editor={editor}
              className={s.editorContent}
              placeholder={placeholder}
            />
          </div>
        </Tabs.Content>

        <Tabs.Content value="preview" className={s.tabsContent}>
          <div className={s.previewArea}>
            {value ? (
              <StructuredTextRenderer content={value} />
            ) : (
              <div className={s.empty}>Nothing to preview</div>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <BlockSelectorModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        blocks={availableBlocks}
        onSelect={handleAddBlock}
      />
    </FieldWrapper>
  )
}
