## Task Creation Guide

Use this guide when `backlog instructions` or the user indicates that new Backlog tasks are needed.

### Reuse loaded guides

Read each guide once per conversation/project/tool version; re-read when any of these changes, instructions change, or context is lost. Load only CLI or MCP, not both. Do not poll versions. Refresh task snapshots after possible external edits, failed/uncertain updates, or lost context.

### Step 1: Search First

When a task ID is already known, read that task directly; do not search or list first. For a new requirement or an unknown ID, search by keyword with a result limit (for example, 10), then read likely matches. Broaden or paginate only if needed. Do not use an unfiltered full list as a routine prerequisite.

### Reuse or create

A small fix within a completed task's original scope may reuse that task. Read the matching task even if it is completed. Before implementation, follow the execution guide to reopen it in the configured active status.

A new feature or independent requirement needs a new task, unless an existing task already tracks that requirement. Sharing a page or component with a completed task is not sufficient reason to reuse it. Search first to avoid duplicates.

### Step 2: Assess Scope Before Creating Tasks

Decide whether the request is:

- A single atomic task that can be completed in one focused PR.
- A multi-task feature or initiative that needs subtasks or dependencies.

Use subtasks for a shared goal within one subsystem; use separate tasks with dependencies for independent components. Only use existing task IDs as parents, not milestone IDs; see the reference for examples.

### Step 4: Create Tasks

Write tasks so a future agent can act on them without prior conversation context.

Include:

- A clear title.
- A description that captures why the task exists: the problem, trigger, or user need behind it, plus any context a future agent cannot recover from the code. The acceptance criteria already state what will be true when the work is done — do not restate them here.
- Acceptance criteria that are specific, testable, and independent.
- References or documentation when they are needed for implementation.
- Dependencies when work must happen in order.
- An assignee with `-a` when the task has a known owner; omitting it applies the project's configured `defaultAssignee` when one is set, and `-a ""` leaves the task unassigned instead.

For future work, do **not** add an implementation plan or speculative code approach during task creation. Creation
captures the durable intent, context, scope, acceptance criteria, references, and dependencies. The worker researches
the current system and records the plan after picking up and activating the task, because the codebase or constraints may
change before then. The narrow exception is already-started work being created directly in a configured active status
(for example, In Progress); its current researched plan may be supplied at creation.

### Acceptance Criteria

Acceptance criteria define the expected behavior, not implementation steps.

Good criteria:

- Are testable.
- Include edge cases when relevant.
- Include documentation and test expectations when required.

Avoid criteria like "Implement helper function" unless the helper itself is the user-visible deliverable.

### Definition of Done

Project-level Definition of Done defaults apply automatically; add task-specific items only for extra completion hygiene.

### After Creation

Report the created task IDs, titles, and key acceptance criteria to the user. If the user asks for changes, update tasks through `backlog task edit`.

If you will continue from task creation into implementation in the same session, use the cached `backlog instructions task-execution` guide if still valid; otherwise read it before assigning, planning, editing, or implementing a task. Task creation is complete once the work is tracked; execution uses a separate workflow.

### On-demand reference

For advanced filters, parent/dependency examples, shell quoting, field replacement, legacy-section errors, document links, or archive/restore/delete behavior, read `backlog instructions workflow-reference` only when needed. Consult command help or tool schemas for unfamiliar fields; never guess. Use the supported CLI/MCP interface, never edit Backlog record Markdown directly.

### Concise records

Write only context needed for handoff: why the work exists, material decisions or blockers, what changed, verification evidence, and unresolved next steps. Usually one short paragraph or 3–5 bullets is enough; expand when evidence or risk requires it. Record verification command/scenario and outcome (including failures/skips); reference long logs instead of copying them. Do not repeat acceptance criteria in descriptions, plans in notes, or notes in summaries. Append only new facts for follow-ups. Do not truncate evidence, weaken acceptance/DoD, or rewrite historical records merely to save tokens.
