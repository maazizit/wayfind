# Wayfind

<p align="center">
  <img src="media/icon.png" alt="Wayfind" width="96"/>
</p>

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

## Usage (VS Code + GitHub Copilot)

1. Open your repo in **Visual Studio Code** (with Copilot extension enabled).
2. Sidebar → **Wayfind** icon.
3. `Cmd+Shift+P` → **Wayfind: Generate Integrations Card**.
4. Wayfind **copies the prompt to your clipboard** → notification appears.
5. Open **Copilot Chat**: `Ctrl+Cmd+I` (Mac) or `Ctrl+Alt+I` (Windows), or click the Copilot icon.
6. Switch to **Agent** mode if available (so Copilot can create files).
7. **Paste** (`Cmd+V`) → Enter.
8. Copilot scans the repo and writes `docs/fiches/integrations.md`.
9. Card appears in the Wayfind sidebar (✅ fresh / ⚠️ drift).

> **Do not use terminal mode** unless you installed a Copilot CLI. Default is **clipboard** — works with Copilot Chat built into VS Code.

### Optional: terminal mode with Copilot CLI

Only if you installed [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli):

- Settings → `wayfind.deliveryMode` → `terminal`
- Settings → `wayfind.agentCommand` → `gh copilot` (or your CLI)

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `wayfind.deliveryMode` | `clipboard` | `clipboard` (Cursor chat) or `terminal` (external CLI) |
| `wayfind.agentCommand` | _(empty)_ | CLI command — **terminal mode only** |
| `wayfind.fichesDir` | `docs/fiches` | Cards directory |
| `wayfind.skillPath` | _(empty)_ | Path to `repo-fiches/SKILL.md`; auto-detected if `ai-agents-kit` is in the workspace |

Install the skill once:

```bash
npx dgtailoader install maazizit/ai-agents-kit/skills/docs/repo-fiches
# or clone ai-agents-kit next to your project — Wayfind finds skills/docs/repo-fiches/SKILL.md
```

## Install from VSIX

```bash
npm install -g @vscode/vsce   # once
npm run package               # produces wayfind-0.1.0.vsix
code --install-extension wayfind-0.1.0.vsix
```

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
