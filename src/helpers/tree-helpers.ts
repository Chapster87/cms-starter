/**
 * Shared utilities for hierarchical tree structures and DND operations.
 */

export interface TreeItem {
  id: string
  type: string
  children?: TreeItem[]
}

export type FlattenedItem<T extends TreeItem> = T & {
  parentId: string | null
  depth: number
  index: number
}

export const INDENTATION_WIDTH = 24

/**
 * Flattens a nested tree into a flat array with depth and parent information.
 */
export function flattenTree<T extends TreeItem>(
  items: T[],
  parentId: string | null = null,
  depth = 0
): FlattenedItem<T>[] {
  return items.reduce<FlattenedItem<T>[]>((acc, item, index) => {
    const flattenedItem = {
      ...item,
      parentId,
      depth,
      index,
    } as FlattenedItem<T>
    const children = (item.children || []) as T[]

    return [...acc, flattenedItem, ...flattenTree(children, item.id, depth + 1)]
  }, [])
}

/**
 * Finds an item in the tree by its ID.
 */
export function findItem<T extends TreeItem>(
  list: T[] | undefined,
  id: string
): T | null {
  if (!list) return null
  for (const item of list) {
    if (item.id === id) return item
    if (item.children) {
      const found = findItem(item.children as T[], id)
      if (found) return found
    }
  }
  return null
}

/**
 * Removes an item from the tree by its ID.
 */
export function removeItem<T extends TreeItem>(
  list: T[] | undefined,
  id: string
): boolean {
  if (!list) return false
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list.splice(i, 1)
      return true
    }
    if (list[i].children && removeItem(list[i].children as T[], id)) return true
  }
  return false
}

/**
 * Inserts an item into the tree at a specific location.
 * Handles nesting logic based on projected depth.
 */
export function insertItem<T extends TreeItem>(
  list: T[] | undefined,
  targetId: string,
  item: T,
  after: boolean,
  newDepth: number,
  currentOverItem: (T & { depth: number }) | null
): boolean {
  if (!list) return false
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === targetId) {
      if (
        (list[i].type === "group" || list[i].children) &&
        currentOverItem &&
        newDepth > currentOverItem.depth
      ) {
        const node = list[i]
        node.children = (node.children || []) as T[]
        node.children.unshift(item)
      } else {
        list.splice(after ? i + 1 : i, 0, item)
      }
      return true
    }
    if (
      list[i].children &&
      insertItem(
        list[i].children as T[],
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
export function updateItemInTree<T extends TreeItem>(
  list: T[],
  id: string,
  updated: Partial<T>
): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list[i] = { ...list[i], ...updated }
      return true
    }
    const children = list[i].children
    if (children && updateItemInTree(children as T[], id, updated)) return true
  }
  return false
}

/**
 * Deletes an item from the tree.
 */
export function deleteItemFromTree<T extends TreeItem>(
  list: T[],
  id: string
): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list.splice(i, 1)
      return true
    }
    const children = list[i].children
    if (children && deleteItemFromTree(children as T[], id)) return true
  }
  return false
}

/**
 * Adds an item after (or before) a target item in the tree.
 */
export function addItemToTree<T extends TreeItem>(
  list: T[],
  targetId: string,
  newItem: T,
  after = true
): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === targetId) {
      list.splice(after ? i + 1 : i, 0, newItem)
      return true
    }
    const children = list[i].children
    if (children && addItemToTree(children as T[], targetId, newItem, after))
      return true
  }
  return false
}

/**
 * Adds a sub-item to a target item in the tree.
 */
export function addSubItemToTree<T extends TreeItem>(
  list: T[],
  targetId: string,
  newSub: T
): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === targetId) {
      list[i].children = [...((list[i].children || []) as T[]), newSub]
      return true
    }
    const children = list[i].children
    if (children && addSubItemToTree(children as T[], targetId, newSub))
      return true
  }
  return false
}

/**
 * Calculates the projected depth and parent for an item being dragged.
 */
export function getProjection<T extends TreeItem>(
  items: FlattenedItem<T>[],
  activeId: string,
  overId: string,
  dragOffset: number,
  indentationWidth: number
) {
  const activeIndex = items.findIndex((i) => i.id === activeId)
  const overIndex = items.findIndex((i) => i.id === overId)
  const activeItem = items[activeIndex]

  if (!activeItem || overIndex === -1) {
    return { depth: 0, parentId: null }
  }

  const depthDelta = Math.round(dragOffset / indentationWidth)
  const projectedDepth = activeItem.depth + depthDelta

  // The item above where we are currently hovering
  const prevItem =
    overIndex > 0
      ? activeId === items[overIndex].id
        ? items[overIndex - 1]
        : items[overIndex]
      : null

  // Max depth is restricted by the item above us
  // We can only nest inside groups (or items that support children)
  const maxDepth = prevItem
    ? prevItem.type === "group" || prevItem.children
      ? prevItem.depth + 1
      : prevItem.depth
    : 0

  const depth = Math.max(0, Math.min(projectedDepth, maxDepth))

  // Find the new parent based on the calculated depth
  let parentId: string | null = null
  if (depth > 0 && prevItem) {
    if (depth > prevItem.depth) {
      parentId = prevItem.id
    } else {
      let curr: FlattenedItem<T> | null = prevItem
      while (curr && curr.depth >= depth) {
        curr =
          (items.find((p) => p.id === curr?.parentId) as FlattenedItem<T>) ||
          null
      }
      parentId = curr?.id || null
    }
  }

  return { depth, parentId }
}
