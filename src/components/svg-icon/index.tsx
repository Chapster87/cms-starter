import React from "react"
import clsx from "clsx"

interface SvgIconProps {
  /** The ID of the icon in the feather-sprite.svg file (e.g., 'layers', 'more-vertical') */
  icon: string
  /** Square size of the icon in pixels. Defaults to 24. */
  size?: number | string
  /** Optional width override */
  width?: number | string
  /** Optional height override */
  height?: number | string
  /** Optional CSS class name */
  className?: string
}

/**
 * A reusable component for rendering SVG icons from the global feather-sprite.svg.
 */
export default function SvgIcon({
  icon,
  size = 24,
  width,
  height,
  className,
}: SvgIconProps) {
  const iconWidth = width || size
  const iconHeight = height || size

  return (
    <svg
      className={clsx("feather-icon", className)}
      width={iconWidth}
      height={iconHeight}
      aria-hidden="true"
    >
      <use href={`/feather-sprite.svg#${icon}`} />
    </svg>
  )
}
