"use client"

import React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import clsx from "clsx"

import s from "./style.module.css"

interface TabsProps {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

/**
 * Root component for the tabs.
 * Wraps Radix UI Tabs.Root.
 */
function Tabs({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
}: TabsProps) {
  return (
    <TabsPrimitive.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={clsx(s.tabsRoot, className)}
    >
      {children}
    </TabsPrimitive.Root>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

/**
 * List component for the tabs.
 * Contains the tab triggers.
 */
function TabsList({ children, className }: TabsListProps) {
  return (
    <TabsPrimitive.List className={clsx(s.tabsList, className)}>
      {children}
    </TabsPrimitive.List>
  )
}

interface TabsTriggerProps {
  children: React.ReactNode
  value: string
  className?: string
  disabled?: boolean
}

/**
 * Trigger component for an individual tab.
 */
function TabsTrigger({
  children,
  value,
  className,
  disabled,
}: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={clsx(s.tabsTrigger, className)}
      disabled={disabled}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}

interface TabsContentProps {
  children: React.ReactNode
  value: string
  className?: string
}

/**
 * Content component for an individual tab.
 */
function TabsContent({ children, value, className }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={clsx(s.tabsContent, className)}
    >
      {children}
    </TabsPrimitive.Content>
  )
}

// Assign sub-components to the main Tabs component
Tabs.List = TabsList
Tabs.Trigger = TabsTrigger
Tabs.Content = TabsContent

export default Tabs
