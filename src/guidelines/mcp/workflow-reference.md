## Workflow Reference

Read only for the operation you need. Core workflow and verification rules remain in the phase guides.

### MCP Tools Quick Reference

- `get_backlog_instructions`
- `task_list` and `task_search` accept configured task types with OR semantics; `task_search` also accepts `modifiedFiles` for case-insensitive substring filtering against project-root-relative modified file paths
- `task_list` and `task_search` also accept configured `project` values with OR semantics for monorepo-style backlogs; the field is absent from both tool schemas when no `projects:` list is configured
- `task_edit` accepts `commentsAppend` and optional `commentAuthor` to append task discussion or review comments
- Comment bodies may contain Markdown, but standalone `---` lines are reserved as comment delimiters
- `task_edit` accepts `definitionOfDoneAdd`, `definitionOfDoneRemove`, `definitionOfDoneCheck`, `definitionOfDoneUncheck` for **exceptional** task-level DoD updates only
- `task_view` output includes the Definition of Done checklist with checked state

- `task_list` — list tasks with optional filtering by status, configured task type, configured project, assignee (or `unassigned: true`), milestone, labels, search, `ready: true` for unblocked tasks, or limit
- `task_search` — search tasks by title and description, or filter by configured task type, configured project, and project-root-relative `modifiedFiles` path substrings
- `task_view` — read full task context (description, plan, notes, comments, final summary, acceptance criteria, Definition of Done)
- `definition_of_done_defaults_get` — read project-level Definition of Done defaults from config
- `definition_of_done_defaults_upsert` — replace project-level Definition of Done defaults in config
- `document_list` — list documents, including type, path, timestamps, and tags
- `document_view` — view document metadata and markdown content
- `document_create` — create a document with title, content, optional type/tags, and optional docs-directory-relative path
- `document_update` — update document content, optional title/type/tags, and optional docs-directory-relative path
- `document_archive` moves a document's file unchanged to the same relative path under `backlog/archive/docs/`. The ID stays reserved. An archived document leaves `document_list` and `document_search`, stays viewable with `document_view`, and is read-only: `document_update` on it fails until it is restored. No task is changed; the result names the tasks and drafts whose documentation list names the moved file.
- `document_restore` moves an archived document's file back, unchanged, to the same relative path under `backlog/docs/`. The document keeps its ID and can be updated again. A file already at that path is never replaced.
- `document_delete` permanently removes an archived document's file and releases its ID once no other file and no committed file on any branch uses the number. Removing a document takes two steps: `document_archive`, then `document_delete`. Delete works only on an archived document and asks no question. No task is changed; the result names the tasks and drafts whose documentation list names the removed file, by its archive path or by the path it had before it was archived.
- `document_search` — search documents using the shared fuzzy index
- `task_create` — create new tasks with description and acceptance criteria; DoD fields are for **exceptional** task-level overrides only (`definitionOfDoneAdd`, `disableDefinitionOfDoneDefaults`)
- `task_edit` — update task metadata, status, plan, notes, comments (`commentsAppend` with optional `commentAuthor`), final summary, acceptance criteria, task-level Definition of Done (`definitionOfDoneAdd/Remove/Check/Uncheck`) for **exceptional** per-task updates, and dependencies
- DoD is not acceptance criteria: acceptance criteria define scope/behavior, while DoD tracks completion hygiene
- Comments are for discussion and review notes; Implementation Notes are for execution progress; Final Summary is the PR-style completion summary. Comment bodies may contain Markdown, but standalone `---` lines are reserved as comment delimiters.
- `task_archive` — move a task in any status off the board into the archive; keeps its ID, record, dependencies, and references. Archived tasks are read-only, stay viewable with `task_view`, and are marked `archived` in `task_search` results. A dependency on an archived task counts as satisfied only when that task is in the final status.
- `task_restore` — move an archived task back to the board with the same ID and the status it had. Restore a task before changing it: `task_edit` on an archived task fails.
- `task_delete` — permanently delete an archived task and release its ID once no other branch or worktree still holds the task. Deleting takes two steps: `task_archive`, then `task_delete`. It removes the dependencies and references other tasks and drafts hold to the task and names the tasks and drafts it changed. A task that is not archived, or whose subtasks still exist as tasks or as drafts, is not deleted.

**Document path rules:** document paths are relative to the docs directory. Use `path` values like `guides/setup`; absolute paths and `..` traversal are rejected.

**Always operate through MCP tools. Never edit markdown files directly so relationships, metadata, and history stay consistent.**

### Replacing Acceptance Criteria

`acceptanceCriteriaSet` replaces the full list. Matching trimmed text keeps its check state, even after reordering.
Duplicate text matches old entries in order, once per entry. New or reworded entries start unchecked, and omitted
entries are removed. `acceptanceCriteriaCheck` and `acceptanceCriteriaUncheck` refer to the resulting list.

### Planning Guidelines

