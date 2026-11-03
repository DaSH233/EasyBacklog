## Task Execution Guide

Use this guide when you are working on an existing Backlog task.

### Reuse loaded guides

Read each guide once per conversation/project/tool version; re-read when any of these changes, instructions change, or context is lost. Load only CLI or MCP, not both. Do not poll versions. Refresh task snapshots after possible external edits, failed/uncertain updates, or lost context.

### Reopening a completed task

For a small fix within the original scope, read the completed task and change it to the configured active status (for example, In Progress) using `backlog task edit <id> -s "<active status>"` **before making implementation changes**. If archived, restore it first; restoration alone preserves its completed status and does not reopen it. Preserve previous notes and append the new fix's context and verification results.

New features and independent requirements belong in separate tasks; follow the creation guide and search for existing work first. Do not keep a task marked Done while actively fixing it. After implementation, follow the finalization guide before closing it again.

### Small fixes and combined updates

For an in-scope small fix: read the task, activate before changes, implement, verify, append the result and close. Reuse a suitable plan; omit duplicate plans and routine diaries. Non-trivial work still needs a researched plan before implementation.

Combine compatible status/assignee fields at pickup, adding a plan only when research prerequisites are met. After verification and required review, combine proven acceptance/DoD checks, summary and final status. Never merge mutually exclusive fields or operations dependent on an earlier result. Preserve history; use the finalization guide before closing.

### Planning Workflow

Before writing code for non-trivial work:

1. Read the task before mutating it:
   - `backlog task view {{TASK_ID:123}} --plain`
2. Review its current status, description, acceptance criteria, dependencies, references, and documentation. Confirm the
   task is eligible to start and remains within the requested scope.
   - The `Dependency Graph` section reads the whole context: `Depends on` is what this task transitively waits on,
     `Dependents` is what transitively waits on it. Outermost entries are direct, indented entries are transitive.
   - `unknown task ID` and `ambiguous task ID` are unresolved identities, never satisfied dependencies. The graph stops
     at one instead of guessing, so treat that branch as unknown and run `backlog doctor` before relying on it.
3. Mark it in progress and assign yourself:
   - Inspect accepted statuses if needed: `backlog task edit {{TASK_ID:123}} --help`
   - `backlog task edit {{TASK_ID:123}} -s "<active status>" -a @your-name`
4. Research the current system, including relevant code, tests, conventions, and recent changes. Do not rely on an
   implementation approach proposed when the task was created.
5. Draft an implementation plan.
6. Record the current plan in the task before implementation:
   - `backlog task edit {{TASK_ID:123}} --plan "1. ..."`
7. If the plan contains a material product, architecture, or workflow decision, or the project or user requires plan
   review, present it and wait for explicit approval before implementation. Routine plans need not block when no review
   was requested and they stay within confirmed scope.

### Execution Workflow

Work in short loops:

1. Implement a focused slice.
2. Run relevant tests or checks.
3. Record useful progress:
   - `backlog task edit {{TASK_ID:123}} --append-notes "Implemented parser and added tests."`
4. Add comments for discussion or review questions:
   - `backlog task edit {{TASK_ID:123}} --comment "Question for review" --comment-author @your-name`

Use `backlog task edit {{TASK_ID:123}} --help` before changing unfamiliar fields.

Do not check acceptance criteria, write the final summary, or move the task to the terminal status from this guide alone. When implementation appears complete, read the finalization guide and verify each acceptance criterion with objective evidence before checking it.

### Scope Changes

If you discover work that is outside the task's acceptance criteria, stop and ask the user whether to add scope to the current task or create follow-up work. Do not silently expand the task.

### Working With Subtasks

If the user assigns a parent task and all subtasks, complete subtasks one at a time. Each subtask retains its own acceptance criteria, verification evidence, and final summary. Apply the small-fix exception to plans and routine notes; non-trivial subtasks still need a researched plan.

If the user assigns only one subtask, finish that subtask and ask before moving to the next one.

### Finishing

When implementation is complete, continue with:

```bash
backlog instructions task-finalization
```

### On-demand reference

For advanced filters, parent/dependency examples, shell quoting, field replacement, legacy-section errors, document links, or archive/restore/delete behavior, read `backlog instructions workflow-reference` only when needed. Consult command help or tool schemas for unfamiliar fields; never guess. Use the supported CLI/MCP interface, never edit Backlog record Markdown directly.

### Concise records

Write only context needed for handoff: why the work exists, material decisions or blockers, what changed, verification evidence, and unresolved next steps. Usually one short paragraph or 3–5 bullets is enough; expand when evidence or risk requires it. Record verification command/scenario and outcome (including failures/skips); reference long logs instead of copying them. Do not repeat acceptance criteria in descriptions, plans in notes, or notes in summaries. Append only new facts for follow-ups. Do not truncate evidence, weaken acceptance/DoD, or rewrite historical records merely to save tokens.
