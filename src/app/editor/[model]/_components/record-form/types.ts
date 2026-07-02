import { CMSField } from "@/types/fields"

/**
 * Props passed to individual field renderer components.
 */
export interface FieldRendererProps {
  field: CMSField
  value: unknown
  error?: string
  disabled?: boolean
  onChange: (value: unknown) => void
  /**
   * Helper for accessing other field values in the form.
   */
  getFieldValue: (slug: string) => unknown
  /**
   * The complete schema for context.
   */
  schema: CMSField[]
}
