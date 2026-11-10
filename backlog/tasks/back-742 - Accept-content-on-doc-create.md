---
id: BACK-742
title: Accept content on doc create
status: Done
assignee:
  - '@Codex'
created_date: 2026-10-11 19:10
updated_date: '2026-11-09T08:41:00Z'
labels:
  - enhancement
dependencies: []
references:
  - https://github.com/MrLesk/Backlog.md/issues/1065
  - >-
    https://github.com/DaSH233/EasyBacklog/commit/94f70c81fd979129aaaaa0131eedcd67ac3352cd
modified_files:
  - src/cli.ts
  - src/guidelines/cli-instructions/task-execution.md
  - CLI-INSTRUCTIONS.md
  - src/test/cli-doc-decision-board.test.ts
type: enhancement
ordinal: 360000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`backlog doc create` takes a title, a path and a type, but no content. A document made from the CLI is always empty and needs a second command (`backlog doc update --content`, to be renamed `backlog doc edit` under BACK-741) before it holds anything. The web UI and the MCP `document_create` tool already create a document together with its content in one step, through the same core function. The CLI is the canonical interface and is the one surface that cannot. `backlog task create` accepts its text fields at creation in the same way.

The maintainer's ruling on issue #1065 is that document commands follow the task commands where a gap like this exists, with every interface calling the same core function. A document body stays free text with no section markers, and nothing else about document storage changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `backlog doc create "<title>" --content <markdown>` creates the document with that body, and `backlog doc view <id> --plain` shows it.
- [x] #2 Without `--content` the command behaves as it does today.
- [x] #3 Multi-line values work with real newlines, and the help schema lists content as a Markdown field the way `backlog doc update` does.
- [x] #4 The file has the same content as one created with the same title, type, path and body through `POST /api/docs` or the MCP `document_create` tool, apart from the ID and dates.
- [x] #5 `backlog doc create --help` and the shipped instruction guides (`backlog instructions`) show the option with an example.
- [x] #6 Tests cover creation with and without content.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 bunx tsc --noEmit passes when TypeScript touched
- [x] #2 bun run check . passes when formatting/linting touched
- [x] #3 bun test (or scoped test) passes
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add --content to doc create and its help schema, pass content through existing shared creation core, document the option in shipped guides, and test multiline and empty creation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added --content using existing shared creation core and updated shipped guide/help. 21 CLI integration tests passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added optional --content to doc create and forwarded it to the shared document creation core. Help schema and shipped instructions include Markdown examples. Verified multiline Chinese content, empty creation, view output, shared-core parity, and existing Web/MCP document tests. Combined regression: 113 pass; both type checks, Biome and build passed.
<!-- SECTION:FINAL_SUMMARY:END -->
