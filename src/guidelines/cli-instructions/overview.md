## EasyBacklog Overview (CLI)

Project permission takes precedence: only `automaticTaskManagement: true` allows automatic task creation and updates for authorized development. False, missing, or unknown permission means task mutations require an explicit user task request. Read-only inspection remains allowed. Never enable this setting on the user's behalf without authorization. Preserve verification requirements either way; refresh permission when project/configuration changes.

EasyBacklog tracks committed work: what will be built, fixed, or changed.

### When to Use Backlog

Create a task when work requires planning, decisions, or handoff notes. Search for an existing task first when no task ID is known. Skip task creation for questions, exploration, and obvious mechanical edits.

### Find and Read Work

- `backlog search "query" --limit 10 --plain`
- `backlog task list --status "<todo status>" --limit 10 --plain`
- `backlog task list --status "<active status>" --limit 10 --plain`
- `backlog task list --search "login" --labels frontend,bug --limit 20 --plain`
- `backlog task view {{TASK_ID:123}} --plain`

For long lists, use `--max-count` and `--skip`, follow the printed `Next` command, or use `--count` for the total; command help covers the details.

For scripts, `task list`, `task view`, `task <id>`, `draft list`, `decision list`, and `search` accept versioned `--json` output instead of `--plain`. `task list --json --watch` emits complete replacement responses; read successive JSON values, not individual lines. Filters and local scope are unchanged; intermediate edits may be coalesced. Restart for a fresh snapshot.

### Reuse loaded guides

Read each guide once per conversation/project/tool version; re-read when any of these changes, instructions change, or context is lost. Load only CLI or MCP, not both. Do not poll versions. Refresh task snapshots after possible external edits, failed/uncertain updates, or lost context.

Known task ID: read it directly. New requirement or unknown ID: search by keyword with a limit (for example, 10), then read likely matches; broaden only as needed.

### Required Guides

Read the matching guide before taking these actions; this overview does not replace it:

- `backlog instructions task-creation` — before creating or splitting tasks
- `backlog instructions task-execution` — before planning, changing status or assignee, adding notes, or implementing
- `backlog instructions task-finalization` — before checking acceptance criteria, writing final summaries, or marking work finished

Use `backlog <command> --help` before unfamiliar operations. Help describes fields, output, and examples.


Leave finished tasks on the board until authorized periodic cleanup; do not automatically archive or delete. Archived tasks must be restored before editing and retain their previous status.

### On-demand reference

For advanced filters, parent/dependency examples, shell quoting, field replacement, legacy-section errors, document links, or archive/restore/delete behavior, read `backlog instructions workflow-reference` only when needed. Consult command help or tool schemas for unfamiliar fields; never guess. Never edit task, draft, document, decision, or milestone markdown files directly; commands preserve metadata, relationships, and history.
