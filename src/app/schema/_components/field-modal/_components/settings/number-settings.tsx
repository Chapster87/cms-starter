"use client"

import { TextField } from "@/components/fields"
import s from "../../style.module.css"

interface NumberSettingsProps {
  min: number | ""
  setMin: (val: number | "") => void
  max: number | ""
  setMax: (val: number | "") => void
  step: number | ""
  setStep: (val: number | "") => void
}

export default function NumberSettings({
  min,
  setMin,
  max,
  setMax,
  step,
  setStep,
}: NumberSettingsProps) {
  return (
    <div className={s.settingsGrid}>
      <TextField
        label="Minimum Value"
        type="number"
        value={min}
        onChange={(e) => setMin(e.target.value ? Number(e.target.value) : "")}
        placeholder="No min"
      />
      <TextField
        label="Maximum Value"
        type="number"
        value={max}
        onChange={(e) => setMax(e.target.value ? Number(e.target.value) : "")}
        placeholder="No max"
      />
      <TextField
        label="Step"
        type="number"
        value={step}
        onChange={(e) => setStep(e.target.value ? Number(e.target.value) : "")}
        placeholder="e.g. 1 or 0.1"
      />
    </div>
  )
}
