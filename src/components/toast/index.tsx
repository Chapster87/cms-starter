"use client"

import React from "react"
import * as RadixToast from "@radix-ui/react-toast"
import { X } from "lucide-react"
import { useToasts } from "@/client/toast-store"
import clsx from "clsx"

import s from "./style.module.css"

/**
 * Toast container component that renders active notifications.
 * Connects to the global Jotai-based toast store.
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToasts()

  return (
    <RadixToast.Provider swipeDirection="right">
      {toasts.map(({ id, title, description, variant }) => (
        <RadixToast.Root
          key={id}
          className={clsx(s.root, variant && s[variant])}
          onOpenChange={(open) => {
            if (!open) {
              // Wait for animation to finish before removing from store
              setTimeout(() => removeToast(id), 200)
            }
          }}
        >
          <div className={s.content}>
            <RadixToast.Title className={s.title}>{title}</RadixToast.Title>
            {description && (
              <RadixToast.Description className={s.description}>
                {description}
              </RadixToast.Description>
            )}
          </div>
          <RadixToast.Close className={s.close} aria-label="Close">
            <X size={16} />
          </RadixToast.Close>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className={s.viewport} />
    </RadixToast.Provider>
  )
}
