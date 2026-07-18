# Audit: Standardize Auto-save Triggers for Complex Fields (#36)

## Summary of Findings

The current interaction between complex fields (Rich Text, Modular Content) and the auto-save system is highly inefficient, leading to excessive network traffic and server load.

### 1. Trigger Frequency

- **Rich Text**: Every keystroke in the Tiptap editor triggers an `onUpdate` event, which immediately calls the global `onChange` handler.
- **Modular Content**: Any change to a block (keystroke in a sub-field) or structural change (add/remove/reorder) triggers a full array reconstruction and calls the global `onChange`.
- **Result**: A user typing 60 words per minute could be triggering 300+ `onChange` events per minute, each starting the multi-layered debounce timers identified in #34.

### 2. Payload Overhead

- **Large Records**: For records with extensive modular content (e.g., long-form articles with 10+ blocks), each `onChange` event carries a payload of **10-20KB**.
- **Network Congestion**: Frequent transmission of these payloads, even if debounced at 2s/3s, results in a sluggish UI and significant bandwidth usage, especially on slower connections.
- **Database Stress**: Every auto-save results in a full record update in the database, including complex JSON parsing for the modular content and rich text fields.

### 3. Structural Pitfalls

- **No Local State**: Neither `RichTextField` nor `ModularContentField` maintains a "draft" or "buffered" state. They act as controlled components that emit every change immediately to the parent.
- **Re-rendering**: Every `onChange` bubbles up to `useFormStateEngine`, which updates the global `formState`, triggering a re-render of the _entire_ form. This is especially noticeable with large modular content fields.

## Recommendations

### 1. Field-Level Throttling (Debouncing)

- Implement a **local debounce** (e.g., 500ms) within `RichTextField` and `ModularContentField` before calling the parent `onChange`. This prevents the "every keystroke" re-render of the global form.

### 2. Partial Updates (Future Consideration)

- For modular content, consider a mechanism to only send the changed block rather than the entire array. However, this would require significant changes to the API and database update logic.

### 3. Change Detection

- Implement shallow or deep comparison in the form engine to ensure `onChange` is only called if the data has actually changed (though this is already largely handled by React's state logic, the _payload_ preparation happens regardless).

## Action Items (to be graduated to tickets)

1. Add `useDebounce` hook or similar throttling to `RichTextField`'s `onUpdate` handler.
2. Add throttling to `ModularContentField` for keystroke-driven changes within blocks.
