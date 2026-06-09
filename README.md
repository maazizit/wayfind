# Wayfind

**Find your way in any repo.** Fact-based reference cards extracted from the codebase — integrations map, module patterns, how-tos — with freshness tracking in the sidebar.

A card answers one practical question in under 2 minutes of reading:

- **Integrations** — which SDK, which auth mode, which access functions already exist per external service (Databricks, Data Factory, AWS...)
- **Module pattern** — canonical structure of a module type (e.g. a collector), conventions, shared utilities to reuse
- **How-to** — checklist to add X in N steps, based on an existing exemplar

Every fact is cited with `file:line`. Tables, not prose. No chat back-and-forth.

## How it works

1. Cards live in `docs/fiches/*.md` (versioned with the repo — one scan serves the whole team).
2. Each card carries a header `> Scan: <date> · commit <hash> · scope: <paths>`.
3. The sidebar compares the hash against `HEAD` (`git diff --name-only`) over the card's scope:
   - ✅ fresh — nothing changed in scope
   - ⚠️ drift — N files modified since the scan (tooltip lists them)
   - ❓ unknown — missing header or hash not found
4. Generation is delegated to a CLI agent (configurable): the extension builds a strict prompt, the agent scans and writes the card.

## Commands

| Command | Action |
|---------|--------|
| `Wayfind: Generate Integrations Card` | Map of external integrations |
| `Wayfind: Generate Module Pattern Card` | Pattern of a module type |
| `Wayfind: Generate How-To Card` | Checklist for a given task |
| `Wayfind: Re-scan Card` | Update a stale card (diff since its hash) |
| `Wayfind: Refresh List` | Reload the sidebar |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `wayfind.agentCommand` | `cursor-agent` | CLI agent that generates cards (`copilot`, etc.) |
| `wayfind.fichesDir` | `docs/fiches` | Cards directory |
| `wayfind.skillPath` | _(empty)_ | Path to the `repo-fiches` SKILL.md (ai-agents-kit) to anchor the prompt |

## Development

```bash
npm install
npm run compile
# F5 in VS Code → Extension Development Host window
```

## Powered by ai-agents-kit

Card format and extraction rules are defined by the
[`repo-fiches`](https://github.com/maazizit/ai-agents-kit/tree/main/skills/docs/repo-fiches) skill
(mandatory `file:line` citations, confidence markers, ≤120 lines).
Wayfind is the UI layer: statuses, navigation, one-click generation.
