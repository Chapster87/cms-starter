"use client"

import { CMSBlock, CMSFieldOption, CMSFieldType } from "@/types/fields"
import BlocksSettings from "./blocks-settings"
import DateTimeSettings from "./date-time-settings"
import NumberSettings from "./number-settings"
import RelationSettings from "./relation-settings"
import RichTextSettings from "./rich-text-settings"
import SelectSettings from "./select-settings"
import SlugSettings from "./slug-settings"
import TextSettings from "./text-settings"

interface SettingsRegistryProps {
  type: CMSFieldType
  // Number
  min: number | ""
  setMin: (val: number | "") => void
  max: number | ""
  setMax: (val: number | "") => void
  step: number | ""
  setStep: (val: number | "") => void
  // Text
  minLength: number | ""
  setMinLength: (val: number | "") => void
  maxLength: number | ""
  setMaxLength: (val: number | "") => void
  regexPattern: string
  setRegexPattern: (val: string) => void
  regexPreset: string
  setRegexPreset: (val: string) => void
  // Relations / Media
  models: Array<{ id: string; friendly_name: string }>
  allowedModels: string[]
  setAllowedModels: (ids: string[]) => void
  allowMultiple: boolean
  setAllowMultiple: (val: boolean) => void
  // Select
  choices: CMSFieldOption[]
  setChoices: (choices: CMSFieldOption[]) => void
  // Date
  includeTime: boolean
  setIncludeTime: (val: boolean) => void
  // Rich Text
  enabledTools: string[]
  setEnabledTools: (tools: string[]) => void
  // Blocks
  availableBlocks: CMSBlock[]
  allowedBlocks: string[]
  setAllowedBlocks: (ids: string[]) => void
  // Slug Prefix
  urlPrefix: string
  setUrlPrefix: (val: string) => void
  // Tab
  activeTab: "basic" | "validation" | "appearance"
}

export default function SettingsRegistry({
  type,
  min,
  setMin,
  max,
  setMax,
  step,
  setStep,
  minLength,
  setMinLength,
  maxLength,
  setMaxLength,
  regexPattern,
  setRegexPattern,
  regexPreset,
  setRegexPreset,
  models,
  allowedModels,
  setAllowedModels,
  allowMultiple,
  setAllowMultiple,
  choices,
  setChoices,
  includeTime,
  setIncludeTime,
  enabledTools,
  setEnabledTools,
  availableBlocks,
  allowedBlocks,
  setAllowedBlocks,
  urlPrefix,
  setUrlPrefix,
  activeTab,
}: SettingsRegistryProps) {
  if (activeTab === "validation") {
    if (type === "number") {
      return (
        <NumberSettings
          min={min}
          setMin={setMin}
          max={max}
          setMax={setMax}
          step={step}
          setStep={setStep}
        />
      )
    }

    if (
      [
        "text_single",
        "text_multi",
        "rich_text",
        "seo_slug",
        "markdown",
      ].includes(type)
    ) {
      return (
        <TextSettings
          minLength={minLength}
          setMinLength={setMinLength}
          maxLength={maxLength}
          setMaxLength={setMaxLength}
          regexPattern={regexPattern}
          setRegexPattern={setRegexPattern}
          regexPreset={regexPreset}
          setRegexPreset={setRegexPreset}
        />
      )
    }

    if (type === "tags") {
      return (
        <NumberSettings
          min={min}
          setMin={setMin}
          max={max}
          setMax={setMax}
          step={step}
          setStep={setStep}
        />
      )
    }
  }

  if (activeTab === "appearance") {
    return (
      <>
        {type === "rich_text" && (
          <RichTextSettings
            enabledTools={enabledTools}
            setEnabledTools={setEnabledTools}
          />
        )}
        {type === "select" && (
          <SelectSettings choices={choices} setChoices={setChoices} />
        )}
        {["reference", "navigation", "media"].includes(type) && (
          <RelationSettings
            type={type}
            models={models}
            allowedModels={allowedModels}
            setAllowedModels={setAllowedModels}
            allowMultiple={allowMultiple}
            setAllowMultiple={setAllowMultiple}
          />
        )}
        {type === "date_time" && (
          <DateTimeSettings
            includeTime={includeTime}
            setIncludeTime={setIncludeTime}
          />
        )}
        {type === "seo_slug" && (
          <SlugSettings urlPrefix={urlPrefix} setUrlPrefix={setUrlPrefix} />
        )}
      </>
    )
  }

  // Basic Tab additional settings (Blocks)
  if (
    activeTab === "basic" &&
    ["modular_content", "structured_text"].includes(type)
  ) {
    return (
      <BlocksSettings
        availableBlocks={availableBlocks}
        allowedBlocks={allowedBlocks}
        setAllowedBlocks={setAllowedBlocks}
      />
    )
  }

  return null
}
