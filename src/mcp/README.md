# EasyBacklog MCP adapter

This directory provides the optional local stdio MCP interface. The CLI and its
workflow instructions remain the canonical product surface.

## Directory responsibilities

- [server.ts](server.ts) creates a server backed by `Core` and registers tools,
  resources and prompts.
- [tools/tasks/](tools/tasks/) exposes task operations, including dependencies,
  plan, notes and acceptance criteria through shared task helpers.
- [tools/documents/](tools/documents/) exposes document lifecycle and search operations.
- [tools/milestones/](tools/milestones/) adapts shared
  [milestone operations](../core/milestone-operations.ts) to MCP responses. CLI and
  HTTP call the same core operations directly; alias and grouping rules live in
  [core/milestones.ts](../core/milestones.ts).
- [tools/definition-of-done/](tools/definition-of-done/) manages project checklist defaults.
- [tools/workflow/](tools/workflow/) and [resources/](resources/) expose workflow guidance.
- [../guidelines/mcp/](../guidelines/mcp/) contains the bundled MCP workflow text.

Standalone decision records are no longer exposed. Use `document_create`, `document_view`, and the other document tools for shared architectural choices; the CLI migration procedure is documented in [Migrating legacy decision records](../../CLI-INSTRUCTIONS.md#migrating-legacy-decision-records). Milestone tools remain available.

Document tool `path` inputs are subdirectories under the configured docs directory, for example `guides/setup`.
Created and updated document responses include the persisted docs-relative file path. Absolute paths and traversal
segments such as `..` are rejected by the shared core/filesystem path handling.

`document_archive` calls `Core.archiveDocument`, the function behind `backlog doc archive`. The document's file moves
unchanged to the same relative path under `backlog/archive/docs/`, its ID stays reserved, and the document stays
viewable and becomes read-only. No task is changed: the result names the tasks and drafts whose documentation list names
the moved file.

`document_restore` and `document_delete` call `Core.restoreDocument` and `Core.deleteDocument`, the functions behind
`backlog doc restore` and `backlog doc delete`. Restore moves an archived document's file back, unchanged, to the same
relative path under `backlog/docs/`. Delete works only on an archived document, asks no question, removes its file and
releases its ID; the result names the tasks and drafts whose documentation list names the removed file.

## Development workflow

```bash
# Run the stdio server from the repo
bun run cli mcp start

# Or via the globally installed CLI
backlog mcp start

# Tests
bun test --timeout=10000 src/test/mcp-
```

The MCP tests cover tool schemas, mutations, validation failures, workflow resources
and server lifecycle behavior.
