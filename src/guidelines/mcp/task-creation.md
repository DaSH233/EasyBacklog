## Task Creation Guide

This guide provides detailed instructions for creating well-structured tasks. You should already know WHEN to create tasks (from the overview).

### Reuse loaded guides

Read each guide once per conversation/project/tool version; re-read when any of these changes, instructions change, or context is lost. Load only CLI or MCP, not both. Do not poll versions. Refresh task snapshots after possible external edits, failed/uncertain updates, or lost context.

### Step 1: Search for existing work

**IMPORTANT - Always use filters when searching:**
- Use `task_search` with a keyword and limit (e.g., query="desktop app", limit=10)
- Use `task_list` with a keyword and limit; filter by configured status only when relevant. Include completed work when checking for an in-scope fix to reopen.
- Never list all tasks including "Done" status without explicit user request
- Use both a keyword and a result limit for discovery; broaden only as needed

When a task ID is already known, read that task directly; do not search or list first. For a new requirement or an unknown ID, search by keyword with a result limit (for example, 10), then read likely matches. Broaden or paginate only if needed. Do not use an unfiltered full list as a routine prerequisite.

Use `task_view` to read full context of related tasks.

### Reuse or create

A small fix within a completed task's original scope may reuse that task. Read the matching task even if it is completed. Before implementation, follow the execution guide to reopen it in the configured active status.

A new feature or independent requirement needs a new task, unless an existing task already tracks that requirement. Sharing a page or component with a completed task is not sufficient reason to reuse it. Search first to avoid duplicates.

### Step 2: Assess scope BEFORE creating tasks

**CRITICAL**: Before creating any tasks, assess whether the user's request is:
- **Single atomic task** (single focused PR): Create one task immediately
- **Multi-task feature or initiative** (multiple PRs, or parent task with subtasks): Create appropriate task structure

Use one task for an atomic outcome; subtasks for a shared goal, separate dependent tasks for independent components. Include enough durable context for a worker without this conversation. Use existing task IDs as parents, never milestone IDs. See the reference for examples and relationship fields.

### Step 5: Create task(s) with proper scope

**Title and description**: The title states the intended outcome in one line, without implementation detail. The description must capture why the task exists (the WHY): the problem, trigger, or user value behind it, plus any context a future agent cannot recover from the code. Acceptance criteria already state what will be true when the work is done, so do not restate them in the description. Keeping the description focused means leaving out implementation detail, not leaving out the why.
- Example `description`: "Finding anything means running three separate commands, and matches in the ones you skip are missed silently. One search command covers tasks and docs."
- Too thin: "Users can search tasks and docs from one CLI command." states the change but not the need, so a future agent cannot weigh scope or alternatives

**Acceptance criteria**: `acceptanceCriteria` is an array of strings; each item should be specific, testable, and independent (the WHAT)
- Keep each checklist item atomic (e.g., "Display saves when user presses Ctrl+S")
- Include negative or edge scenarios when relevant
- Capture testing expectations explicitly
- Include documentation expectations in the same task (no deferring to follow-up tasks)

**Definition of Done defaults (optional):**
- Project-level defaults are managed with `definition_of_done_defaults_get` / `definition_of_done_defaults_upsert`
- DoD is not acceptance criteria: AC defines product scope/behavior, DoD defines completion hygiene
- Per-task DoD customization should be exceptional; default to project-level DoD plus strong acceptance criteria
- Use `definitionOfDoneAdd` only for task-specific DoD items that apply to this one task
- Use `disableDefinitionOfDoneDefaults` to skip project defaults for this task when needed
- Do **not** duplicate project defaults into `definitionOfDoneAdd` unless you are intentionally customizing this task

**Never embed implementation details** in title, description, or acceptance criteria — this excludes how the work will be built, not why it is needed

**Record dependencies** using `task_edit` for task ordering

**Ask for clarification** if requirements are ambiguous

**Do not add implementation research, an implementation plan, or a speculative code approach during creation.** MCP task
creation records only durable intent, context, scope, acceptance criteria, references, and dependencies. The future
worker researches the then-current system and records the plan after taking the task into progress. CLI instructions
remain the canonical workflow; this legacy MCP guide mirrors the same task lifecycle for adapter users.

**Drafts (exceptional):** Default to creating regular tasks (e.g., To Do) for any work you are committing to track. Only create a Draft when the user explicitly requests a draft, or when there is clear uncertainty that makes a commitment inappropriate (e.g., missing requirements and the user wants a placeholder). Use `task_create` with status `Draft` to create a draft, `task_edit` to promote/demote by changing status, and pass status `Draft` to `task_list`/`task_search` to include drafts. Drafts are excluded unless explicitly filtered.

### Step 6: Report created tasks

After creation, show the user each new task's ID, title, description, and acceptance criteria (e.g., "Created task-290 – API endpoint: …"). This provides visibility into what was created and allows the user to request corrections if needed.

If you will continue from task creation into implementation in the same session, use the cached `backlog://workflow/task-execution` guide if still valid; otherwise read it before assigning, planning, editing, or implementing a task. Task creation is complete once the work is tracked; execution uses a separate workflow.

### Durable Context at Creation

- Use `task_view` on related work only to avoid duplicates and recover durable product decisions, scope, acceptance
  criteria, dependencies, and references.
- Gather the intended outcome, confirmed constraints, acceptance criteria, dependencies, and reference material needed to
  understand the work order. Do not inspect implementation code or tests, or perform external implementation research,
  to draft a plan for future work.
- The execution worker performs current-system research after the task is active and records the plan then. The narrow
  exception is already-started work created directly in an active status: it may preserve a current plan based on
  research already completed, but task creation itself does not trigger that research.

### On-demand reference

For MCP filters, parent/dependency fields, field replacement, legacy-section errors, document paths, or archive/restore/delete behavior, read `get_backlog_instructions` with `instruction: "workflow-reference"` (resource `backlog://workflow/workflow-reference`) only when needed. Consult command help or tool schemas for unfamiliar fields; never guess. Use the supported CLI/MCP interface, never edit Backlog record Markdown directly.

### Concise records

Write only context needed for handoff: why the work exists, material decisions or blockers, what changed, verification evidence, and unresolved next steps. Usually one short paragraph or 3–5 bullets is enough; expand when evidence or risk requires it. Record verification command/scenario and outcome (including failures/skips); reference long logs instead of copying them. Do not repeat acceptance criteria in descriptions, plans in notes, or notes in summaries. Append only new facts for follow-ups. Do not truncate evidence, weaken acceptance/DoD, or rewrite historical records merely to save tokens.
