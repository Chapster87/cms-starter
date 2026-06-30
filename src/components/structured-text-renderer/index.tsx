"use client"

import React from "react"
import { JSONContent } from "@tiptap/react"

interface StructuredTextRendererProps {
  content: JSONContent | string
  blocks?: Record<
    string,
    React.ComponentType<{ data: Record<string, unknown> }>
  >
}

/**
 * A renderer for Tiptap JSON content (Structured Text).
 * Converts the JSON structure into JSX.
 */
export default function StructuredTextRenderer({
  content,
  blocks = {},
}: StructuredTextRendererProps) {
  const parsedContent = React.useMemo(() => {
    if (!content) return null
    if (typeof content === "object") return content
    try {
      return JSON.parse(content) as JSONContent
    } catch (_e) {
      return null
    }
  }, [content])

  if (!parsedContent || !parsedContent.content) {
    return null
  }

  return (
    <>
      {parsedContent.content.map((node, index) =>
        renderNode(node, index, blocks)
      )}
    </>
  )
}

function renderNode(
  node: JSONContent,
  index: number,
  blocks: Record<string, React.ComponentType<{ data: Record<string, unknown> }>>
): React.ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={index}>
          {node.content?.map((child, i) => renderNode(child, i, blocks))}
        </p>
      )

    case "heading":
      const Level = `h${node.attrs?.level || 1}` as
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
      return (
        <Level key={index}>
          {node.content?.map((child, i) => renderNode(child, i, blocks))}
        </Level>
      )

    case "text":
      let text: React.ReactNode = node.text
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type === "bold") text = <strong>{text}</strong>
          if (mark.type === "italic") text = <em>{text}</em>
          if (mark.type === "underline") text = <u>{text}</u>
          if (mark.type === "strike") text = <s>{text}</s>
          if (mark.type === "link") {
            text = (
              <a
                href={mark.attrs?.href}
                target={mark.attrs?.target}
                rel={mark.attrs?.rel}
              >
                {text}
              </a>
            )
          }
          if (mark.type === "textStyle" && mark.attrs?.color) {
            text = <span style={{ color: mark.attrs.color }}>{text}</span>
          }
          if (mark.type === "highlight") {
            text = (
              <mark style={{ backgroundColor: mark.attrs?.color }}>{text}</mark>
            )
          }
        })
      }
      return <React.Fragment key={index}>{text}</React.Fragment>

    case "bulletList":
      return (
        <ul key={index}>
          {node.content?.map((child, i) => renderNode(child, i, blocks))}
        </ul>
      )

    case "orderedList":
      return (
        <ol key={index}>
          {node.content?.map((child, i) => renderNode(child, i, blocks))}
        </ol>
      )

    case "listItem":
      return (
        <li key={index}>
          {node.content?.map((child, i) => renderNode(child, i, blocks))}
        </li>
      )

    case "blockquote":
      return (
        <blockquote key={index}>
          {node.content?.map((child, i) => renderNode(child, i, blocks))}
        </blockquote>
      )

    case "horizontalRule":
      return <hr key={index} />

    case "hardBreak":
      return <br key={index} />

    case "image":
      return (
        <img
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt}
          title={node.attrs?.title}
        />
      )

    case "cmsBlock":
      const BlockComponent = blocks[node.attrs?.blockType]
      if (BlockComponent) {
        return <BlockComponent key={index} data={node.attrs?.data} />
      }
      return (
        <div
          key={index}
          style={{
            padding: "20px",
            background: "#f5f5f5",
            border: "1px dashed #ccc",
            borderRadius: "4px",
            textAlign: "center",
          }}
        >
          Block: {node.attrs?.blockType} (No renderer found)
        </div>
      )

    default:
      console.warn("Unknown node type:", node.type)
      return null
  }
}
