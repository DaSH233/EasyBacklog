---
id: BACK-417
title: Improve Web UI content viewer sizing and mode persistence
status: Done
assignee:
  - '@Codex'
created_date: 2026-04-25 12:14
updated_date: '2026-11-09T08:41:00Z'
labels:
  - web-ui
  - editor
  - enhancement
dependencies: []
references:
  - https://github.com/MrLesk/Backlog.md/issues/291
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/94f70c81fd979129aaaaa0131eedcd67ac3352cd
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Track GitHub issue #291: improve the content viewer/editor ergonomics in the Web UI.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Long content has a wider responsive viewing/editing surface without layout overlap.
- [x] #2 The chosen view/edit mode is persisted appropriately for the user/session.
- [x] #3 Browser verification or automated coverage confirms the modal remains usable on desktop and mobile widths.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Widen task detail content with a responsive metadata column; align document/decision content widths and constrain editor height/overflow. Remember explicit task/document view/edit choices per record in session storage, preserving archived read-only and unsaved-change safeguards. Verify remount, blocked storage, read-only and narrow/wide layouts.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Expanded responsive task content with a desktop metadata column and stacked mobile layout; aligned document/decision reading surfaces and bounded editor heights. Task/document view preferences persist per record in sessionStorage, with blocked-storage fallback, archived read-only enforcement, and existing unsaved-change safeguards. Verified 93 scoped tests, Bun typecheck, tsc --noEmit, full Biome and build. Edge browser checks with intercepted long-content fixtures passed at 1440px and 390px: no horizontal modal overflow, usable editing toolbar, document edit/preview restored after reload. Browser fixtures did not mutate project records.
<!-- SECTION:FINAL_SUMMARY:END -->
