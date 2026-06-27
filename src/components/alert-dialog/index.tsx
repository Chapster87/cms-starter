"use client"

import React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import Button from "@/components/button"

import s from "./style.module.css"

interface AlertDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  cancelText?: string
  confirmText?: string
  onConfirm: () => void
  confirmVariant?: "primary" | "secondary" | "danger"
  isLoading?: boolean
}

/**
 * A specialized confirmation dialog built on Radix UI's AlertDialog primitive.
 * Used for dangerous or irreversible actions.
 */
export default function AlertDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  cancelText = "Cancel",
  confirmText = "Confirm",
  onConfirm,
  confirmVariant = "primary",
  isLoading = false,
}: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={s.overlay} />
        <AlertDialogPrimitive.Content className={s.content}>
          <AlertDialogPrimitive.Title className={s.title}>
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className={s.description}>
            {description}
          </AlertDialogPrimitive.Description>
          <div className={s.actions}>
            <AlertDialogPrimitive.Cancel asChild>
              <Button variant="secondary" disabled={isLoading}>
                {cancelText}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <Button
                variant={
                  confirmVariant === "danger" ? "primary" : confirmVariant
                }
                onClick={(e) => {
                  e.preventDefault()
                  onConfirm()
                }}
                isLoading={isLoading}
                disabled={isLoading}
                // Custom danger style if variant is danger
                style={
                  confirmVariant === "danger"
                    ? { backgroundColor: "#dc2626", borderColor: "#dc2626" }
                    : {}
                }
              >
                {confirmText}
              </Button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
