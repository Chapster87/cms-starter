import React from "react"
import TextField from "../text-field"

interface NumberFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  label: string
  description?: string
  error?: string
  required?: boolean
  onChange?: (value: number | undefined) => void
}

/**
 * A numeric input field.
 */
export default function NumberField({ onChange, ...props }: NumberFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === "") {
      onChange?.(undefined)
    } else {
      onChange?.(Number(val))
    }
  }

  return <TextField {...props} type="number" onChange={handleChange} />
}
