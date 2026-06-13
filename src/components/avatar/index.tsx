"use client"

import React from "react"
import * as RadixAvatar from "@radix-ui/react-avatar"
import { clsx } from "clsx"
import s from "./style.module.css"

interface AvatarProps {
  src?: string | null
  alt: string
  fallback?: string
  size?: number
  bordered?: boolean
  className?: string
}

/**
 * A reusable Avatar component built on top of Radix UI's Avatar primitive.
 */
export default function Avatar({
  src,
  alt,
  fallback,
  size,
  bordered,
  className,
}: AvatarProps) {
  // Use first letter of alt or fallback as fallback
  const fallbackText = (fallback || alt || "?").charAt(0).toUpperCase()

  const style = size ? { width: size, height: size } : undefined

  return (
    <RadixAvatar.Root
      className={clsx(s.avatarRoot, className, { [s.bordered]: bordered })}
      style={style}
    >
      {src && (
        <RadixAvatar.Image className={s.avatarImage} src={src} alt={alt} />
      )}
      <RadixAvatar.Fallback className={s.avatarFallback} delayMs={600}>
        {fallbackText}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  )
}
