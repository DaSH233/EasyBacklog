---
id: BACK-790
title: Add English and Simplified Chinese switching to the Web UI
status: Done
assignee:
  - '@Codex'
created_date: '2026-10-25T07:55:00Z'
updated_date: '2026-11-10T09:20:00Z'
labels: []
dependencies: []
references:
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/94f70c81fd979129aaaaa0131eedcd67ac3352cd
modified_files:
  - src/web/contexts/LanguageContext.tsx
  - src/web/locales/zh-CN.json
  - src/web/App.tsx
  - src/web/components/AcceptanceCriteriaEditor.tsx
  - src/web/components/AcceptanceCriteriaProgress.tsx
  - src/web/components/Board.tsx
  - src/web/components/BoardLoadingSkeleton.tsx
  - src/web/components/BoardPage.tsx
  - src/web/components/BranchIndexingIndicator.tsx
  - src/web/components/CleanupModal.tsx
  - src/web/components/DecisionDetail.tsx
  - src/web/components/DependencyGraphSection.tsx
  - src/web/components/DependencyInput.tsx
  - src/web/components/DocumentationDetail.tsx
  - src/web/components/DraftsList.tsx
  - src/web/components/DuplicateIdRepairModal.tsx
  - src/web/components/DuplicateIdWarning.tsx
  - src/web/components/ErrorBoundary.tsx
  - src/web/components/HealthIndicator.tsx
  - src/web/components/InitializationScreen.tsx
  - src/web/components/Layout.tsx
  - src/web/components/MilestonesPage.tsx
  - src/web/components/Modal.tsx
  - src/web/components/Navigation.tsx
  - src/web/components/RecordArchive.tsx
  - src/web/components/Settings.tsx
  - src/web/components/SideNavigation.tsx
  - src/web/components/Statistics.tsx
  - src/web/components/SuccessToast.tsx
  - src/web/components/TaskCard.tsx
  - src/web/components/TaskColumn.tsx
  - src/web/components/TaskDetailsModal.tsx
  - src/web/components/TaskList.tsx
  - src/web/components/AmbiguousIdNotice.tsx
  - src/web/components/ChipInput.tsx
  - src/web/components/LoadingSpinner.tsx
  - src/web/components/ProjectBadge.tsx
  - src/web/components/TaskTypeBadge.tsx
  - src/web/components/ThemeToggle.tsx
  - src/web/components/LabelFilterDropdown.tsx
  - src/web/components/StoredDate.tsx
  - src/web/components/LocalizedMarkdownEditor.tsx
  - src/test/web-language.test.tsx
  - README.md
ordinal: 400000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User confirmed scope in chat on 2026-10-25 in place of an issue: make the Web UI usable in Simplified Chinese while retaining English and preserving user-authored content.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Settings switches between English and Simplified Chinese immediately without losing unsaved input
- [x] #2 Language preference survives reload; invalid or unavailable storage defaults safely to English
- [x] #3 Navigation, pages, forms, dialogs and UI messages use a shared translation catalog with English fallback
- [x] #4 Task content and configured status, priority and type values remain unchanged
- [x] #5 Language behavior is covered by tests and documented
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bun run check:types passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Restore local CLI and dependency tooling. 2. Add a shared browser language context and translation catalog. 3. Localize Web presentation strings and add the settings selector. 4. Test persistence, switching, fallback and data preservation; run Web regression checks and build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validation complete: 456 Web regression tests passed across 46 files (2681 assertions), including language persistence, unavailable storage, live navigation/settings updates, preserved unsaved input, and Markdown toolbar switching. Type checking, repository Biome checks, production build, and git diff --check passed. Browser verified English/Chinese switching and reload persistence. Tooling repaired using frozen dependency installation, source CLI, pinned Groma invocation, and repository-local LF settings. Simplification review retained one translation context/catalog and one shared editor wrapper; no runtime dependencies added.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added immediate English/Simplified Chinese switching in Web Settings with browser-local persistence and English fallback. Localized Web navigation, forms, dialogs, feedback and Markdown editor controls while preserving task content, configured values and unsaved edits. Documented the setting and added integration coverage. All scoped checks passed.
<!-- SECTION:FINAL_SUMMARY:END -->
