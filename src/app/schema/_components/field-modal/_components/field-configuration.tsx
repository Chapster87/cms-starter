"use client"

import { Settings, ShieldCheck, Palette } from "lucide-react"
import {
  TextField,
  SlugField,
  CheckboxField,
  SelectField,
} from "@/components/fields"
import Tabs from "@/components/tabs"
import {
  CMSBlock,
  CMSFieldOption,
  CMSFieldType,
  CMSFieldset,
} from "@/types/fields"
import SettingsRegistry from "./settings"
import s from "../style.module.css"

interface FieldConfigurationProps {
  mode: "create" | "edit" | "duplicate"
  type: CMSFieldType
  label: string
  setLabel: (val: string) => void
  slug: string
  setSlug: (val: string) => void
  note: string
  setNote: (val: string) => void
  isRequired: boolean
  setIsRequired: (val: boolean) => void
  isUnique: boolean
  setIsUnique: (val: boolean) => void
  fieldsetId: string | null
  setFieldsetId: (val: string | null) => void
  fieldsets: CMSFieldset[]
  hasValidationSettings: boolean
  // Settings Registry Props
  min: number | ""
  setMin: (val: number | "") => void
  max: number | ""
  setMax: (val: number | "") => void
  step: number | ""
  setStep: (val: number | "") => void
  minLength: number | ""
  setMinLength: (val: number | "") => void
  maxLength: number | ""
  setMaxLength: (val: number | "") => void
  regexPattern: string
  setRegexPattern: (val: string) => void
  regexPreset: string
  setRegexPreset: (val: string) => void
  models: Array<{ id: string; friendly_name: string }>
  allowedModels: string[]
  setAllowedModels: (ids: string[]) => void
  allowMultiple: boolean
  setAllowMultiple: (val: boolean) => void
  choices: CMSFieldOption[]
  setChoices: (choices: CMSFieldOption[]) => void
  includeTime: boolean
  setIncludeTime: (val: boolean) => void
  enabledTools: string[]
  setEnabledTools: (tools: string[]) => void
  availableBlocks: CMSBlock[]
  allowedBlocks: string[]
  setAllowedBlocks: (ids: string[]) => void
  placeholder: string
  setPlaceholder: (val: string) => void
  helpText: string
  setHelpText: (val: string) => void
  urlPrefix: string
  setUrlPrefix: (val: string) => void
}

/**
 * Step 2: Configuration of field attributes, validation, and appearance.
 */
