---
id: BACK-794
title: Browse and restore all archived record categories in Web UI
status: Done
assignee:
  - '@Codex'
created_date: '2026-10-29T08:50:00Z'
updated_date: '2026-11-09T08:41:00Z'
labels: []
dependencies: []
references:
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/94f70c81fd979129aaaaa0131eedcd67ac3352cd
ordinal: 404000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Archive page has task, draft, document, decision and milestone categories with search and preview
- [x] #2 Each category restores records preserving contents and refusing conflicting IDs or paths
- [x] #3 Restores refresh counts and active views; English/Chinese UI and failure states verified
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Follow-up: make archive category switcher a prominent sticky tab bar with accessible tab/panel roles and keyboard navigation; verify served UI.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Expanded /archive into task/draft/document/decision/milestone categories with query-string selection, search, sorting, read-only previews and individual restore. Existing document/decision core restores reused; draft/milestone restores added with create locking (plus draft lock), identity collision checks, exclusive file move and post-move commit warnings. Milestone restores broadcast milestone changes. Sidebar count includes all categories. Verified 27 tests/121 assertions, HTTP restores in temporary projects, exact bytes/nested paths, missing/duplicate/occupied destinations, typechecks, Biome and build. Edge verified all four added categories, preview/search/cancel/conflict/success using mocked restore responses, plus Chinese 390px layout. Existing user archives were not restored by testing.

Category switcher is now a sticky high-contrast tab bar with selected underline, tab/tabpanel semantics and Left/Right/Home/End navigation. Restarted preview service; Edge verified all five tabs load their tables and keyboard selection works. Typecheck and build passed.
<!-- SECTION:FINAL_SUMMARY:END -->
