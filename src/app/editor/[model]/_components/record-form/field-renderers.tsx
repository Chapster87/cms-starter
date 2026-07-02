import React from "react"
import { JSONContent } from "@tiptap/react"
import {
  TextField,
  NumberField,
  MarkdownField,
  RichTextField,
  SelectField,
  CheckboxField,
  JsonField,
  TagField,
  ColorField,
  MediaField,
  SlugField,
  SeoField,
  DateField,
  ReferenceField,
  NavigationField,
  StandingsField,
  ModularContentField,
  StructuredTextField,
} from "@/components/fields"
import { BlockInstance } from "@/components/fields/modular-content-field"
import { StandingRow } from "@/components/fields/standings-field"
import { MediaAsset, NavigationData } from "@/types/cms-generated"
import { FieldRendererProps } from "./types"

/**
 * Renderer for boolean (checkbox) fields.
 */
export function BooleanRenderer({
  field,
  value,
  error,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <CheckboxField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      error={error}
      checked={!!value}
      onChange={(checked) => onChange(checked)}
    />
  )
}

/**
 * Renderer for number fields.
 */
export function NumberRenderer({
  field,
  value,
  error,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <NumberField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      error={error}
      value={(value as number) ?? ""}
      onChange={(val) => onChange(val)}
      min={field.settings?.min}
      max={field.settings?.max}
      step={field.settings?.step}
      placeholder={field.settings?.placeholder}
    />
  )
}

/**
 * Renderer for multi-line text (markdown) fields.
 */
export function TextMultiRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <MarkdownField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      value={(value as string) || ""}
      onChange={(val) => onChange(val)}
      rows={6}
      placeholder={field.settings?.placeholder}
    />
  )
}

/**
 * Renderer for rich text (TipTap) fields.
 */
export function RichTextRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <RichTextField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      value={(value as string) || ""}
      onChange={(val) => onChange(val)}
      enabledTools={field.settings?.enabled_tools}
      placeholder={field.settings?.placeholder}
    />
  )
}

/**
 * Renderer for select fields.
 */
export function SelectRenderer({ field, value, onChange }: FieldRendererProps) {
  return (
    <SelectField
      field={field}
      value={(value as string) || ""}
      onChange={(val) => onChange(val)}
    />
  )
}

/**
 * Renderer for color fields.
 */
export function ColorRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <ColorField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      value={(value as string) || ""}
      onChange={(val) => onChange(val)}
    />
  )
}

/**
 * Renderer for slug fields.
 */
export function SlugRenderer({
  field,
  value,
  disabled,
  onChange,
  getFieldValue,
  schema,
}: FieldRendererProps) {
  const sourceField = schema.find(
    (f) =>
      f.slug === "title" ||
      f.slug === "name" ||
      f.field_label.toLowerCase() === "title" ||
      f.field_label.toLowerCase() === "name"
  )
  const sourceValue = sourceField
    ? (getFieldValue(sourceField.slug) as string)
    : ""

  return (
    <SlugField
      label={field.field_label}
      description={field.field_description ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      value={(value as string) || ""}
      sourceValue={sourceValue}
      onChange={(val) => onChange(val)}
      urlPrefix={field.settings?.url_prefix}
    />
  )
}

/**
 * Renderer for media fields.
 */
export function MediaRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  const settings = (field.settings || {}) as Record<string, unknown>
  const isMultiple =
    settings.multiple === true || settings.allow_multiple === true

  return (
    <MediaField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      value={value as string | MediaAsset | MediaAsset[]}
      onChange={(val) => onChange(val)}
      multiple={isMultiple}
    />
  )
}

/**
 * Renderer for SEO metadata fields.
 */
export function SeoRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <SeoField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      value={(value as string) || ""}
      onChange={(val) => onChange(val)}
    />
  )
}

/**
 * Renderer for tag fields.
 */
export function TagRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <TagField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      value={(value as string[]) || []}
      onChange={(val) => onChange(val)}
      placeholder={field.settings?.placeholder}
    />
  )
}

/**
 * Renderer for JSON fields.
 */
export function JsonRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  const jsonValue =
    typeof value === "object" && value !== null
      ? JSON.stringify(value, null, 2)
      : (value as string) || ""

  return (
    <JsonField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      value={jsonValue}
      onChange={(val) => onChange(val)}
    />
  )
}

/**
 * Renderer for modular content fields.
 */
export function ModularContentRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <ModularContentField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      value={(value as BlockInstance[]) || []}
      onChange={(val) => onChange(val)}
      allowedBlocks={field.settings?.allowed_blocks}
    />
  )
}

/**
 * Renderer for structured text fields.
 */
export function StructuredTextRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <StructuredTextField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      value={(value as JSONContent) || ""}
      onChange={(val) => onChange(val)}
      enabledTools={field.settings?.enabled_tools}
      placeholder={field.settings?.placeholder}
      allowedBlocks={field.settings?.allowed_blocks}
    />
  )
}

/**
 * Renderer for date/time fields.
 */
export function DateRenderer({
  field,
  value,
  error,
  disabled,
  onChange,
}: FieldRendererProps) {
  const settings = (field.settings || {}) as Record<string, unknown>
  const showTime = settings.include_time !== false

  return (
    <DateField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      error={error}
      showTime={showTime}
      value={(value as string) || ""}
      onChange={(val) => onChange(val)}
    />
  )
}

/**
 * Renderer for reference fields.
 */
export function ReferenceRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  const settings = (field.settings || {}) as Record<string, unknown>
  return (
    <ReferenceField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      allowedModels={(settings.allowed_models as string[]) || []}
      allowMultiple={!!settings.allow_multiple}
      value={(value as string | string[]) || null}
      onChange={(val) => onChange(val)}
    />
  )
}

/**
 * Renderer for navigation fields.
 */
export function NavigationRenderer({
  field,
  value,
  disabled,
  onChange,
}: FieldRendererProps) {
  const settings = (field.settings || {}) as Record<string, unknown>
  return (
    <NavigationField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      value={(value as NavigationData) || null}
      onChange={(val) => onChange(val)}
      settings={settings}
    />
  )
}

/**
 * Renderer for standings table fields.
 */
export function StandingsRenderer({
  field,
  value,
  disabled,
  onChange,
  getFieldValue,
}: FieldRendererProps) {
  const extractId = (val: unknown) => {
    if (Array.isArray(val)) return val[0]
    if (typeof val === "object" && val !== null) {
      const obj = val as Record<string, unknown>
      return obj.id as string | undefined
    }
    return val as string | undefined
  }

  const leagueId = extractId(getFieldValue("league"))
  const divisionId = extractId(getFieldValue("division"))
  const seasonId = extractId(getFieldValue("season"))

  return (
    <StandingsField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      value={(value as StandingRow[]) || []}
      onChange={(val) => onChange(val)}
      leagueId={leagueId}
      divisionId={divisionId}
      seasonId={seasonId}
    />
  )
}

/**
 * Default renderer for single-line text fields.
 */
export function TextSingleRenderer({
  field,
  value,
  error,
  disabled,
  onChange,
}: FieldRendererProps) {
  return (
    <TextField
      label={field.field_label}
      description={field.field_description ?? undefined}
      fieldNote={field.field_note ?? undefined}
      required={field.is_required}
      disabled={disabled}
      name={field.slug}
      error={error}
      value={(value as string) || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.settings?.placeholder}
      minLength={field.settings?.min_length}
      maxLength={field.settings?.max_length}
      pattern={field.settings?.regex_pattern}
    />
  )
}
