# AGENT.md

## Before Starting Any Task

**Always inspect MemPalace first to find context for the current task.**

Use the MemPalace tools to search for relevant information before beginning work:

1. Search for related content: `mempalace_search` with relevant keywords
2. Check the knowledge graph: `mempalace_kg_query` for entity relationships
3. Browse wings/rooms: `mempalace_list_wings`, `mempalace_list_rooms` to discover stored context
4. Follow tunnels: `mempalace_traverse` to find connected ideas across wings

This ensures you have full context from previous sessions before making changes.

## Development workflow
After applying the change set run validation commands:
* bunx tsc
* bun run lint
* bun test

