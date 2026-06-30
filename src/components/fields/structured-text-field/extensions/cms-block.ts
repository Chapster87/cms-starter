import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import BlockNodeView from "../_components/block-node-view"

export interface CMSBlockOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    cmsBlock: {
      /**
       * Insert a CMS block
       */
      insertCmsBlock: (attributes: {
        blockId: string
        blockType: string
        data: Record<string, unknown>
      }) => ReturnType
    }
  }
}

export const CmsBlock = Node.create<CMSBlockOptions>({
  name: "cmsBlock",

  group: "block",

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      blockId: {
        default: null,
      },
      blockType: {
        default: null,
      },
      data: {
        default: {},
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cms-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "cms-block" }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockNodeView)
  },

  addCommands() {
    return {
      insertCmsBlock:
        (attributes) =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name, attrs: attributes })
            .run()
        },
    }
  },
})
