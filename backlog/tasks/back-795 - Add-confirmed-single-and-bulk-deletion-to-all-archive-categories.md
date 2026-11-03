---
id: BACK-795
title: Add confirmed single and bulk deletion to all archive categories
status: Done
assignee:
  - '@Codex'
created_date: '2026-10-29T09:09:00Z'
updated_date: '2026-10-29T09:46:00Z'
labels: []
dependencies: []
ordinal: 405000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Remove repeated category headings and explanatory text
- [x] #2 Five archive categories support selection, single and bulk permanent deletion with explicit confirmation
- [x] #3 Deletion refuses active or ambiguous records and reports partial failures; temporary fixture verification
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Follow-up: move batch buttons beside search, remove refresh, and add confirmed bulk restore with partial-failure handling for all five categories.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed repeated tab headings/descriptions. Added shared archive deletion controls for all five categories: row selection, select visible results, individual delete, batch delete and explicit confirmation listing exact records/count with irreversible warning. Requests execute only after confirmation; successful items leave the list while failures remain selected with reasons. Backend requires confirmed=true and reuses task/content core deletion; auxiliary draft/milestone deletion uses archive identity checks and existing locks. Verified 27 backend tests/117 assertions, typechecks, Biome/build, and Edge flows for all categories including cancellation, partial failure and single retry. Real deletion only occurred in temporary test projects; existing archive count remains unchanged.

Toolbar follow-up: batch delete and batch restore now sit beside the search input; removed Refresh controls in every category. Bulk restore reuses existing single-record restore endpoints, confirms exact selected records, removes only successes, retains failed selections and refreshes active data/counts once per batch. Edge fixture tests passed cancellation/partial failure/retry for all five restore categories and deletion regression; verified Chinese toolbar screenshot, typecheck, Biome and build. No real archives changed during UI tests.

Checkbox usability follow-up: expanded row and select-all hit areas to 44x44 pixels in all five archive categories with centered 16px controls and hover feedback. Verified edge clicks, select-all toggling, keyboard Space, and no accidental detail opening using browser fixtures. Typecheck, build and repository checks passed; restarted project preview on port 6420. No real archived records modified.
<!-- SECTION:FINAL_SUMMARY:END -->
