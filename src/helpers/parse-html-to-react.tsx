import React from "react"
import parse, { DOMNode, domToReact, Element } from "html-react-parser"
import Heading from "@/components/typography/heading"
import Text from "@/components/typography/text"
import Link from "@/components/link"
import clsx from "clsx"

/**
 * Converts an HTML string into React elements, mapping specific HTML tags
 * to custom React components for consistent styling and behavior.
 * Properties (attributes) are preserved where applicable for the mapped components.
 * Unmapped native HTML elements will also attempt to apply corresponding CSS module classes.
 *
 * @param {string} htmlString - The HTML string to parse.
 * @param {object} stylesModule - The CSS module object (e.g., 's' from a .module.css file).
 * @returns {React.ReactNode} The parsed React elements.
 */
export function parseHtmlToReact(
  htmlString: string,
  stylesModule: { [key: string]: string | undefined } // Allow undefined for keys
): React.ReactNode {
  const options = {
    replace: (domNode: DOMNode) => {
      if (domNode instanceof Element) {
        const { attribs } = domNode
        const children = domToReact(domNode.children as DOMNode[])
        const originalHtmlClasses = (attribs.class || "")
          .split(" ")
          .filter(Boolean) // Split and remove empty strings

        // Helper to combine class names, making sure to return undefined if the result is an empty string
        const getCombinedClassName = (
          tagName: string,
          htmlClasses: string[]
        ): string | undefined => {
          const resolvedClasses = htmlClasses.map(
            (cls) => stylesModule[cls] || cls
          ) // Map to module class if exists, else keep original
          const tagModuleClass = stylesModule[tagName]

          const combined = clsx(tagModuleClass, ...resolvedClasses)
          return combined || undefined // Return undefined if empty
        }

        // Map <p> to <Text> component
        if (domNode.name === "p") {
          const finalClassName = getCombinedClassName(
            domNode.name,
            originalHtmlClasses
          )
          return (
            <Text {...(finalClassName ? { className: finalClassName } : {})}>
              {children}
            </Text>
          )
        }

        // Map <h1> to <h6> to <Heading> components
        if (domNode.name.match(/^h[1-6]$/)) {
          const semanticLevel = domNode.name as
            | "h1"
            | "h2"
            | "h3"
            | "h4"
            | "h5"
            | "h6"

          let displayAsLevel: typeof semanticLevel = semanticLevel
          let headingOriginalHtmlClasses = [...originalHtmlClasses] // Copy array
          const classMatch = originalHtmlClasses.find((cls) =>
            cls.match(/^h[1-6]$/)
          )

          if (classMatch && classMatch[0]) {
            displayAsLevel = classMatch as typeof semanticLevel
            // Exclude the class used for display prop from the className list
            headingOriginalHtmlClasses = headingOriginalHtmlClasses.filter(
              (name) => name !== classMatch
            )
          }

          const headingProps: {
            level: typeof semanticLevel
            display?: typeof semanticLevel
            className?: string
          } = {
            level: semanticLevel,
          }

          if (displayAsLevel !== semanticLevel) {
            headingProps.display = displayAsLevel
          }

          const finalHeadingClassName = getCombinedClassName(
            domNode.name,
            headingOriginalHtmlClasses
          )

          if (finalHeadingClassName) {
            headingProps.className = finalHeadingClassName
          }

          return <Heading {...headingProps}>{children}</Heading>
        }

        // Map <a> to <Link> component
        if (domNode.name === "a") {
          const linkProps: {
            href: string // 'href' is now always required
            openInNewTab?: boolean
            rel?: string
            className?: string
          } = {
            href: attribs.href || "#", // Default to "#" if href is missing
          }

          if (attribs.target === "_blank") {
            linkProps.openInNewTab = true
          }
          if (attribs.rel && attribs.rel !== "") {
            linkProps.rel = attribs.rel
          }

          const finalLinkClassName = getCombinedClassName(
            domNode.name, // "a"
            originalHtmlClasses
          )

          if (finalLinkClassName) {
            linkProps.className = finalLinkClassName
          }

          return <Link {...linkProps}>{children}</Link>
        }

        // For other native HTML tags (e.g., div, ul, ol, li, strong, em, blockquote, img, pre, code)
        const defaultElementProps: Record<
          string,
          string | boolean | undefined | number | null | React.ReactNode
        > = { ...attribs }

        const finalDefaultElementClassName = getCombinedClassName(
          domNode.name, // Pass the actual HTML tag name
          originalHtmlClasses // Pass the array of HTML classes
        )

        if (finalDefaultElementClassName) {
          defaultElementProps.className = finalDefaultElementClassName
        } else {
          delete defaultElementProps.className
        }

        return React.createElement(domNode.name, defaultElementProps, children)
      }
      // For other nodes (e.g., text, comments), return undefined to let the parser
      // handle them with its default behavior.
      return undefined
    },
  }

  return parse(htmlString, options)
}
