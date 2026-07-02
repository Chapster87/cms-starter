import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

/**
 * Standardizes dnd-kit sensor configuration across the application.
 * Includes pointer distance constraints to prevent accidental drags
 * and standard keyboard coordinate getters for accessibility.
 *
 * @returns {SensorDescriptor[]} The configured sensors
 */
export function useDndSensors() {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  return sensors
}
