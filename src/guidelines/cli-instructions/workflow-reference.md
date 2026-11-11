## Workflow Reference

Read only for the operation you need. Core workflow and verification rules remain in the phase guides.

### Task Lifecycle

Mark finished work Done (or the configured final status) and leave it on the board until periodic cleanup.

Archive (`backlog task archive {{TASK_ID:123}}`) moves a task in any status off the board: finished work during cleanup, and canceled, duplicate, or invalid work at any time. An archived task keeps its ID, its record, and every dependency and reference to it. It stays readable with `backlog task view` and is read-only. A dependency on an archived task counts as satisfied only when that task is in the final status.

Restore (`backlog task restore {{TASK_ID:123}}`) moves an archived task back to the board with the same ID and the status it had. Restore a task before changing it: editing an archived task fails and names this command.

Deleting a task takes two steps: archive it, then run `backlog task delete {{TASK_ID:123}}`. Delete permanently removes the archived task and releases its ID once no other branch or worktree still holds the task. It removes the dependencies and references other tasks and drafts hold to it and names the tasks and drafts it changed. A task whose subtasks still exist, as tasks or as drafts, is not deleted.

Use the CLI for Backlog changes. Never edit task, draft, document, or milestone markdown files directly; commands preserve metadata, relationships, and history.

Recommended CLI commands:

- `backlog search "desktop app" --limit 10 --plain`
- `backlog task list --status "<todo status>" --limit 10 --plain`
- `backlog task list --status "<active status>" --limit 10 --plain`
- `backlog task list --exclude-status "<terminal status>" --limit 10 --plain`
- `backlog task list --type {{TASK_TYPE:1}} --limit 10 --plain`
- `backlog task list --search "desktop app" --labels frontend,bug --limit 20 --plain`

Avoid broad unfiltered listing when the project may have many tasks. Use `--status`, `--exclude-status`, `--type`, `--project`, `--assignee`, `--unassigned`, `--parent`, `--priority`, `--labels`, `--search`, or `--limit` where applicable. Check the size with `--count`, and read a long list in windows with `--max-count` and `--skip`; cut output ends with the command for the next window. Repeat `--exclude-status` or pass comma-separated configured statuses to exclude multiple states. Repeat `--type` or pass comma-separated configured task types to include multiple types. Repeat `--project` or pass comma-separated configured projects to include multiple projects.

Use `backlog task view {{TASK_ID:123}} --plain` to read full context for likely matches.

Ask:

1. Can this be completed in a single focused pull request?
2. Would a reviewer be comfortable reviewing all changes at once?
3. Are there natural independent delivery points?
4. Does the work span multiple subsystems, layers, or ownership areas?
5. Are multiple tasks likely to touch the same component?

### Step 3: Choose Task Structure

Use subtasks when the work shares one goal and one subsystem:

```bash
backlog task create "Desktop application"
backlog task create -p {{TASK_ID:10}} "Set up shell"
backlog task create -p {{TASK_ID:10}} "Wire IPC"
```

Use `--parent`/`-p` only with an existing task ID returned by `backlog task create`, `backlog task list`, or `backlog task view`. Do not pass milestone IDs such as `m-0` to `--parent`; assign a task to a milestone with `--milestone`/`-m`.

Use separate tasks with dependencies when work spans independent components:

```bash
backlog task create "Add bulk update API"
backlog task create "Add bulk update UI" --dep {{TASK_ID:21}}
```

Examples:

```bash
backlog task create "Add project search" \
  -d "Finding anything means running separate commands, and matches in the ones you skip are missed silently. One search command covers tasks and docs." \
  --ac "Search returns matching tasks by title and description" \
  --ac "Search supports --plain output" \
  --ac "Tests cover task and document results"
```

Too thin: `-d "Users can search tasks and docs from one CLI command."` states the change but not the need,
so a future agent cannot weigh scope or alternatives.

```bash
backlog task create "Add settings docs" \
  --doc docs/settings.md \
  --ref https://example.com/spec
```

### Shell Quoting for Literal Backticks

When task text includes Markdown code spans, quote it so the shell passes the backticks literally. Unescaped backticks in double-quoted or unquoted arguments are command substitution in many shells, and EasyBacklog cannot recover the original text after the shell has already executed it.

