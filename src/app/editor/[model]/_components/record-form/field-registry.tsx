import React from "react"
import * as Renderers from "./field-renderers"
import { FieldRendererProps } from "./types"

/**
 * Registry mapping CMS field types to their respective renderer components.
 */
const FIELD_REGISTRY: Record<
  string,
  React.ComponentType<FieldRendererProps>
> = {
  boolean: Renderers.BooleanRenderer,
  number: Renderers.NumberRenderer,
  text_multi: Renderers.TextMultiRenderer,
  rich_text: Renderers.RichTextRenderer,
  select: Renderers.SelectRenderer,
  color: Renderers.ColorRenderer,
  seo_slug: Renderers.SlugRenderer,
  media: Renderers.MediaRenderer,
  seo_metadata: Renderers.SeoRenderer,
  tags: Renderers.TagRenderer,
  json: Renderers.JsonRenderer,
  modular_content: Renderers.ModularContentRenderer,
  structured_text: Renderers.StructuredTextRenderer,
  date_time: Renderers.DateRenderer,
  reference: Renderers.ReferenceRenderer,
  navigation: Renderers.NavigationRenderer,
  standings_table: Renderers.StandingsRenderer,
}

/**
 * A central registry component that delegates rendering to specialized sub-components
 * based on the field type.
 */
export function FieldRegistry(props: FieldRendererProps) {
  const { field } = props

  // Special case: 'slug' is always handled by SlugRenderer regardless of its type
  if (field.slug === "slug") {
    return <Renderers.SlugRenderer {...props} />
  }

  const Renderer =
    FIELD_REGISTRY[field.field_type] || Renderers.TextSingleRenderer

  return <Renderer {...props} />
}
