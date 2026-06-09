"use client"

import React from "react"
import TextField from "../text-field"

interface DateFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  label: string
  description?: string
  fieldNote?: string
  error?: string
  required?: boolean
  showTime?: boolean
  value: string | undefined | null
  onChange: (value: string) => void
}

/**
 * A date input field, optionally supporting time and timezone selection.
 * Handles formatting ISO strings for HTML5 date/datetime inputs and
 * ensures correct UTC conversion for database storage.
 */
export default function DateField({
  showTime,
  fieldNote,
  value,
  onChange,
  ...props
}: DateFieldProps) {
  // Use browser default timezone if none provided in the ISO string
  const [timezone, setTimezone] = React.useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )

  // Helper to format values for HTML5 date inputs
  const formatISOToLocal = React.useCallback(
    (isoVal: string | undefined | null) => {
      if (!isoVal) return ""

      // If it's already a local format, use it as is
      if (
        !isoVal.includes("Z") &&
        !isoVal.includes("+") &&
        isoVal.includes("-")
      ) {
        return showTime ? isoVal.slice(0, 16) : isoVal.slice(0, 10)
      }

      try {
        const date = new Date(isoVal)
        if (isNaN(date.getTime())) return isoVal

        // Format to parts in the target timezone
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).formatToParts(date)

        const getPart = (type: string) =>
          parts.find((p) => p.type === type)?.value
        const year = getPart("year")
        const month = getPart("month")
        const day = getPart("day")

        if (showTime) {
          const hour = getPart("hour")
          const minute = getPart("minute")
          return `${year}-${month}-${day}T${hour}:${minute}`
        }

        return `${year}-${month}-${day}`
      } catch {
        return isoVal
      }
    },
    [showTime, timezone]
  )

  // Naive display state for the picker string
  const [localDisplay, setLocalDisplay] = React.useState(() =>
    formatISOToLocal(value)
  )
  const [prevValue, setPrevValue] = React.useState(value)

  // Update UTC value sent to parent
  const syncParent = React.useCallback(
    (literalTime: string, targetTz: string) => {
      if (!literalTime) {
        onChange("")
        return
      }
      if (!showTime) {
        onChange(literalTime)
        return
      }

      try {
        // Find the UTC equivalent of 'literalTime' in 'targetTz'
        const [datePart, timePart] = literalTime.split("T")
        const [year, month, day] = datePart.split("-").map(Number)
        const [hour, minute] = timePart.split(":").map(Number)

        // Use Intl to find the offset for this specific naive time in that timezone
        const naiveDate = new Date(Date.UTC(year, month - 1, day, hour, minute))
        const tzFormat = new Intl.DateTimeFormat("en-US", {
          timeZone: targetTz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })

        // Simple but effective: find the UTC date that matches this naive time in targetTz
        const utcDate = new Date(
          naiveDate.toLocaleString("en-US", { timeZone: "UTC" })
        )
        const tzDate = new Date(
          naiveDate.toLocaleString("en-US", { timeZone: targetTz })
        )
        const offset = utcDate.getTime() - tzDate.getTime()
        const result = new Date(naiveDate.getTime() + offset)

        onChange(result.toISOString())
      } catch {
        onChange(literalTime)
      }
    },
    [onChange, showTime]
  )

  // External updates to value should reset the display (e.g. form reset or initial load)
  if (value !== prevValue) {
    setLocalDisplay(formatISOToLocal(value))
    setPrevValue(value)
  }

  // Handle user picking a time
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalDisplay(val) // Update UI immediately
    syncParent(val, timezone) // Update absolute value
  }

  // Handle user changing timezone
  const handleTzChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTz = e.target.value
    setTimezone(newTz)
    // IMPORTANT: We do NOT change localDisplay here.
    // We just re-calculate the absolute UTC time for the current display time + new TZ.
    syncParent(localDisplay, newTz)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <TextField
        {...props}
        value={localDisplay}
        onChange={handleTimeChange}
        fieldNote={fieldNote}
        type={showTime ? "datetime-local" : "date"}
      />
      {showTime && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--color-grey-500)",
            marginTop: "-4px",
          }}
        >
          <span>Timezone:</span>
          <select
            value={timezone}
            onChange={handleTzChange}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              fontSize: "12px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {Intl.supportedValuesOf("timeZone").map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
