import { ModelRegistryEntry, ModelGroup } from "@/hooks/use-models"

export interface TreeItemModel extends ModelRegistryEntry {
  type: "model"
  children?: never
}

export interface TreeItemGroup extends Omit<ModelGroup, "type"> {
  type: "group"
  children: TreeItem[]
}

export type TreeItem = TreeItemModel | TreeItemGroup

import { FlattenedItem } from "@/helpers/tree-helpers"

export type FlattenedTreeItem = FlattenedItem<TreeItem>

/**
 * Builds a hierarchical tree from a flat list of models and groups.
 * Groups and models are interleaved based on their display_order at the top level.
 * Models with a group_id are nested within that group.
 */
export function buildTree(
  models: ModelRegistryEntry[],
  groups: ModelGroup[]
): TreeItem[] {
  const tree: TreeItem[] = []

  // Create groups and standalone models first
  const groupMap = new Map<string, TreeItemGroup>()
  groups.forEach((g) => {
    const groupItem: TreeItemGroup = {
      ...g,
      type: "group",
      children: [],
    }
    groupMap.set(g.id, groupItem)
  })

  const topLevelModels: TreeItemModel[] = models
    .filter((m) => !m.group_id)
    .map((m) => ({ ...m, type: "model" }))

  // Add models to groups
  models
    .filter((m) => !!m.group_id)
    .forEach((m) => {
      const group = groupMap.get(m.group_id!)
      if (group) {
        group.children.push({ ...m, type: "model" } as TreeItemModel)
      } else {
        topLevelModels.push({ ...m, type: "model" })
      }
    })

  // Combine top-level groups and models, sort by display_order
  const combined: TreeItem[] = [
    ...Array.from(groupMap.values()),
    ...topLevelModels,
  ]
  combined.sort((a, b) => a.display_order - b.display_order)
  tree.push(...combined)

  // Sort children within groups
  groupMap.forEach((group) => {
    group.children.sort((a, b) => a.display_order - b.display_order)
  })

  return tree
}

/**
 * Finds an item in the tree by its ID.
 */
export function findTreeItem(items: TreeItem[], id: string): TreeItem | null {
  for (const item of items) {
    if (item.id === id) return item
    if (item.type === "group" && item.children) {
      const found = findTreeItem(item.children, id)
      if (found) return found
    }
  }
  return null
}
