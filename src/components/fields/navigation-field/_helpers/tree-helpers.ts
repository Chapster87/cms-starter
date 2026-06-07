import { NavigationItem } from "@/types/navigation"
import { FlattenedItem as GlobalFlattenedItem } from "@/helpers/tree-helpers"

export interface RecordPreview {
  id: string
  display_name: string
  subtitle?: string
  model_name: string
  model_id?: string
}

export type FlattenedItem = GlobalFlattenedItem<NavigationItem>

export { INDENTATION_WIDTH } from "@/helpers/tree-helpers"
