import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useFormStateEngine } from "./use-form-state-engine"
import { useAuth } from "@/hooks/use-auth"
import { useUsers } from "@/hooks/use-users"
import { CMSModelName } from "@/types/cms-generated"

// Mock dependencies
vi.mock("@/hooks/use-auth")
vi.mock("@/hooks/use-users")
vi.mock("@/utils/supabase", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: "model-id" } })),
        })),
      })),
    })),
  })),
}))

// Mock fetch
global.fetch = vi.fn()

describe("useFormStateEngine", () => {
  const mockModel = "posts" as CMSModelName
  const mockInitialData = { name: "Initial" }

  beforeEach(() => {
    vi.clearAllMocks()
    // Using type assertion to unknown first to satisfy strict linting of 'any' in mocks
    vi.mocked(useAuth).mockReturnValue({
      accessToken: "token",
    } as unknown as ReturnType<typeof useAuth>)
    vi.mocked(useUsers).mockReturnValue({
      users: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
    } as unknown as ReturnType<typeof useUsers>)
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ slug: "name", is_required: true }]),
    } as Response)
  })

  it("should initialize with initial state", () => {
    const { result } = renderHook(() =>
      useFormStateEngine({ model: mockModel, initialData: mockInitialData })
    )

    expect(result.current.formState.values).toEqual(mockInitialData)
    expect(result.current.fetchingSchema).toBe(true)
  })

  it("should fetch schema on mount", async () => {
    const { result } = renderHook(() =>
      useFormStateEngine({ model: mockModel })
    )

    await waitFor(() => expect(result.current.fetchingSchema).toBe(false))
    expect(result.current.schema).toHaveLength(1)
    expect(result.current.schema[0].slug).toBe("name")
  })

  it("should debounce onAutoSave", async () => {
    vi.useFakeTimers()
    const onAutoSave = vi.fn()
    const { result } = renderHook(() =>
      useFormStateEngine({ model: mockModel, onAutoSave })
    )

    act(() => {
      result.current.actions.setValue("name", "Changed")
    })

    expect(onAutoSave).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onAutoSave).toHaveBeenCalledWith({ name: "Changed" })
    vi.useRealTimers()
  })

  it("should update formState when actions are called", () => {
    const { result } = renderHook(() =>
      useFormStateEngine({ model: mockModel })
    )

    act(() => {
      result.current.actions.setValue("name", "New Value")
    })

    expect(result.current.formState.values.name).toBe("New Value")
    expect(result.current.formState.isDirty).toBe(true)
  })
})
