import { ReactNode } from "react"
import clsx from "clsx"
import s from "./style.module.css"

type Props = {
  children: ReactNode
  className?: string
}

export default function Example({ children, className = "" }: Props) {
  return <div className={clsx(s.class, className)}>{children}</div>
}
