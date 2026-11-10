---
id: BACK-792
title: Add Web task archive list and restore action
status: Done
assignee:
  - '@Codex'
created_date: '2026-10-29T08:04:00Z'
updated_date: '2026-11-09T08:41:00Z'
labels: []
dependencies: []
references:
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/94f70c81fd979129aaaaa0131eedcd67ac3352cd
ordinal: 402000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Archive page lists and searches archived tasks and opens read-only details
- [x] #2 Restore uses core lifecycle, preserves ID/status and refreshes active data; failures remain visible
- [x] #3 English and Chinese navigation and responsive browser verification
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Expose task archive listing and restore HTTP endpoints; add sidebar route with search, detail links and per-task restore; verify API lifecycle and browser interactions.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User requested archive UI match All Tasks table styling and sidebar icon alignment; replacing cards with compact table and matching 20px icon.

Follow-up: share status colors and column sort logic with All Tasks; archive defaults to descending ID and gains Created column.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Task archive sidebar entry and /archive deep link, searchable archive list, read-only detail modal, confirmation and per-task restore. Added list/restore HTTP endpoints using Core.restoreTask with lock and identity conflict handling and post-move commit warnings. Restores refresh active data and retain original ID, status and bytes. English/Chinese labels and narrow-screen sidebar collapse included. Verified 37 scoped tests passed, 3 platform skips; Bun typecheck, tsc, Biome and build passed. Edge verified actual archive reads, detail return, mocked restore cancel/conflict/success, Chinese labels and 390px layout. Real HTTP restore tested in a throwaway project; historical user records were not restored.

UI follow-up: replaced archive cards with compact All Tasks-style table (ID, title, status, priority, assignee, restore action), aligned page shell, typography, borders and row hover states. Dedicated archive icon is 20x20 like adjacent navigation icons. Verified desktop screenshot, 390px contained horizontal table scrolling, English/Chinese labels, search/detail and restore cancel/failure/success browser flows. Typecheck, Biome and build pass.

Archive sorting follow-up: extracted shared task-table sorting and status colors used by All Tasks and Archive. Added Created column using StoredDate/configured date format; default numeric ID descending, header toggles for ID/title/status/priority/created with arrows and aria-sort. Verified 40 regression tests, typecheck, Biome/build and Edge fixture checks for numeric ordering, column toggles, dates and Done badge color.
<!-- SECTION:FINAL_SUMMARY:END -->
