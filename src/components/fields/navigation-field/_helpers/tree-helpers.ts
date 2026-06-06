import { NavigationItem } from "@/types/navigation"

export interface RecordPreview {
  id: string
  display_name: string
  subtitle?: string
  model_name: string
  model_id?: string
}

export interface FlattenedItem extends NavigationItem {
  parentId: string | null
  depth: number
  index: number
}

export const INDENTATION_WIDTH = 24

/**
 * Flattens a nested navigation tree into a flat array with depth information.
 */
export function flattenTree(
  items: NavigationItem[],
  parentId: string | null = null,
  depth = 0
): FlattenedItem[] {
  return items.reduce<FlattenedItem[]>((acc, item, index) => {
    return [
      ...acc,
      { ...item, parentId, depth, index },
      ...flattenTree(item.children || [], item.id, depth + 1),
    ]
  }, [])
}

/**
 * Finds an item in the navigation tree by its ID.
 */
export function findItem(
  list: NavigationItem[] | undefined,
  id: string
): NavigationItem | null {
  if (!list) return null
  for (const item of list) {
    if (item.id === id) return item
    if (item.children) {
      const found = findItem(item.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Removes an item from the navigation tree by its ID.
 */
export function removeItem(
  list: NavigationItem[] | undefined,
  id: string
): boolean {
  if (!list) return false
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list.splice(i, 1)
      return true
    }
    if (list[i].children && removeItem(list[i].children, id)) return true
  }
  return false
}

/**
 * Inserts an item into the navigation tree at a specific location.
 * Handles nesting logic based on projected depth.
 */
export function insertItem(
  list: NavigationItem[] | undefined,
  targetId: string,
  item: NavigationItem,
  after: boolean,
  newDepth: number,
  currentOverItem: FlattenedItem | null
): boolean {
  if (!list) return false
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === targetId) {
      if (
        list[i].type === "group" &&
        currentOverItem &&
        newDepth > currentOverItem.depth
      ) {
        const node = list[i]
        node.children = node.children || []
        node.children.unshift(item)
      } else {
        list.splice(after ? i + 1 : i, 0, item)
      }
      return true
    }
    if (
      list[i].children &&
      insertItem(
        list[i].children,
        targetId,
        item,
        after,
        newDepth,
        currentOverItem
      )
    )
      return true
  }
  return false
}

/**
 * Updates an item in the tree.
 */
export function updateItemInTree(
  list: NavigationItem[],
  id: string,
  updated: Partial<NavigationItem>
): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list[i] = { ...list[i], ...updated }
      return true
    }
    const children = list[i].children
    if (children && updateItemInTree(children, id, updated)) return true
  }
  return false
}

/**
 * Deletes an item from the tree.
 */
export function deleteItemFromTree(
  list: NavigationItem[],
  id: string
): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list.splice(i, 1)
      return true
    }
    const children = list[i].children
    if (children && deleteItemFromTree(children, id)) return true
  }
  return false
}

/**
 * Adds an item after (or before) a target item in the tree.
 */
export function addItemToTree(
  list: NavigationItem[],
  targetId: string,
  newItem: NavigationItem,
  after = true
): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === targetId) {
      list.splice(after ? i + 1 : i, 0, newItem)
      return true
    }
    const children = list[i].children
    if (children && addItemToTree(children, targetId, newItem, after))
      return true
  }
  return false
}

/**
 * Adds a sub-item to a target item in the tree.
 */
export function addSubItemToTree(
  list: NavigationItem[],
  targetId: string,
  newSub: NavigationItem
): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === targetId) {
      list[i].children = [...(list[i].children || []), newSub]
      return true
    }
    const children = list[i].children
    if (children && addSubItemToTree(children, targetId, newSub)) return true
  }
  return false
}
