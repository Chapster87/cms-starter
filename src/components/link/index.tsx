import React from "react"
import NextLink from "next/link"
import clsx from "clsx"
import buttonStyles from "../button/style.module.css"
import s from "./styles.module.css"

type LinkProps = {
  children: React.ReactNode
  href: string
  variant?: "primary" | "secondary"
  size?: "small" | "default" | "large"
  shape?: "standard" | "square" | "circle"
  className?: string
  openInNewTab?: boolean
  nofollow?: boolean
  buttonStyle?: boolean
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

export default function Link({
  children,
  href,
  variant = "primary",
  size = "default",
  shape = "standard",
  className,
  openInNewTab = false,
  nofollow = false,
  buttonStyle = false,
  ...props
}: LinkProps) {
  const classes = clsx(
    buttonStyle
      ? [
          buttonStyles.base,
          buttonStyles[variant],
          buttonStyles[size],
          buttonStyles[shape],
        ]
      : s.link,
    className
  )

  return (
    <NextLink
      href={href}
      className={classes}
      target={openInNewTab ? "_blank" : undefined}
      rel={nofollow ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </NextLink>
  )
}
