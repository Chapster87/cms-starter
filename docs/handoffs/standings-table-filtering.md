# Handoff: Rugby Standings Table & Picker Filtering

## Overview

We have implemented a custom `Rugby Standings` field type that allows admins to manage team statistics in a spreadsheet-like grid within the CMS. The field is stored as a `jsonb` payload.

## Current Status

- [x] **Field Grouping Tabs**: Refactored the field type selector to use Radix Tabs (Basic, Content, Relational, Advanced).
- [x] **Standings Grid**: Built `StandingsField` with real-time scoring logic (using `src/utils/rugby-logic.ts`).
- [x] **Security**: Enabled RLS on `standings` and added attribution columns (`created_by`, `updated_by`) to core tables.
- [x] **Trigger Logic**: Fixed the "Add Team" button using React Refs to trigger the hidden `ReferenceField`.
- [!] **Filtering Bug (In Progress)**: The team picker in the standings field needs to be filtered by the currently selected `league` and `division` in the same form.

## The Issue

The dynamic filtering in the team picker is not returning any records.

### What we've discovered:

1. **Reference Values**: The `league` and `division` fields in `RecordForm` provide values as arrays (e.g., `["uuid"]`).
2. **Backend Logic**: The `api/records/list` endpoint was updated to handle array filters using the Postgres `IN` operator.
3. **Database Schema**: The `teams` table uses the column name `divison` (typo: missing the second 'i').
4. **Current Error**: The latest server log showed:
   `Error listing table teams: { code: '22P02', details: 'Token "2e982e0c" is invalid.', message: 'invalid input syntax for type json' }`
   This suggests a type mismatch in the Supabase query when applying the array filter to a standard UUID column.

## Remaining Tasks

1. **Fix `src/app/api/records/list/route.ts`**: The last attempt introduced a `typedColumns is not defined` error because the variable was scoped inside an `else` block. Needs to be hoisted.
2. **Validate Picker Filtering**: Ensure the team picker correctly shows teams matching the unwrapped `league` and `divison` UUIDs.
3. **Final Style Check**: Ensure the team names are centered and the "Add Team" button remains stable.

## Relevant Files

- `src/app/api/records/list/route.ts`: Main filtering logic.
- `src/app/editor/[model]/_components/record-form/index.tsx`: Passing dependencies to the field.
- `src/components/fields/standings-field/index.tsx`: Parent field component.
- `src/components/fields/reference-field/index.tsx`: The picker being filtered.

## Suggested Skills

- `grill-me`: To verify the filtering logic if you run into further Postgres type errors.
