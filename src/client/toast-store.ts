import { atom, useAtom } from "jotai"
import { getDefaultStore } from "jotai"

export type ToastVariant = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

/**
 * Atom for managing global toast notifications.
 */
export const toastsAtom = atom<Toast[]>([])

const store = getDefaultStore()

/**
 * Public API for triggering toasts from anywhere in the application.
 * Uses the default Jotai store to allow imperative calls outside of React components.
 */
export const toast = {
  add: (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    store.set(toastsAtom, (prev) => [...prev, { ...toast, id }])
  },
  remove: (id: string) => {
    store.set(toastsAtom, (prev) => prev.filter((t) => t.id !== id))
  },
  success: (title: string, description?: string) =>
    toast.add({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    toast.add({ title, description, variant: "error" }),
  warning: (title: string, description?: string) =>
    toast.add({ title, description, variant: "warning" }),
  info: (title: string, description?: string) =>
    toast.add({ title, description, variant: "info" }),
}

/**
 * Hook for consuming toasts in React components.
 */
export function useToasts() {
  const [toasts] = useAtom(toastsAtom)
  return {
    toasts,
    removeToast: toast.remove,
  }
}
