## Task Finalization Guide

Use this guide when implementation is complete and ready for review.

### Reuse loaded guides

Read each guide once per conversation/project/tool version; re-read when any of these changes, instructions change, or context is lost. Load only CLI or MCP, not both. Do not poll versions. Refresh task snapshots after possible external edits, failed/uncertain updates, or lost context.

1. Use the current task snapshot already read in this conversation, accounting for successful edits. If context is missing, another actor may have changed it, or an update failed or has an uncertain outcome, re-read the task with `backlog task view {{TASK_ID:123}} --plain`. Identify evidence for every acceptance criterion and Definition of Done item.
2. Run relevant tests and checks. For UI or interactive work, exercise the behavior through a browser, DOM script, test runner, or documented manual interaction. Code presence, grep output, and implementation intent are not verification evidence.
3. Check only proven items with `backlog task edit {{TASK_ID:123}} --check-ac 1 --check-dod 1`. Resolve failures before finishing.
4. Confirm the recorded plan matches the final solution and required documentation/configuration updates are complete. Keep useful decisions and validation results in implementation notes (`--append-notes`); use comments for review questions (`--comment`).
5. Write a concise `--final-summary` explaining what changed, why, verification results, and relevant risks or follow-ups. Complete any required user review before marking work finished.
6. Mark verified work Done, or the configured final status: `backlog task edit {{TASK_ID:123}} -s "<terminal status>"`. Check accepted statuses with `backlog task edit --help`.

The checklist above describes logical requirements, not separate mandatory tool calls. Once verification succeeds and any required review is complete, combine proven acceptance criteria/DoD checks, the completion summary, and final status in one update. For a small fix, append a concise change and verification result without duplicating the existing plan or history. All acceptance, DoD, interaction testing, evidence, and approval requirements remain in force.

### Closing a reopened task

For a reused task, re-verify the acceptance criteria affected by the fix and the relevant completion checks. Previous checked items are not evidence that the new fix works. Append what changed and the new verification results while preserving the earlier history. Only return the task to the configured completed status after verification succeeds; unfinished work or failed verification remains in progress.

### Follow-up Work

Do not create or start follow-up tasks without user approval. For subtasks, verify each separately and finish the parent only when all are complete, unless instructed otherwise. Continue to the next subtask only when the user already assigned the full series; otherwise ask first.

Leave finished tasks on the board until authorized periodic cleanup; do not automatically archive or delete.

### On-demand reference

For advanced filters, parent/dependency examples, shell quoting, field replacement, legacy-section errors, document links, or archive/restore/delete behavior, read `backlog instructions workflow-reference` only when needed. Consult command help or tool schemas for unfamiliar fields; never guess. Use the supported CLI/MCP interface, never edit Backlog record Markdown directly.

### Concise records

Write only context needed for handoff: why the work exists, material decisions or blockers, what changed, verification evidence, and unresolved next steps. Usually one short paragraph or 3–5 bullets is enough; expand when evidence or risk requires it. Record verification command/scenario and outcome (including failures/skips); reference long logs instead of copying them. Do not repeat acceptance criteria in descriptions, plans in notes, or notes in summaries. Append only new facts for follow-ups. Do not truncate evidence, weaken acceptance/DoD, or rewrite historical records merely to save tokens.
