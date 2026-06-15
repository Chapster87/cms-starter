/**
 * Simple object diffing utility to find changes between two objects.
 * Returns only the keys from newData that are different from oldData.
 */
export function getDelta(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown>
): Record<string, unknown> {
  const delta: Record<string, unknown> = {}

  if (!oldData) return newData

  Object.keys(newData).forEach((key) => {
    const oldValue = oldData[key]
    const newValue = newData[key]

    // Skip technical/internal fields if they aren't part of the actual content
    if (key === "id" || key === "created_at" || key === "updated_at") return

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      delta[key] = newValue
    }
  })

  return delta
}

/**
 * Checks if two values are deeply equal.
 */
export function isDeepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true

  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false
  }

  const o1 = obj1 as Record<string, unknown>
  const o2 = obj2 as Record<string, unknown>

  const keys1 = Object.keys(o1)
  const keys2 = Object.keys(o2)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!keys2.includes(key) || !isDeepEqual(o1[key], o2[key])) {
      return false
    }
  }

  return true
}
