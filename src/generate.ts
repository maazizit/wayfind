import * as vscode from "vscode";
import { Fiche, fichesDir } from "./fiches";
import { resolveSkillPath } from "./skill";

type FicheKind = "integrations" | "module-pattern" | "howto";

const COMMON_RULES = [
  "Règles strictes: chaque fait cité avec fichier:ligne vérifiable, tableaux plutôt que prose,",
  "marqueurs de confiance [sûr]/[probable]/[à vérifier], max 120 lignes,",
  "header obligatoire: `> Scan: <date> · commit \\`<hash HEAD>\\` · scope: <chemins scannés>`.",
  "Aucune intro, aucune conclusion. Marquer explicitement ce qui N'EXISTE PAS (❌ → à ajouter dans <fichier>).",
].join(" ");

async function buildPrompt(kind: FicheKind, topic: string): Promise<string> {
  const dir = fichesDir();
  const skillPath = await resolveSkillPath();
  const skillRef = skillPath
    ? `Suis le skill défini dans ${skillPath}. `
    : "";

  switch (kind) {
    case "integrations":
      return (
        `${skillRef}Génère une fiche de référence des intégrations externes de ce repo dans ${dir}/integrations.md. ` +
        `Pour chaque service externe (cloud SDK, API, base de données): SDK utilisé + version (lockfile), mode d'auth et où le client est construit, ` +
        `tableau des fonctions d'accès existantes (nom, ce qu'elles récupèrent, fichier:ligne), pattern commun (pagination, retry, erreurs). ` +
        COMMON_RULES
      );
    case "module-pattern":
      return (
        `${skillRef}Génère une fiche pattern de module dans ${dir}/pattern-${slug(topic)}.md pour le type de module "${topic}". ` +
        `Identifie l'implémentation exemplaire la plus complète, documente: structure de fichiers obligatoire, rôle et interdits de chaque fichier, ` +
        `conventions repérées avec confiance, utilitaires partagés à réutiliser, et comment créer un nouveau module de ce type. ` +
        COMMON_RULES
      );
    case "howto":
      return (
        `${skillRef}Génère une fiche how-to dans ${dir}/howto-${slug(topic)}.md pour la tâche: "${topic}". ` +
        `Contenu: vérifier si ça existe déjà, auth/utilitaires déjà disponibles, tableau d'étapes (action, fichier, modèle à copier), ` +
        `signature attendue, pièges connus avec fichier:ligne, commandes de validation. ` +
        COMMON_RULES
      );
  }
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function runInTerminal(prompt: string): void {
  const agentCommand = vscode.workspace
    .getConfiguration("wayfind")
    .get<string>("agentCommand", "cursor-agent");

  const terminal = vscode.window.createTerminal({ name: "Wayfind" });
  terminal.show();
  // Single-quote the prompt for the shell; escape embedded single quotes.
  const quoted = `'${prompt.replace(/'/g, `'\\''`)}'`;
  terminal.sendText(`${agentCommand} ${quoted}`);
}

export async function generateIntegrations(): Promise<void> {
  runInTerminal(await buildPrompt("integrations", ""));
}

export async function generateModulePattern(): Promise<void> {
  const topic = await vscode.window.showInputBox({
    prompt: "Type de module à documenter (ex: collector, api-router, worker)",
    placeHolder: "collector",
  });
  if (!topic) {
    return;
  }
  runInTerminal(await buildPrompt("module-pattern", topic));
}

export async function generateHowto(): Promise<void> {
  const topic = await vscode.window.showInputBox({
    prompt:
      "Tâche à documenter (ex: ajouter une fonction get_jobs Databricks)",
    placeHolder: "ajouter un nouveau collecteur GCP",
  });
  if (!topic) {
    return;
  }
  runInTerminal(await buildPrompt("howto", topic));
}

export async function rescanFiche(fiche: Fiche): Promise<void> {
  const rel = vscode.workspace.asRelativePath(fiche.uri);
  const prompt =
    `Re-scanne la fiche ${rel}. Lis le hash commit dans son header, compare avec HEAD ` +
    `(git diff --name-only <hash>..HEAD -- <scope>), mets à jour uniquement les sections impactées, ` +
    `ajoute une section "## Changements depuis <hash>" listant ajouts/suppressions/modifications, ` +
    `et remplace le header par la date du jour + hash HEAD. ${COMMON_RULES}`;
  runInTerminal(prompt);
}
