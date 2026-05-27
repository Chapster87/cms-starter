import React from "react"
import TextField from "../text-field"

interface DateFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
  required?: boolean
  showTime?: boolean
}

/**
 * A date input field, optionally supporting time.
 */
export default function DateField({ showTime, ...props }: DateFieldProps) {
  return <TextField {...props} type={showTime ? "datetime-local" : "date"} />
}
