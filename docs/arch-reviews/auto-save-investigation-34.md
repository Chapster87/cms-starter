# Investigation: Auto-save Redundancy and Debounce Logic (#34)

## Summary of Findings

The current auto-save implementation in ForgeCMS is redundant and inefficient due to a layered approach where both the form engine hook and the client-side component manage independent timers. This leads to multiple save requests and potential race conditions.

### 1. Timer Redundancy

- **`useFormStateEngine.ts`**: Implements a `2000ms` debounce timer (`autoSaveTimerRef`) triggered by internal state changes.
- **`EditRecordClient.tsx`**: Implements a `3000ms` debounce timer (`autoSaveTimer`) triggered by the `onChange` callback from the form.
- **Result**: Typing in a field starts two timers. The 2s timer usually wins, but the 3s timer remains active and will attempt a second save unless the user keeps typing to reset it.

### 2. Complex Field Impact

- **Rich Text & Modular Content**: These fields emit large payloads frequently (on every keystroke or block change).
- **Performance**: Because there is no throttling at the field level, the entire `RecordForm` re-renders and the multi-layered auto-save logic starts over on every character typed.
- **Payload size**: Modular content fields send the entire block array on every change, making redundant auto-saves expensive for the server and database.

### 3. Proposed Unified Mechanism

- **Consolidate at the Hook Level**: Move all auto-save responsibility into `useFormStateEngine.ts`.
- **Remove Timer from `EditRecordClient`**: The client should only handle the "save" action when explicitly called by the hook.
- **Introduce Field-Level Throttling**: For high-frequency fields (Rich Text, Modular Content), implement a local debounce (e.g., 500ms) before bubbling the change to the `formStateEngine`. This reduces React re-renders.
- **Configurable Debounce**: Standardize on a single configurable value (default 2000ms) for the actual network request.

## Action Items (to be graduated to tickets)

1. Remove auto-save timer logic from `EditRecordClient.tsx`.
2. Refactor `useFormStateEngine.ts` to be the single source of truth for auto-save triggers.
3. Implement field-level debouncing for `RichTextField` and `ModularContentField`.
