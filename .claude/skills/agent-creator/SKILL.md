---
name: agent-creator
description: >
  Creates specialized agent .md files for Claude Code projects and installs them in
  .claude/commands/ automatically. Use this skill whenever the user says "create an agent
  for X", "make a slash command that does Y", "I need an agent to handle Z", or "add a
  /command to my project". Also use it proactively when you detect a recurring workflow
  in the current project that would benefit from automation — for example, if the user
  keeps manually repeating the same multi-step process, or when working on a project that
  has a CLAUDE.md and a new specialized need emerges mid-session. This skill ensures the
  generated agent is consistent with existing agents in the project, follows the project's
  conventions, and gets registered in CLAUDE.md automatically.
---

# Agent Creator

You create specialized agent `.md` files — slash commands — for Claude Code projects.
These files live in `.claude/commands/` and become available as `/command-name` in any
Claude Code session within that project.

A good agent is essentially a mini-playbook: it tells a future Claude session exactly
how to handle a specific, recurring task within the context of _this_ project — with
all the relevant patterns, paths, tools, and verification steps already baked in.

---

## Step 1 — Gather Context

Before designing anything, understand the project's existing conventions. This prevents
the new agent from feeling "foreign" compared to the ones already there.

```bash
# 1. Check if there's a CLAUDE.md
cat CLAUDE.md 2>/dev/null | head -80

# 2. List existing agents to learn from their style
ls .claude/commands/ 2>/dev/null

# 3. Read 1-2 existing agents to understand naming, structure, tone
# (pick the most relevant ones to the new task)
cat .claude/commands/[most-relevant-agent].md 2>/dev/null | head -60
```

If no `.claude/commands/` folder exists yet, note that you'll create it.

---

## Step 2 — Interview the User (if intent is unclear)

If the user's request is vague (e.g., "create an agent for testing"), ask one focused
question to clarify the most important ambiguity. Don't ask for a list of details — just
the one thing that would unlock the design. Examples:

- "What specific steps should this agent run? Or should I propose a workflow for you to review?"
- "Should this agent run automatically after certain actions, or only when you call it manually?"
- "What does 'done' look like for this agent? What should it verify before finishing?"

If the user's request is clear and specific, skip this step and go directly to proposing
the agent design.

---

## Step 3 — Propose the Agent Design, Then Build It

Show the user a brief design summary, then **immediately proceed to Step 4 — do not
pause for confirmation**. The proposal is for transparency, not for approval:

```
📋 BUILDING AGENT: /agent-[name]

PURPOSE: [one sentence]

WORKFLOW:
1. [Step 1 — what it checks/does first]
2. [Step 2]
3. [Step 3]
... (max 6-8 steps)

VERIFIES: [how it confirms the work was done correctly]
SAVES TO: .claude/commands/agent-[name].md
```

Proceed directly to Step 4. If the user later asks for changes, make them then.

> **The only exception**: if the user's request is so ambiguous that you genuinely
> cannot make a reasonable design decision, go back to Step 2 and ask one focused
> question. For requests like "create an agent for Supabase migrations" or "make a
> /review agent for my portfolio cards", the intent is clear enough — just build it.

---

## Step 4 — Write the Agent File

A well-crafted agent `.md` has these sections, in order:

### Header block

```markdown
# 🎯 [Emoji] Agent [Name] — [Short purpose phrase]

> One-sentence description of what this agent does.
> **Relevant stack/context from this project**

---

## Activation

This agent activates with `/agent-[name]` or when the task involves:

- [trigger condition 1]
- [trigger condition 2]
```

### Protocol sections

Each major phase of work gets its own `## Step N — [Name]` section with:

- The actual commands or code to run (bash blocks, TypeScript patterns, SQL, etc.)
- Why each step matters (a brief comment or note, not just what to do)
- Exactly what to check or verify at that step

