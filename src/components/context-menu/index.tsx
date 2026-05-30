import React from "react"
import Link from "next/link"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import clsx from "clsx"

import SvgIcon from "@/components/svg-icon"

import s from "./style.module.css"

interface ContextMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Root component for the context menu.
 * Wraps Radix UI DropdownMenu.Root.
 */
function ContextMenu({ children, open, onOpenChange }: ContextMenuProps) {
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DropdownMenu.Root>
  )
}

interface ContextMenuTriggerProps {
  children?: React.ReactNode
  className?: string
  asChild?: boolean
}

/**
 * Trigger component for the context menu.
 * If no children are provided, it renders a default vertical ellipsis icon.
 */
function ContextMenuTrigger({
  children,
  className,
  asChild = true,
}: ContextMenuTriggerProps) {
  return (
    <DropdownMenu.Trigger
      asChild={asChild}
      className={clsx(s.trigger, className)}
    >
      {children || (
        <button type="button" aria-label="Open menu">
          <SvgIcon icon="more-vertical" size={20} />
        </button>
      )}
    </DropdownMenu.Trigger>
  )
}

interface ContextMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
}

/**
 * Content component for the context menu.
 * Handles the portal and the container for menu items.
 */
function ContextMenuContent({
  children,
  className,
  align = "end",
  sideOffset = 5,
  ...props
}: ContextMenuContentProps) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        className={clsx(s.menuContent, className)}
        align={align}
        sideOffset={sideOffset}
        {...props}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

interface ContextMenuItemProps {
  children: React.ReactNode
  onSelect?: (event: Event) => void
  className?: string
  disabled?: boolean
  variant?: "default" | "danger"
}

/**
 * Standard menu item for the context menu.
 * Used for click events and actions.
 */
function ContextMenuItem({
  children,
  onSelect,
  className,
  disabled,
  variant = "default",
}: ContextMenuItemProps) {
  return (
    <DropdownMenu.Item
      className={clsx(s.menuItem, variant === "danger" && s.danger, className)}
      onSelect={onSelect}
      disabled={disabled}
    >
      {children}
    </DropdownMenu.Item>
  )
}

interface ContextMenuLinkProps {
  children: React.ReactNode
  href: string
  className?: string
  disabled?: boolean
}

/**
 * Link menu item for the context menu.
 * Wraps next/link for navigation.
 */
function ContextMenuLink({
  children,
  href,
  className,
  disabled,
}: ContextMenuLinkProps) {
  return (
    <DropdownMenu.Item
      className={clsx(s.menuItem, className)}
      disabled={disabled}
      asChild
    >
      <Link href={href}>{children}</Link>
    </DropdownMenu.Item>
  )
}

// Assign sub-components to the main ContextMenu component
ContextMenu.Trigger = ContextMenuTrigger
ContextMenu.Content = ContextMenuContent
ContextMenu.Item = ContextMenuItem
ContextMenu.Link = ContextMenuLink

export default ContextMenu
