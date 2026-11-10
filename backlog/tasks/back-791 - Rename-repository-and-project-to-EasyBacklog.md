---
id: BACK-791
title: Rename repository and project to EasyBacklog
status: Done
assignee:
  - '@Codex'
created_date: '2026-10-25T09:02:00Z'
updated_date: '2026-11-10T09:20:00Z'
labels: []
dependencies: []
references:
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/94f70c81fd979129aaaaa0131eedcd67ac3352cd
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/0953bb4ed11c1c89a4bb0911509a0c910e9e5024
modified_files:
  - backlog/config.yml
ordinal: 401000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 GitHub repository and origin use DaSH233/EasyBacklog
- [x] #2 Project display name is EasyBacklog
- [x] #3 Local folder is E:\project\EasyBacklog with existing work preserved
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Set the project display name through CLI, rename GitHub repository and origin, then stop preview and rename the local checkout. Verify each resulting name.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
GitHub repository renamed to DaSH233/EasyBacklog and verified with gh repo view. Origin updated and projectName verified as EasyBacklog. Local folder rename attempted twice from E:\project after stopping preview and resetting REPL tools; Windows refuses because the directory is still in use. Local checkout remains E:\project\Backlog.md with all work preserved. Close applications using this checkout before renaming the folder to EasyBacklog.

Verified on 2026-10-29: active checkout is E:\project\EasyBacklog; old E:\project\Backlog.md no longer exists. Origin is https://github.com/DaSH233/EasyBacklog.git and backlog/config.yml project_name is EasyBacklog. Git still reports the existing local modifications and untracked work, including Chinese UI resources, record-link utilities, archive page and tests. This supersedes the earlier directory-in-use blocker.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Repository/project rename is complete. Confirmed local checkout path, origin URL, project display name, and retained development files/local changes. All three acceptance criteria are satisfied.
<!-- SECTION:FINAL_SUMMARY:END -->
