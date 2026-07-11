/**
 * Represents the state of the FormCore engine.
 */
export interface FormCoreState {
  /**
   * The current values of the form fields.
   */
  values: Record<string, unknown>
  /**
   * Whether the form is currently being submitted.
   */
  isSubmitting: boolean
  /**
   * Whether the form has been modified since it was last loaded or saved.
   */
  isDirty: boolean
  /**
   * Validation errors for each field.
   */
  errors: Record<string, string | undefined>
}

/**
 * Defines the actions that can be performed on the FormCore engine.
 */
export interface FormCoreActions {
  /**
   * Updates the value of a specific field.
   * @param field The name of the field to update.
   * @param value The new value for the field.
   */
  setValue: (field: string, value: unknown) => void
  /**
   * Resets the form to its initial state or provided values.
   * @param values Optional initial values to reset to.
   */
  reset: (values?: Record<string, unknown>) => void
  /**
   * Validates the current form values.
   * @returns A promise that resolves with the validation results.
   */
  validate: () => Promise<boolean>
  /**
   * Submits the form data.
   * @returns A promise that resolves when submission is complete.
   */
  submit: () => Promise<void>
  /**
   * Manually triggers a sync from the linked user profile.
   */
  syncFromUser: () => void
}