export default function FieldConfiguration({
  mode,
  type,
  label,
  setLabel,
  slug,
  setSlug,
  note,
  setNote,
  isRequired,
  setIsRequired,
  isUnique,
  setIsUnique,
  fieldsetId,
  setFieldsetId,
  fieldsets,
  hasValidationSettings,
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
  placeholder,
  setPlaceholder,
  helpText,
  setHelpText,
  urlPrefix,
  setUrlPrefix,
}: FieldConfigurationProps) {
  return (
    <Tabs defaultValue="basic" className={s.tabsRoot}>
      <Tabs.List className={s.tabsList}>
        <Tabs.Trigger value="basic" className={s.tabTrigger}>
          <Settings size={14} /> Basic
        </Tabs.Trigger>
        {hasValidationSettings && (
          <Tabs.Trigger value="validation" className={s.tabTrigger}>
            <ShieldCheck size={14} /> Validation
          </Tabs.Trigger>
        )}
        <Tabs.Trigger value="appearance" className={s.tabTrigger}>
          <Palette size={14} /> Appearance
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="basic" className={s.tabsContent}>
        <TextField
          label="Field Label"
          placeholder="e.g. Featured Image"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          description="Human-friendly name for the field."
        />

        {mode !== "edit" && (
          <SlugField
            label="Slug"
            placeholder="e.g. featured_image"
            value={slug}
            onChange={setSlug}
            sourceValue={label}
            showUrlPrefix={false}
            description="The physical column name in your database."
          />
        )}

        <TextField
          label="Field Note"
          placeholder="e.g. This image is used on the home page."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          description="Internal description or help text for editors."
        />

        <div className={s.settingsGrid}>
          <CheckboxField
            label="Required Field"
            checked={isRequired}
            onChange={setIsRequired}
            description="Make mandatory."
            variant="switch"
          />

          <CheckboxField
            label="Unique Constraint"
            checked={isUnique}
            onChange={setIsUnique}
            description="Prevent duplicates."
            variant="switch"
          />
        </div>

        <SelectField
          label="Field Grouping"
          description="Place this field inside a visual group (fieldset)."
          value={fieldsetId || "__none__"}
          onChange={(val) =>
            setFieldsetId(val === "__none__" ? null : (val as string))
          }
          options={[
            { label: "None (Ungrouped)", value: "__none__" },
            ...fieldsets.map((fs) => ({
              label: fs.label,
              value: fs.id,
            })),
          ]}
        />

        <SettingsRegistry
          activeTab="basic"
          type={type}
          min={min}
          setMin={setMin}
          max={max}
          setMax={setMax}
          step={step}
          setStep={setStep}
          minLength={minLength}
          setMinLength={setMinLength}
          maxLength={maxLength}
          setMaxLength={setMaxLength}
          regexPattern={regexPattern}
          setRegexPattern={setRegexPattern}
          regexPreset={regexPreset}
          setRegexPreset={setRegexPreset}
          models={models}
          allowedModels={allowedModels}
          setAllowedModels={setAllowedModels}
          allowMultiple={allowMultiple}
          setAllowMultiple={setAllowMultiple}
          choices={choices}
          setChoices={setChoices}
          includeTime={includeTime}
          setIncludeTime={setIncludeTime}
          enabledTools={enabledTools}
          setEnabledTools={setEnabledTools}
          availableBlocks={availableBlocks}
          allowedBlocks={allowedBlocks}
          setAllowedBlocks={setAllowedBlocks}
          urlPrefix={urlPrefix}
          setUrlPrefix={setUrlPrefix}
        />
      </Tabs.Content>

      {hasValidationSettings && (
        <Tabs.Content value="validation" className={s.tabsContent}>
          <SettingsRegistry
            activeTab="validation"
            type={type}
            min={min}
            setMin={setMin}
            max={max}
            setMax={setMax}
            step={step}
            setStep={setStep}
            minLength={minLength}
            setMinLength={setMinLength}
            maxLength={maxLength}
            setMaxLength={setMaxLength}
            regexPattern={regexPattern}
            setRegexPattern={setRegexPattern}
            regexPreset={regexPreset}
            setRegexPreset={setRegexPreset}
            models={models}
            allowedModels={allowedModels}
            setAllowedModels={setAllowedModels}
            allowMultiple={allowMultiple}
            setAllowMultiple={setAllowMultiple}
            choices={choices}
            setChoices={setChoices}
            includeTime={includeTime}
            setIncludeTime={setIncludeTime}
            enabledTools={enabledTools}
            setEnabledTools={setEnabledTools}
            availableBlocks={availableBlocks}
            allowedBlocks={allowedBlocks}
            setAllowedBlocks={setAllowedBlocks}
            urlPrefix={urlPrefix}
            setUrlPrefix={setUrlPrefix}
          />
        </Tabs.Content>
      )}

      <Tabs.Content value="appearance" className={s.tabsContent}>
        <div className={s.settingsGrid}>
          <TextField
            label="Placeholder Text"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="Enter placeholder..."
          />
          <TextField
            label="Help Text"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            placeholder="Instructional text for editors..."
          />
        </div>

        <SettingsRegistry
          activeTab="appearance"
          type={type}
          min={min}
          setMin={setMin}
          max={max}
          setMax={setMax}
          step={step}
          setStep={setStep}
          minLength={minLength}
          setMinLength={setMinLength}
          maxLength={maxLength}
          setMaxLength={setMaxLength}
          regexPattern={regexPattern}
          setRegexPattern={setRegexPattern}
          regexPreset={regexPreset}
          setRegexPreset={setRegexPreset}
          models={models}
          allowedModels={allowedModels}
          setAllowedModels={setAllowedModels}
          allowMultiple={allowMultiple}
          setAllowMultiple={setAllowMultiple}
          choices={choices}
          setChoices={setChoices}
          includeTime={includeTime}
          setIncludeTime={setIncludeTime}
          enabledTools={enabledTools}
          setEnabledTools={setEnabledTools}
          availableBlocks={availableBlocks}
          allowedBlocks={allowedBlocks}
          setAllowedBlocks={setAllowedBlocks}
          urlPrefix={urlPrefix}
          setUrlPrefix={setUrlPrefix}
        />
      </Tabs.Content>
    </Tabs>
  )
}
