"use client"

import { TextField } from "@/components/fields"
import s from "../../style.module.css"

interface SlugSettingsProps {
  urlPrefix: string
  setUrlPrefix: (val: string) => void
}

export default function SlugSettings({
  urlPrefix,
  setUrlPrefix,
}: SlugSettingsProps) {
  return (
    <div className={s.settingsGrid}>
      <TextField
        label="URL Prefix"
        value={urlPrefix}
        onChange={(e) => setUrlPrefix(e.target.value)}
        placeholder="e.g. /blog or /about"
        description="Optional custom URL prefix. Falls back to global site URL if empty."
      />
    </div>
  )
}
