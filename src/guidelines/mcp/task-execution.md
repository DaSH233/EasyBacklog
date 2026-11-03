## Task Execution Guide

### Reuse loaded guides

Read each guide once per conversation/project/tool version; re-read when any of these changes, instructions change, or context is lost. Load only CLI or MCP, not both. Do not poll versions. Refresh task snapshots after possible external edits, failed/uncertain updates, or lost context.

### Reopening a completed task

For a small fix within the original scope, read the completed task and change it to the configured active status (for example, In Progress) using `task_edit` with the configured active status **before making implementation changes**. If archived, restore it first; restoration alone preserves its completed status and does not reopen it. Preserve previous notes and append the new fix's context and verification results.

New features and independent requirements belong in separate tasks; follow the creation guide and search for existing work first. Do not keep a task marked Done while actively fixing it. After implementation, follow the finalization guide before closing it again.

### Small fixes and combined updates

For an in-scope small fix: read the task, activate before changes, implement, verify, append the result and close. Reuse a suitable plan; omit duplicate plans and routine diaries. Non-trivial work still needs a researched plan before implementation.

Combine compatible status/assignee fields at pickup, adding a plan only when research prerequisites are met. After verification and required review, combine proven acceptance/DoD checks, summary and final status. Never merge mutually exclusive fields or operations dependent on an earlier result. Preserve history; use the finalization guide before closing.

### Planning Workflow

> **For non-trivial work:** Capture an implementation plan in the Backlog task _after_ taking the task into progress and
> researching the current system, but before implementation. The plan must live in the task record prior to implementation
> and remain up to date when you close the task. CLI instructions are canonical; this legacy MCP guide preserves parity.

1. **Read before mutating** - Use `task_view` to inspect the current status, description, acceptance criteria, dependencies, references, and documentation
2. **Confirm eligibility and scope** - Verify the task is eligible to start, its dependencies permit work, and it remains within the requested scope
   - `task_view` carries the same `Dependency Graph` section the CLI defines: `Depends on` is what this task transitively waits on, `Dependents` is what transitively waits on it, outermost entries are direct and indented entries are transitive
   - `unknown task ID` and `ambiguous task ID` are unresolved identities, never satisfied dependencies. The graph stops at one rather than guessing, so treat that branch as unknown
3. **Mark task as active** via `task_edit` with the project-configured active status (for example, "In Progress")
4. **Assign to yourself** via `task_edit` with assignee field
5. **Research the current system** - Inspect relevant code, tests, conventions, and recent changes rather than relying on an approach proposed when the task was created
6. **Draft and record the implementation plan** - Use `task_edit` with planSet or planAppend to capture the current approach in the task
7. **Apply proportional review** - If the plan contains a material product, architecture, or workflow decision, or the project or user requires plan review, present it and wait for explicit approval before implementation. Routine plans can proceed when no review was requested and they stay within confirmed scope
8. **Document the agreed breakdown** - In the parent task's plan, capture any approved list of subtasks, owners, and sequencing so a replacement agent can resume with the current structure

Keep only durable decisions, blockers, verification evidence, and next steps needed for handoff in the task.

### Working with Subtasks (Planning)

- If working on a parent task with subtasks, create a high-level plan for the parent that outlines the overall approach
- Non-trivial subtasks need their own researched implementation plan; in-scope small fixes may reuse a suitable plan and omit duplicate plans and routine notes
- Ensure subtask plans are consistent with the parent task's overall strategy

### Execution Workflow

- **For non-trivial work**: Do not start implementation until the current implementation plan is recorded in the task via `task_edit` and any review required by the proportional-review rule above is complete
- The recorded plan must stay accurate. Update routine plan adjustments in the task and continue without mandatory human confirmation when they stay within confirmed scope and introduce no material decision
- If feedback requires changes, revise the plan first via `task_edit` (planSet or planAppend fields)
- Work in short loops: implement, run the relevant tests, and record progress. Do not check acceptance criteria, write the final summary, or move the task to Done from this guide alone; first follow the Task Finalization Guide and verify each acceptance criterion with objective evidence.
- Log progress with `task_edit` (notesAppend field) to document decisions, blockers, or learnings
- Use `task_edit` (`commentsAppend` with optional `commentAuthor`) for task discussion, review questions, or handoff notes that are not part of the execution log
- Comment bodies may contain Markdown, but standalone `---` lines are reserved as comment delimiters
- Keep task status aligned with reality via `task_edit`

### Handling Scope Changes

If new work appears during implementation that wasn't in the original acceptance criteria:

**STOP and ask the user**:
"I discovered [new work needed]. Should I:
1. Add acceptance criteria to the current task and continue, or
2. Create a follow-up task to handle this separately?"

**Never**:
- Silently expand the scope without user approval
- Create new tasks on your own initiative
- Add acceptance criteria without user confirmation

### Staying on Track

- Stay within the scope defined by the plan and acceptance criteria
- Update the plan before following a changed approach
- If a deviation introduces a material product, architecture, or workflow decision, or the project explicitly requires review, explain it and wait for approval. Otherwise record the routine adjustment and continue within confirmed scope

### Working with Subtasks (Execution)

- When user assigns you a parent task "and all subtasks", work through each subtask sequentially without asking for permission to move to the next one
- When completing a single subtask (without explicit instruction to continue), present progress and ask: "Subtask X is complete. Should I proceed with subtask Y, or would you like to review first?"
- Each subtask should be fully completed (all acceptance criteria met, tests passing) before moving to the next

### Finalizing the Task

When implementation is finished, follow the **Task Finalization Guide** (`backlog://workflow/task-finalization`) to finalize your work. This ensures acceptance criteria are verified with behavior-level evidence, implementation is documented, and the task is properly closed.

### On-demand reference

For MCP filters, parent/dependency fields, field replacement, legacy-section errors, document paths, or archive/restore/delete behavior, read `get_backlog_instructions` with `instruction: "workflow-reference"` (resource `backlog://workflow/workflow-reference`) only when needed. Consult command help or tool schemas for unfamiliar fields; never guess. Use the supported CLI/MCP interface, never edit Backlog record Markdown directly.

### Concise records

Write only context needed for handoff: why the work exists, material decisions or blockers, what changed, verification evidence, and unresolved next steps. Usually one short paragraph or 3–5 bullets is enough; expand when evidence or risk requires it. Record verification command/scenario and outcome (including failures/skips); reference long logs instead of copying them. Do not repeat acceptance criteria in descriptions, plans in notes, or notes in summaries. Append only new facts for follow-ups. Do not truncate evidence, weaken acceptance/DoD, or rewrite historical records merely to save tokens.
