import React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { clsx } from "clsx"
import s from "./style.module.css"

interface ModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  trigger?: React.ReactNode
  className?: string
}

/**
 * A global Modal component built on top of Radix UI's Dialog primitive.
 * Provides a consistent structure for overlays across the application.
 */
export default function Modal({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className={s.overlay} />
        <Dialog.Content className={clsx(s.content, className)}>
          <div className={s.header}>
            <Dialog.Title className={s.title}>{title}</Dialog.Title>
            <Dialog.Description className={s.description}>
              {description || `Manage ${title} settings and selection.`}
            </Dialog.Description>
          </div>

          {children}

          <Dialog.Close asChild>
            <button className={s.closeButton} aria-label="Close">
              <X size={20} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
