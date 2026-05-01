---
name: worktree
description: >
  Workflow for git worktrees. Always create worktrees in ~/.worktrees/<project_name>/<branch_name>,
  run bun install immediately after creation, do work in the worktree, commit only when user asks,
  and merge + clean up only when user asks.
  Trigger: /worktree
---

# Worktree Workflow

## Rules

- Worktrees MUST live at: `~/.worktrees/<project_name>/<branch_name>`
- ALWAYS run `bun install` immediately after creating a worktree
- Do all implementation work inside the worktree directory
- Commit only when the user explicitly asks to commit
- Merge only when the user explicitly asks to merge
- After merge, remove the worktree and delete its directory

## Step 1: Create Worktree for Branch

1. Get project name:
   - `basename "$(pwd)"`

2. Build target path:
   - `~/.worktrees/<project_name>/<branch_name>`

3. Create parent directory:
   - `mkdir -p "$HOME/.worktrees/<project_name>"`

4. Create the worktree and new branch in one command:
   - `git worktree add "$HOME/.worktrees/<project_name>/<branch_name>" -b <branch_name>`

## Step 2: Install Modules

Run immediately in the new worktree directory:

- `bun install`

## Step 3: Do Required Work

All coding, testing, and verification happen in the worktree path:

- `cd "$HOME/.worktrees/<project_name>/<branch_name>"`
- implement requested changes
- verify as needed (example):
  - `bunx tsc`
  - `bun test`

## Step 4: When User Asks to Commit

From inside the worktree directory:

1. Check state:
   - `git status`
   - `git diff`
2. Stage relevant files:
   - `git add <files>`
3. Commit:
   - `git commit -m "<message>"`
4. Re-check:
   - `git status`

## Step 5: When User Asks to Merge and Clean Up

1. Return to main repository (original checkout).
2. Merge branch:
   - `git merge <branch_name>`

3. Remove worktree registration:
   - `git worktree remove "$HOME/.worktrees/<project_name>/<branch_name>"`

4. Delete branch:
   - `git branch -d <branch_name>`

5. Prune stale worktree metadata:
   - `git worktree prune`

6. Delete worktree directory if it still exists:
   - `rm -rf "$HOME/.worktrees/<project_name>/<branch_name>"`

If directory deletion fails because of file locks, ask the user to close editors/terminals and delete it manually.
