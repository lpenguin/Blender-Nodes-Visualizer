# AGENT.md

## Before Starting Any Task

**Always inspect MemPalace first to find context for the current task.**

Use the MemPalace tools to search for relevant information before beginning work:

1. Search for related content: `mempalace_search` with relevant keywords
2. Check the knowledge graph: `mempalace_kg_query` for entity relationships
3. Browse wings/rooms: `mempalace_list_wings`, `mempalace_list_rooms` to discover stored context
4. Follow tunnels: `mempalace_traverse` to find connected ideas across wings

This ensures you have full context from previous sessions before making changes.

## Git Worktree Workflow

Load the `worktree` skill (`/worktree`) for all worktree operations.

**CRITICAL: After creating a worktree, ALL file edits and bash commands MUST target the worktree directory.**

- Worktree path: `~/.worktrees/<project_name>/<branch_name>`
- The `edit` tool uses absolute `filePath` — always prefix with the worktree path, NOT the original repo path
- The `bash` tool has a `workdir` parameter — always set it to the worktree path
- The `write` tool uses absolute `filePath` — same rule as `edit`
- The `read` and `glob` tools also use absolute paths — use worktree paths
- Never edit files in the original checkout (`C:\Users\Nikita\Sources\...`) when a worktree is active
