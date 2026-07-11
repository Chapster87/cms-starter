import { describe, it, expect, vi } from "vitest"
import { FormCore } from "./form-core"
import { CMSField } from "@/types/fields"

describe("FormCore", () => {
  const mockSchema: CMSField[] = [
    {
      id: "1",
      slug: "name",
      field_label: "Name",
      field_type: "text_single",
      is_required: true,
      model_id: "m1",
      is_unique: false,
      is_system: false,
      is_computed: false,
      ui_order: 1,
    } as CMSField,
    {
      id: "2",
      slug: "avatar_url",
      field_label: "Avatar URL",
      field_type: "text_single",
      is_required: false,
      model_id: "m1",
      is_unique: false,
      is_system: false,
      is_computed: false,
      ui_order: 2,
    } as CMSField,
    {
      id: "3",
      slug: "user_id",
      field_label: "User",
      field_type: "reference",
      is_required: false,
      model_id: "m1",
      is_unique: false,
      is_system: false,
      is_computed: false,
      ui_order: 3,
    } as CMSField,
  ]

  const mockUsers = [
    {
      id: "user-1",
      display_name: "John Doe",
      avatar_url: "https://avatar.com/1",
    },
  ]

  it("should initialize with initial data and unwrap JSON", () => {
    const initialData = {
      name: "Initial Name",
      metadata: '{"key": "value"}',
    }
    const core = new FormCore("posts", mockSchema, [], initialData)

    expect(core.values.name).toBe("Initial Name")
    expect(core.values.metadata).toEqual({ key: "value" })
    expect(core.isDirty).toBe(false)
  })

  it("should update value and set dirty flag", () => {
    const core = new FormCore("posts", mockSchema, [], {})
    core.setValue("name", "New Name")

    expect(core.values.name).toBe("New Name")
    expect(core.isDirty).toBe(true)
  })

  it("should validate required fields", async () => {
    const core = new FormCore("posts", mockSchema, [], {})

    const isValidBefore = await core.validate()
    expect(isValidBefore).toBe(false)
    expect(core.errors.name).toBe("This field is required")

    core.setValue("name", "John")
    const isValidAfter = await core.validate()
    expect(isValidAfter).toBe(true)
    expect(core.errors.name).toBeUndefined()
  })

  it("should apply author auto-sync policy", () => {
    const core = new FormCore("authors", mockSchema, mockUsers, {})

    core.setValue("user_id", "user-1")

    expect(core.values.name).toBe("John Doe")
    expect(core.values.avatar_url).toBe("https://avatar.com/1")
  })

  it("should not overwrite existing author data during auto-sync", () => {
    const core = new FormCore("authors", mockSchema, mockUsers, {
      name: "Existing Name",
    })

    core.setValue("user_id", "user-1")

    expect(core.values.name).toBe("Existing Name")
    expect(core.values.avatar_url).toBe("https://avatar.com/1")
  })

  it("should prepare submission data correctly", () => {
    const schemaWithComputed: CMSField[] = [
      ...mockSchema,
      {
        id: "4",
        slug: "computed",
        field_label: "Computed",
        field_type: "text_single",
        is_computed: true,
        model_id: "m1",
        is_required: false,
        is_unique: false,
        is_system: false,
        ui_order: 4,
      } as CMSField,
    ]
    const core = new FormCore("posts", schemaWithComputed, [], {
      name: "Test",
      computed: "should be removed",
      _resolved: "should be removed",
    })

    const submissionData = core.getSubmissionData()

    expect(submissionData.name).toBe("Test")
    expect(submissionData.computed).toBeUndefined()
    expect(submissionData._resolved).toBeUndefined()
  })

  it("should handle teams model special fields in submission data", () => {
    const teamSchema: CMSField[] = [
      {
        id: "1",
        slug: "league",
        field_label: "League",
        field_type: "reference",
        model_id: "m1",
        is_required: false,
        is_unique: false,
        is_system: false,
        is_computed: false,
        ui_order: 1,
      } as CMSField,
    ]
    const core = new FormCore("teams", teamSchema, [], {
      league: "league-1",
    })

    const submissionData = core.getSubmissionData()
    expect(submissionData.league).toEqual(["league-1"])
  })

  it("should notify state changes", () => {
    const onStateChange = vi.fn()
    const core = new FormCore("posts", mockSchema, [], {}, onStateChange)

    core.setValue("name", "Changed")

    expect(onStateChange).toHaveBeenCalled()
    const lastCall =
      onStateChange.mock.calls[onStateChange.mock.calls.length - 1][0]
    expect(lastCall.values.name).toBe("Changed")
    expect(lastCall.isDirty).toBe(true)
  })
})