Use **concrete specifics from this project** — actual file paths, variable names,
commands from the project's package.json, Supabase table names, whatever is relevant.
A generic agent that could work for any project is less useful than one that "knows"
this project cold.

### Checklist

```markdown
## Checklist

□ [Verifiable condition 1]
□ [Verifiable condition 2]
...
```

Checklists work best for pre/post conditions that should always be true. Keep them
short (5-8 items max) and genuinely checkable — not vague aspirations.

### At the End — Always

```markdown
## At Completion

[What to do when the work is done: commit message format, what to invoke next,
what to report back to the user, etc.]

---

_Agent [Name] · [Project name] · [owner email if known]_
```

### Quality bar for the content

The agent should be **self-contained**: a Claude session that has never seen this
project before should be able to read this one file and execute the task correctly.
This means:

- Reference actual file paths (`src/components/sections/`, not "the components folder")
- Include the real commands (`npx supabase db push`, not "push the migration")
- Show the actual patterns to follow (TypeScript interfaces, SQL structure, etc.)
- Explain what "good" looks like so the agent can self-verify

Aim for 80-200 lines. Shorter is fine if the task is simple. Don't pad.

---

## Step 5 — Install the Agent

```bash
# Create the commands directory if it doesn't exist
mkdir -p .claude/commands

# Write the agent file
# (use Write tool — content from Step 4)
```

After writing, confirm installation:

```bash
ls .claude/commands/ | grep agent
```

---

## Step 6 — Register in CLAUDE.md

If the project has a CLAUDE.md, add the new agent to its slash commands section.
Find the section (usually titled `SLASH COMMANDS` or `COMANDOS`) and append an entry:

```markdown
### /agent-[name] — [Short description]

`[description of what it does in 1-2 lines]`
→ Ver .claude/commands/agent-[name].md
```

Use the Edit tool to make this change surgically — don't rewrite the whole file.

---

## Step 7 — Confirm to the User

```
✅ Agent created: /agent-[name]
📁 File: .claude/commands/agent-[name].md
📋 CLAUDE.md: updated

To use it, type: /agent-[name]

This agent will: [one-sentence summary of what it does]
```

If you created the `.claude/commands/` folder for the first time, mention that too.

---

## When to Create Agents Proactively

You don't need to wait for the user to ask. Consider proposing a new agent when:

- The user has manually repeated the same multi-step process 2+ times in a session
- A task in the CLAUDE.md has no corresponding slash command but clearly should
- You just finished a complex workflow that the user will obviously need to repeat
- The user expresses frustration about a repetitive process ("ugh, I have to do this every time")

When proposing proactively, keep it light: "I noticed you're doing [X] a lot — want me to
create an `/agent-[name]` that automates this?" Don't create agents without asking first.

---

## Common Agent Patterns

These are reliable structures to base new agents on. Pick the one that fits, then
customize it with project-specific details:

**Verify & Fix Pattern** — for agents that check something and repair it if broken

```
Step 1: Run the check (command/test/query)
Step 2: If check fails → diagnose why
Step 3: Apply the fix
Step 4: Re-run the check to confirm it passes
Step 5: Report result
```

**Build & Verify Pattern** — for agents that create something

```
Step 1: Gather context (existing patterns, conventions)
Step 2: Create the artifact (file, migration, component)
Step 3: Type-check / lint / build
Step 4: Take screenshot or run test
Step 5: Confirm visually or programmatically
```

**Sync & Report Pattern** — for agents that check state and report

```
Step 1: Connect to the source of truth (DB, API, filesystem)
Step 2: Query current state
Step 3: Compare against expected state
Step 4: Report: what's OK, what's missing, what needs attention
```

**Deploy Pattern** — for agents that push changes somewhere

```
Step 1: Pre-flight checks (types, lint, build)
Step 2: Stage changes
Step 3: Push / deploy
Step 4: Wait for result
Step 5: Verify post-deploy (screenshot, health check, Lighthouse)
Step 6: Report success or rollback
```
