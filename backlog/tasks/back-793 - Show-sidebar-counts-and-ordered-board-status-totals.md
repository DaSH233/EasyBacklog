---
id: BACK-793
title: Show sidebar counts and ordered board status totals
status: Done
assignee:
  - '@Codex'
created_date: '2026-10-29T08:39:00Z'
updated_date: '2026-11-09T08:41:00Z'
labels: []
dependencies: []
references:
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/94f70c81fd979129aaaaa0131eedcd67ac3352cd
ordinal: 403000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sidebar shows counts for tasks, drafts, milestones and archived tasks
- [x] #2 Board counts appear in To Do, In Progress, Done order with bilingual accessible labels
- [x] #3 Counts refresh with data changes and show unavailable state on failure
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added sidebar totals for All Tasks, milestones, drafts and task archive. Board shows ordered To Do/In Progress/Done badges using shared status colors and accessible translated labels. Counts refresh on app dataVersion and navigation; loading and failures remain distinct. Verified five sidebar tests (36 assertions), typecheck, Biome/build, and Edge rendered counts (0/1/8, total 9, archive 790 before completion).
<!-- SECTION:FINAL_SUMMARY:END -->
