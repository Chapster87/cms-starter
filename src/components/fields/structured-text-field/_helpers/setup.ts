import StarterKit from "@tiptap/starter-kit"
import { Color } from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import Underline from "@tiptap/extension-underline"

import { CmsBlock } from "../extensions/cms-block"

/**
 * Get the default extensions for the Structured Text Editor
 * @returns Array of Tiptap extensions
 */
export function getExtensions() {
  return [
    StarterKit.configure({
      codeBlock: false,
      link: false,
      underline: false,
    }),
    TextStyle,
    Color,
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Image,
    Highlight.configure({ multicolor: true }),
    CmsBlock,
  ]
}
