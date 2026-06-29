"use client"

import {
  BlockGroupRouteModal,
  BlockRouteModal,
  FieldRouteModal,
  GroupRouteModal,
  ModelRouteModal,
} from "./route-modals"

/**
 * SchemaModal is a URL-driven wrapper that handles high-level schema definitions.
 * It coordinates different specialized route modals based on the 'action' query parameter.
 */
export default function SchemaModal() {
  return (
    <>
      <ModelRouteModal />
      <FieldRouteModal />
      <GroupRouteModal />
      <BlockRouteModal />
      <BlockGroupRouteModal />
    </>
  )
}