Use single-quoted CLI arguments for values that contain literal backticks:

```bash
backlog task create 'Document `backlog init` setup' \
  --ac 'Instructions mention `backlog init --defaults` literally'
```

If single quotes are not practical in your shell, escape each literal backtick before running the command. Do not rely on EasyBacklog to sanitize accidental command output after substitution.

### Replacing Acceptance Criteria

`--acceptance-criteria` replaces the full list; repeat it for each item. Matching trimmed text keeps its check state,
even after reordering. Duplicate text matches old entries in order, once per entry. New or reworded entries start
unchecked, and omitted entries are removed. Use `--check-ac` or `--uncheck-ac` in a separate edit to change check states.

### Reading and Writing Backlog Data

Use CLI commands for Backlog changes:

- Read: `backlog task view {{TASK_ID:123}} --plain`
- Search: `backlog search "query" --limit 10 --plain`
- List with task filters: `backlog task list --status "<active status>" --assignee @your-name --labels backend --search "auth" --limit 20 --plain`
- Update: `backlog task edit {{TASK_ID:123}} ...`
- Create docs: `backlog doc create "Title" --content "Initial markdown"` (omit `--content` for an empty document; multiline bodies use real newlines)
- Update docs: `backlog doc update doc-1 --content "Markdown"`
- Archive docs: `backlog doc archive doc-1` moves the file to `backlog/archive/docs/`. The ID stays reserved. The document stays viewable with `backlog doc view` and is read-only. Tasks and drafts whose documentation names the file are printed, not changed.
- Restore docs: `backlog doc restore doc-1` moves an archived document back to `backlog/docs/` with the same ID.
- Delete docs: archive first, then `backlog doc delete doc-1`. Delete asks no question, removes the file and releases the ID. Tasks and drafts whose documentation names the file are printed, not changed.

For documentation links on tasks or drafts, `task edit` and `draft edit` use `--doc` to replace the full list. Use
`--add-doc` or `--remove-doc` to change individual entries; both accept repeated flags or comma-separated values.
Use `--clear-docs` to remove all entries. Do not combine replacement or clear flags with add/remove flags.

For programmatic reads, `task list`, `task view`, `task <id>`, `draft list`, and `search` accept `--json`. JSON mode is noninteractive, versioned, and cannot be combined with `--plain`.

Do not edit Backlog markdown files directly. The CLI preserves metadata, IDs, filenames, relationships, and structured sections.

Replacing or clearing a legacy description, plan, notes, or final summary without section markers is refused if another
level-two heading makes its boundary ambiguous. The file stays unchanged. Stop and ask the user to add the BEGIN and
END markers named in the error around the intended section body without removing any content. Do not edit task or
draft files directly. The user should place the END marker before a separate section, or after headings that belong
to the body. Retry the CLI edit after the user repairs the boundary. Appends remain supported and keep ambiguous
sections unmarked, so later replacements remain protected.

Keep the Backlog task as the plan of record. If the approach changes, replace it with `--plan` or extend it with one
or more repeatable `--append-plan` values. When both options are provided, `--plan` replaces the existing plan first,
then each `--append-plan` value is appended in CLI order:

- `backlog task edit {{TASK_ID:123}} --append-plan "5. Verify the revised approach"`
- `backlog task edit {{TASK_ID:123}} --plan "1. Revised approach" --append-plan "2. Verify it"`

### Task Lifecycle

Leave finished tasks on the board until periodic cleanup. Archive (`backlog task archive {{TASK_ID:123}}`) then moves them off the board while keeping their ID, record, and dependency links.

Archive also takes canceled, duplicate, or invalid work off the board. Archived tasks are read-only, so finish notes and the final summary before archiving. To change an archived task or work on it again, bring it back to the board with `backlog task restore {{TASK_ID:123}}`; it keeps its ID and status.

To remove a task for good, archive it and then delete it with `backlog task delete {{TASK_ID:123}}`. Delete releases the ID once no other branch or worktree still holds the task, and removes the links other tasks and drafts hold to the task, so use it only for work that should leave no record.
