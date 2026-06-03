# Skill: Plan Update

Use this set of instructions when the user asks to "update the plan" or "add to the implementation plan".

## Objectives

- Maintain a centralized, source-of-truth document for the project's roadmap (usually `CONTEXT.md` or a specific file in `docs/plans/`).
- Ensure new features, feedback, or architectural decisions are captured immediately.
- Use clear, actionable task lists with checkboxes.

## Workflow

1. **Identify the Target:** Determine which file holds the primary plan (check `CONTEXT.md` first, then `docs/plans/`).
2. **Analyze Feedback:** Extract specific requirements from the user's latest messages (e.g., status indicators, configuration toggles).
3. **Categorize:** Add the new items to the appropriate section:
   - `Immediate Tasks`: Critical bugs or small UI fixes.
   - `Next Steps`: Feature implementations currently in progress.
   - `Future Roadmap`: Long-term goals or "nice-to-have" features.
4. **Detail the Implementation:** If the user provides specific logic (e.g., "configurable attribute on models"), break it down into technical sub-tasks:
   - Database schema changes (metadata/columns).
   - API updates.
   - UI component adjustments.
5. **Verify and Clean:** Ensure the document remains readable and follows the project's formatting style.

## Standard "Draft/Publish" Checklist Template

When adding draft/publish flows, include these steps:

- [ ] **Schema:** Add `has_draft_mode` (boolean) to the `models` registry table.
- [ ] **Schema:** Add `status` (text/enum) to target model tables.
- [ ] **API:** Update record listing to include status field.
- [ ] **UI:** Add status toggle/indicator to `RecordForm`.
- [ ] **UI:** Update `ReferenceField` to show colored status dots (Green = Published, Gold = Draft).
