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

For feature work that requires a separate branch:

1. **Create worktree**: `git worktree add ../<repoName>.<branchName> -b <branchName>`
   - Directory naming: `<repoName>.<branchName>` (e.g. `Blender-Nodes-Visualizer.switch-to-bun`)
2. **Do all work** in the worktree directory
3. **Verify changes**: run `bunx tsc` (compilation) and `bun test` (tests) before committing
4. **Commit** when changes are ready and verified by the user
4. **Merge back**: from the main repo, `git merge <branchName>`
5. **Clean up**: `git branch -d <branchName>` and `git worktree prune`
6. **Ask the user to manually delete** the worktree directory — it's often locked by editors/terminals and can't be removed programmatically
