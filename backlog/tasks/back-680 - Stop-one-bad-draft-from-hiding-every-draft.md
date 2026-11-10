---
id: BACK-680
title: Stop one bad draft from hiding every draft
status: Done
assignee:
  - '@Codex'
created_date: 2026-09-02 20:31
updated_date: '2026-11-09T08:41:00Z'
labels: []
dependencies: []
references:
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/94f70c81fd979129aaaaa0131eedcd67ac3352cd
modified_files:
  - src/file-system/operations.ts
  - src/test/filesystem.test.ts
ordinal: 312000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
listDrafts returns an empty list for ALL drafts when a single draft file fails to parse (src/file-system/operations.ts around line 1309), so one malformed file makes the entire drafts view look empty rather than showing the rest. Tasks and milestones already do the safer thing and skip only the offending file (around lines 925 and 1794), so drafts are the outlier.

Found while auditing the due-date model, but nothing about it is due-date specific: any parse failure in any draft triggers it. A user in this state sees no drafts at all and has no indication that a file is at fault, which reads as data loss rather than as a broken file.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A draft that fails to parse is skipped without affecting the drafts returned alongside it
- [x] #2 Drafts match the behavior tasks and milestones already have for unparseable files
- [x] #3 The user can tell that a file was skipped rather than silently seeing a shorter list
- [x] #4 A test covers a directory containing one unparseable draft and several valid ones
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reuse the tolerant draft reader for all draft lists, report skipped filenames on stderr, and cover mixed valid/invalid files with regression tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented shared tolerant listing with filename warnings; 54 filesystem tests pass. Final type and lint checks pending.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Unified draft listing with the existing tolerant reader. Invalid files no longer hide valid drafts, and stderr warnings identify skipped files without modifying them. Mixed-file regression passes. Combined regression: 113 tests across 7 files; tsc --noEmit, bun check:types, Biome and build passed.
<!-- SECTION:FINAL_SUMMARY:END -->
