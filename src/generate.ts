import * as vscode from "vscode";
import { Fiche, fichesDir } from "./fiches";
import { resolveSkillPath } from "./skill";

type FicheKind = "integrations" | "module-pattern" | "howto";
type DeliveryMode = "clipboard" | "terminal";

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

function deliveryMode(): DeliveryMode {
  return vscode.workspace
    .getConfiguration("wayfind")
    .get<DeliveryMode>("deliveryMode", "clipboard");
}

async function dispatchPrompt(prompt: string, label: string): Promise<void> {
  if (deliveryMode() === "terminal") {
    const agentCommand = vscode.workspace
      .getConfiguration("wayfind")
      .get<string>("agentCommand", "")
      .trim();
    if (!agentCommand) {
      await deliverViaClipboard(prompt, label);
      return;
    }
    runInTerminal(agentCommand, prompt);
    vscode.window.showInformationMessage(
      `Wayfind: prompt "${label}" envoyé au terminal (${agentCommand}).`
    );
    return;
  }
  await deliverViaClipboard(prompt, label);
}

async function deliverViaClipboard(
  prompt: string,
  label: string
): Promise<void> {
  await vscode.env.clipboard.writeText(prompt);
  const openChat = "Ouvrir le chat Agent";
  const choice = await vscode.window.showInformationMessage(
    `Wayfind: prompt "${label}" copié dans le presse-papier. Colle-le dans le chat Cursor (mode Agent), puis laisse l'agent écrire le fichier.`,
    openChat
  );
  if (choice === openChat) {
    await tryOpenAgentChat();
  }
}

async function tryOpenAgentChat(): Promise<void> {
  const candidates = [
    "composer.startComposerPrompt",
    "aichat.newchataction",
    "workbench.action.chat.open",
  ];
  for (const cmd of candidates) {
    try {
      await vscode.commands.executeCommand(cmd);
      return;
    } catch {
      // try next Cursor/VS Code command
    }
  }
}

function runInTerminal(agentCommand: string, prompt: string): void {
  const terminal = vscode.window.createTerminal({ name: "Wayfind" });
  terminal.show();
  // Pass prompt via env var to avoid shell quoting bugs (zsh, quotes, backticks).
  terminal.sendText(
    `WAYFIND_PROMPT=$(cat <<'WAYFIND_EOF'\n${prompt}\nWAYFIND_EOF\n) ${agentCommand} "$WAYFIND_PROMPT"`
  );
}

export async function generateIntegrations(): Promise<void> {
  await dispatchPrompt(await buildPrompt("integrations", ""), "integrations");
}

export async function generateModulePattern(): Promise<void> {
  const topic = await vscode.window.showInputBox({
    prompt: "Type de module à documenter (ex: collector, api-router, worker)",
    placeHolder: "collector",
  });
  if (!topic) {
    return;
  }
  await dispatchPrompt(
    await buildPrompt("module-pattern", topic),
    `pattern ${topic}`
  );
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
  await dispatchPrompt(await buildPrompt("howto", topic), `how-to ${topic}`);
}

export async function rescanFiche(fiche: Fiche): Promise<void> {
  const rel = vscode.workspace.asRelativePath(fiche.uri);
  const prompt =
    `Re-scanne la fiche ${rel}. Lis le hash commit dans son header, compare avec HEAD ` +
    `(git diff --name-only <hash>..HEAD -- <scope>), mets à jour uniquement les sections impactées, ` +
    `ajoute une section "## Changements depuis <hash>" listant ajouts/suppressions/modifications, ` +
    `et remplace le header par la date du jour + hash HEAD. ${COMMON_RULES}`;
  await dispatchPrompt(prompt, `re-scan ${rel}`);
}