- For non-trivial work, keep the Backlog task as the single plan of record: capture the current approach with `task_edit` (planSet field) before writing code
- Use `task_edit` (planAppend field) to refine the plan when you learn more during implementation
- Verify prerequisites before committing to a plan: confirm required tools, access, data, and environment support are in place
- Keep plans structured and actionable: list concrete steps, highlight key files, call out risks, and note any checkpoints or validations
- Ensure the plan reflects the agreed user outcome and acceptance criteria; if expectations are unclear, clarify them before proceeding
- When additional context is required, review relevant code, documentation, or external references so the plan incorporates the latest knowledge
- Treat the plan and acceptance criteria as living guides - update both when the approach or expectations change so future readers understand the rationale
- If you need to add or remove tasks or shift scope later, pause and run the "present → approval" loop again before editing the backlog; never change the breakdown silently

### Task Lifecycle

Leave finished tasks on the board until periodic cleanup. `task_archive` then moves them off the board while keeping their ID, record, and dependency links.

`task_archive` also takes canceled, duplicate, or invalid work off the board. Archived tasks are read-only, so finish notes and the final summary before archiving. To change an archived task or work on it again, bring it back to the board with `task_restore`; it keeps its ID and status.

To remove a task for good, archive it and then call `task_delete`. Delete releases the ID once no other branch or worktree still holds the task, and removes the links other tasks and drafts hold to the task, so use it only for work that should leave no record.

**Scope assessment checklist** - Answer these questions FIRST:
1. Can this be completed in a single focused pull request?
2. Would a code reviewer be comfortable reviewing all changes in one sitting?
3. Are there natural breaking points where work could be independently delivered and tested?
4. Does the request span multiple subsystems, layers, or architectural concerns?
5. Are multiple tasks working on the same component or closely related functionality?

If the work requires multiple tasks, proceed to choose the appropriate task structure (subtasks vs separate tasks).

### Agent Lifecycle Reality

**Assume the agent who creates tasks will NOT execute them.** Each task is handled by an independent agent session with no memory of prior conversations or other tasks.

- Write tasks as work orders for strangers: include all required context inside the task
- Never reference "what we discussed" without restating the essential decisions and constraints
- Dependencies must explicitly state what the other task provides (e.g., output, schema, artifact)
- Use the `references` field for external references such as GitHub issues, PRs, tickets, or URLs
- Use the `documentation` field for design docs, API specs, manuals, or other reference materials that help understand the task context
- Only include minimal local code context in the description when omitting it would make the task ambiguous or unsafe for a future implementer; this limits code detail, not the reason the work is needed

### Step 3: Choose task structure

**When to use subtasks vs separate tasks:**

**Use subtasks** (parent-child relationship) when:
- Multiple tasks all modify the same component or subsystem
- Tasks are tightly coupled and share the same high-level goal
- Tasks represent sequential phases of the same feature
- Example: Parent task "Desktop Application" with subtasks for Electron setup, IPC bridge, UI adaptation, packaging

**Use separate tasks** (with dependencies) when:
- Tasks span different components or subsystems
- Tasks can be worked on independently by different developers
- Tasks have loose coupling with clear boundaries
- Example: Separate tasks for "API endpoint", "Frontend component", "Documentation"

**Concrete example**: If a request spans multiple layers—say an API change, a client update, and documentation—create one parent task ("Launch bulk-edit mode") with subtasks for each layer. Note cross-layer dependencies (e.g., "UI waits on API schema") so different collaborators can work in parallel without blocking each other.

Use `parentTaskId` only with an existing task ID returned by `task_create`, `task_list`, or `task_view`. Do not pass milestone IDs such as `m-0` as `parentTaskId`; assign a task to a milestone with the `milestone` field.

### Step 4: Create multi-task structure

When scope requires multiple tasks:
1. **Create the task structure**: Either parent task with subtasks, or separate tasks with dependencies
2. **Explain what you created** to the user after creation, including the reasoning for the structure
3. **Document relationships**: Record dependencies using `task_edit` so scheduling and merge-risk tooling stay accurate

**Follow-up work:** Reuse an existing task for an in-scope small fix and reopen it before changes. Track new features or independent requirements separately after searching for duplicates; use a subtask only when it belongs to the parent goal, otherwise use a separate task with dependencies where needed.

Create all tasks in the same session to maintain consistency and context.


### Common Anti-patterns to Avoid

- Creating a single task called "Build desktop application" with 10+ acceptance criteria
- Adding implementation steps to acceptance criteria
- Creating a task before understanding if it needs to be split
- Deferring tests or documentation to "later tasks" (e.g., "Add tests/docs in a follow-up")

### Correct Pattern

"This request spans electron setup, IPC bridge, UI adaptation, and packaging. I'll create 4 separate tasks to break this down properly."

Then create the tasks and report what was created.

**Standalone task example (includes tests/docs):** "Add API endpoint for bulk updates" with acceptance criteria that include required tests and documentation updates in the same task.


### Legacy section-boundary errors

If a replacement or clear operation is refused because an old description, plan, notes, or final summary has ambiguous section boundaries, leave the record unchanged. Ask the user to add the BEGIN/END markers named in the error around the intended section without deleting content. Do not edit record Markdown directly or retry with guessed boundaries. Retry through the MCP tool after the user repairs it. Supported append operations can preserve history without replacing the ambiguous section; do not treat an append as a successful replacement.
