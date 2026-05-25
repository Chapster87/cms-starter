import React from "react"
import clsx from "clsx"

import s from "./styles.module.css"

const defaultMiddleIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={s.svgIcon}
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
      clipRule="evenodd"
    />
  </svg>
)

interface TimelineProps {
  children: React.ReactNode
  snapIcon?: boolean
  orientation?: "horizontal" | "vertical"
  compact?: boolean
  roundConnections?: boolean
}

function Timeline({
  children,
  snapIcon = false,
  orientation = "horizontal",
  compact = false,
  roundConnections = true,
}: TimelineProps) {
  const childrenArray = React.Children.toArray(children)
  const totalChildren = childrenArray.length

  return (
    <ul
      className={clsx(
        s.timeline,
        snapIcon && s.snapIcon,
        orientation === "horizontal" ? s.horizontal : s.vertical,
        compact && s.compact,
        roundConnections && s.roundConnections
      )}
    >
      {React.Children.map(childrenArray, (child, index) => {
        if (React.isValidElement(child) && child.type === TimelineStep) {
          return React.cloneElement(
            child as React.ReactElement<TimelineStepProps>,
            {
              isFirst: index === 0,
              isLast: index === totalChildren - 1,
              snapIcon: snapIcon,
              orientation: orientation,
            }
          )
        }
        return child
      })}
    </ul>
  )
}

interface TimelineStepProps {
  children: React.ReactNode
  isFirst?: boolean
  isLast?: boolean
  snapIcon?: boolean
  orientation?: "horizontal" | "vertical"
}

function TimelineStep({
  children,
  isFirst,
  isLast,
  snapIcon,
  orientation,
}: TimelineStepProps) {
  return (
    <li className={clsx(s.step, isFirst && s.firstStep, isLast && s.lastStep)}>
      {!(isFirst && isLast) && !isFirst && <hr className={s.stepLine} />}
      {children}
      {((!(isFirst && isLast) && !isLast) ||
        (orientation === "vertical" && snapIcon && isLast)) && (
        <hr className={s.stepLine} />
      )}
    </li>
  )
}

interface TimelineStartProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

function TimelineStart({ children, style }: TimelineStartProps) {
  return (
    <div className={clsx(s.stepBox, s.stepStart)} style={style}>
      {children}
    </div>
  )
}

interface TimelineMiddleProps {
  icon?: React.ReactNode
  style?: React.CSSProperties
}

function TimelineMiddle({
  icon = defaultMiddleIcon,
  style,
}: TimelineMiddleProps) {
  return (
    <div className={s.stepMiddle} style={style}>
      {icon && icon}
    </div>
  )
}

interface TimelineEndProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

function TimelineEnd({ children, style }: TimelineEndProps) {
  return (
    <div className={clsx(s.stepBox, s.stepEnd)} style={style}>
      {children}
    </div>
  )
}

Timeline.Step = TimelineStep
Timeline.Start = TimelineStart
Timeline.Middle = TimelineMiddle
Timeline.End = TimelineEnd

export default Timeline
