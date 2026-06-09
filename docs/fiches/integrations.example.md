# FICHE: intégrations externes — wayfind (exemple)

> Scan: 2026-06-09 · commit `f55ff08` · scope: src/

## Agent CLI (génération des fiches)

- **CLI**: configurable via `wayfind.agentCommand` (défaut: `cursor-agent`) — `package.json:94`
- **Auth**: aucune dans l'extension; déléguée à l'agent — `src/generate.ts:57`
- **Fonctions existantes**:

| Fonction | Rôle | Fichier |
|----------|------|---------|
| `generateIntegrations()` | prompt carte intégrations | `src/generate.ts:69` |
| `generateModulePattern()` | prompt pattern module | `src/generate.ts:73` |
| `generateHowto()` | prompt how-to | `src/generate.ts:84` |
| `rescanFiche()` | re-scan fraîcheur | `src/generate.ts:96` |

### Pattern commun [sûr]

- Prompt strict, tableaux, citation `fichier:ligne` — skill `repo-fiches`
- Auto-détection skill si `skills/docs/repo-fiches/SKILL.md` dans le workspace — `src/skill.ts:7`

---

## Git (fraîcheur sidebar)

| Fonction | Rôle | Fichier |
|----------|------|---------|
| `gitChangedSince()` | diff depuis hash header | `src/fiches.ts:68` |
| `parseHeader()` | lit Scan · commit · scope | `src/fiches.ts:36` |

## Vue d'ensemble

| Service | SDK | Auth | Fonctions | Client |
|---------|-----|------|-----------|--------|
| Agent CLI | externe | agent | 4 | terminal |
| Git | CLI système | — | 2 | `child_process` |
