import { atom, getDefaultStore } from "jotai"
import { RecordBase } from "./data-service"

/**
 * Atom to store the current record being edited.
 * This allows multiple components (Header, Sidebar) to stay in sync
 * without passing props through deep component trees or relying on
 * the layout-level fetch which doesn't know about local state changes.
 */
export const activeRecordAtom = atom<RecordBase | null>(null)

// Version atom to force re-renders across consumers
export const editorVersionAtom = atom<number>(0)

const store = getDefaultStore()

/**
 * Public API for updating the active record from anywhere.
 */
export const editorStore = {
  setRecord: (record: RecordBase | null) => {
    store.set(activeRecordAtom, record)
    store.set(editorVersionAtom, (v) => v + 1)
  },
  getRecord: () => {
    return store.get(activeRecordAtom)
  },
}
