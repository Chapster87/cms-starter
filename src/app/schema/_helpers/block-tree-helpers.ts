import { CMSBlock, CMSBlockGroup } from "@/types/fields"

export type TreeItemBlock = CMSBlock & { type: "block" }
export type TreeItemGroup = CMSBlockGroup & {
  type: "group"
  children?: TreeItemBlock[]
}
export type TreeItem = TreeItemBlock | TreeItemGroup

export interface FlattenedTreeItem {
  id: string
  type: "block" | "group"
  depth: number
  parentId: string | null
  emoji?: string | null
}

/**
 * Builds a hierarchical tree structure from flat blocks and groups.
 */
export function buildTree(
  blocks: CMSBlock[],
  groups: CMSBlockGroup[]
): TreeItem[] {
  const tree: TreeItem[] = []

  // Add groups
  groups.forEach((group) => {
    tree.push({
      ...group,
      type: "group",
      children: blocks
        .filter((b) => b.group_id === group.id)
        .map((b) => ({ ...b, type: "block" as const }))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    })
  })

  // Add top-level blocks
  blocks.forEach((block) => {
    if (!block.group_id) {
      tree.push({ ...block, type: "block" })
    }
  })

  // Sort top-level by display_order
  return tree.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
}
