import { CMSField } from "@/types/fields"
import { FormCoreActions, FormCoreState } from "./types"

/**
 * Interface for a user object as used in the Author sync policy.
 */
export interface AuthorUser {
  id: string
  display_name?: string
  avatar_url?: string
}

/**
 * Framework-agnostic logic for the RecordForm engine.
 */
export class FormCore implements FormCoreState, FormCoreActions {
  public values: Record<string, unknown> = {}
  public errors: Record<string, string | undefined> = {}
  public isSubmitting = false
  public isDirty = false

  public model: string
  public schema: CMSField[]
  public users: AuthorUser[]
  private onStateChange: (state: FormCoreState) => void

  /**
   * Initializes a new instance of the FormCore engine.
   * @param model The table name of the model.
   * @param schema The field schema for the model.
   * @param users The list of users (for author sync).
   * @param initialData Initial data for the form.
   * @param onStateChange Callback invoked whenever the internal state changes.
   */
  constructor(
    model: string,
    schema: CMSField[],
    users: AuthorUser[],
    initialData: Record<string, unknown> = {},
    onStateChange: (state: FormCoreState) => void = () => {}
  ) {
    this.model = model
    this.schema = schema
    this.users = users
    this.onStateChange = onStateChange
    this.reset(initialData)
  }

  /**
   * Updates the form state and notifies listeners.
   */
  private updateState() {
    this.onStateChange({
      values: { ...this.values },
      errors: { ...this.errors },
      isSubmitting: this.isSubmitting,
      isDirty: this.isDirty,
    })
  }

  /**
   * Unwraps stringified JSON for specific field types.
   * @param data The raw data to unwrap.
   * @returns The unwrapped data.
   */
  public unwrapData(data: Record<string, unknown>): Record<string, unknown> {
    const unwrapped = { ...data }
    Object.keys(unwrapped).forEach((key) => {
      const val = unwrapped[key]
      if (
        typeof val === "string" &&
        (val.trim().startsWith("{") || val.trim().startsWith("["))
      ) {
        try {
          unwrapped[key] = JSON.parse(val)
        } catch (_e) {
          // Keep original if parsing fails
        }
      }
    })
    return unwrapped
  }

  /**
   * Implementation of Author auto-sync policy.
   * @param nextData The current form data.
   * @param fieldName The name of the field that was changed.
   * @param value The new value of the field.
   */
  private applyAuthorPolicy(
    nextData: Record<string, unknown>,
    fieldName: string,
    value: unknown
  ) {
    if (this.model === "authors" && fieldName === "user_id" && value) {
      const userId = Array.isArray(value) ? value[0] : value
      const linkedUser = this.users.find((u) => u.id === userId)

      if (linkedUser) {
        if (linkedUser.display_name && !nextData["name"]) {
          nextData["name"] = linkedUser.display_name
        }
        if (linkedUser.avatar_url && !nextData["avatar_url"]) {
          nextData["avatar_url"] = linkedUser.avatar_url
        }
      }
    }
  }

  public setValue(field: string, value: unknown) {
    const nextValues = { ...this.values, [field]: value }
    this.applyAuthorPolicy(nextValues, field, value)

    this.values = nextValues
    this.isDirty = true

    // Validate the field immediately
    const schemaField = this.schema.find((f) => f.slug === field)
    this.validateField(field, value, schemaField?.is_required)

    this.updateState()
  }

  private validateField(name: string, value: unknown, isRequired?: boolean) {
    if (isRequired && (value === undefined || value === null || value === "")) {
      this.errors[name] = "This field is required"
    } else {
      delete this.errors[name]
    }
  }

  public reset(values?: Record<string, unknown>) {
    this.values = this.unwrapData(values || {})
    this.errors = {}
    this.isSubmitting = false
    this.isDirty = false
    this.updateState()
  }

  public async validate(): Promise<boolean> {
    const nextErrors: Record<string, string | undefined> = {}
    let hasErrors = false

    this.schema.forEach((field) => {
      const val = this.values[field.slug]
      if (
        field.is_required &&
        (val === undefined || val === null || val === "")
      ) {
        nextErrors[field.slug] = "This field is required"
        hasErrors = true
      }
    })

    this.errors = nextErrors
    this.updateState()
    return !hasErrors
  }

  /**
   * Prepares the data for submission by cleaning and wrapping it as needed.
   * @returns The cleaned data.
   */
  public getSubmissionData(): Record<string, unknown> {
    const cleanData = { ...this.values }
    // Strip virtual fields
    if ("_resolved" in cleanData) {
      delete cleanData["_resolved"]
    }

    this.schema.forEach((field) => {
      if (field.is_computed) {
        delete cleanData[field.slug]
        return
      }

      let val = cleanData[field.slug]

      // Force relationship fields on 'teams' model to stay as arrays
      if (
        this.model === "teams" &&
        (field.slug === "league" || field.slug === "division")
      ) {
        if (val && !Array.isArray(val)) {
          val = [val]
          cleanData[field.slug] = val
        }
      }

      // Unwrap single-reference fields
      if (field.field_type === "reference") {
        const settings = (field.settings || {}) as Record<string, unknown>
        const isMultiple =
          settings.multiple === true || settings.allow_multiple === true

        const isTeamsSpecialField =
          this.model === "teams" &&
          (field.slug === "league" || field.slug === "division")

        if (
          !isMultiple &&
          !isTeamsSpecialField &&
          Array.isArray(val) &&
          val.length > 0
        ) {
          cleanData[field.slug] = val[0]
        }
      }
    })

    return cleanData
  }

  public async submit(): Promise<void> {
    this.isSubmitting = true
    this.updateState()

    try {
      const isValid = await this.validate()
      if (!isValid) {
        throw new Error("Validation failed")
      }
      // Submission logic would be handled by the caller using getSubmissionData()
    } finally {
      this.isSubmitting = false
      this.updateState()
    }
  }

  public updateSchema(schema: CMSField[]) {
    this.schema = schema
  }

  public updateUsers(users: AuthorUser[]) {
    this.users = users
  }

  public syncFromUser() {
    const userId = this.values["user_id"]
    if (!userId) return

    const linkedUser = this.users.find(
      (u) =>
        u.id === userId ||
        (Array.isArray(userId) && userId.includes(u.id)) ||
        (typeof userId === "string" && userId.includes(u.id))
    )

    if (!linkedUser) return

    const updates: Record<string, unknown> = {}
    if (
      linkedUser.display_name &&
      this.values["name"] !== linkedUser.display_name
    ) {
      updates["name"] = linkedUser.display_name
    }
    if (
      linkedUser.avatar_url &&
      this.values["avatar_url"] !== linkedUser.avatar_url
    ) {
      updates["avatar_url"] = linkedUser.avatar_url
    }

    if (Object.keys(updates).length > 0) {
      this.values = { ...this.values, ...updates }
      this.isDirty = true
      this.updateState()
    }
  }
}
