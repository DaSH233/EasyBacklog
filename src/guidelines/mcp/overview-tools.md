## EasyBacklog Overview (Tools)

Project permission takes precedence: only `automaticTaskManagement: true` allows automatic task creation and updates for authorized development. False, missing, or unknown permission means task mutations require an explicit user task request. Read-only inspection remains allowed. Never enable this setting on the user's behalf without authorization. Preserve verification requirements either way; refresh permission when project/configuration changes.

EasyBacklog tracks committed work. Create a task when work requires planning, decisions, or handoff notes. Skip task creation for questions, exploration, and obvious mechanical edits.

For new requirements, search with a keyword and limit using `task_search` or `task_list`, then read matching work with `task_view`. Use the existing task, or follow the creation guide if none fits.

### Reuse loaded guides

Read each guide once per conversation/project/tool version; re-read when any of these changes, instructions change, or context is lost. Load only CLI or MCP, not both. Do not poll versions. Refresh task snapshots after possible external edits, failed/uncertain updates, or lost context.

Known task ID: read it directly. New requirement or unknown ID: search by keyword with a limit (for example, 10), then read likely matches; broaden only as needed.

### Required Guides

Call `get_backlog_instructions` and read the matching `instruction` before acting:

- `task-creation` — before creating or splitting tasks
- `task-execution` — before planning, changing status or assignee, adding notes, or implementing
- `task-finalization` — before checking acceptance criteria, writing final summaries, or marking work finished

These are the same guides exposed at `backlog://workflow/...`. Omit `instruction` or use `overview` for this overview; it does not replace the detailed guides.

### Task Lifecycle

Mark finished work Done (or the configured final status) and leave it on the board until periodic cleanup. `task_archive` moves a task in any status off the board: finished work during cleanup, and canceled, duplicate, or invalid work at any time.


Leave finished tasks on the board until authorized periodic cleanup; do not automatically archive or delete. Archived tasks must be restored before editing and retain their previous status.

### On-demand reference

For MCP filters, parent/dependency fields, field replacement, legacy-section errors, document paths, or archive/restore/delete behavior, read `get_backlog_instructions` with `instruction: "workflow-reference"` (resource `backlog://workflow/workflow-reference`) only when needed. Consult command help or tool schemas for unfamiliar fields; never guess. Use the supported CLI/MCP interface, never edit Backlog record Markdown directly.
