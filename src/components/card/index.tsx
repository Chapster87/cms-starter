import { ReactNode } from "react"
import clsx from "clsx"
import s from "./style.module.css"

type CardProps = {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = "" }: CardProps) {
  return <div className={clsx(s.card, className)}>{children}</div>
}
