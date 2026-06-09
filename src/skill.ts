import * as vscode from "vscode";
import * as path from "path";

const SKILL_REL = path.join("skills", "docs", "repo-fiches", "SKILL.md");

/** Resolve repo-fiches SKILL.md: setting → workspace search → undefined. */
export async function resolveSkillPath(): Promise<string | undefined> {
  const configured = vscode.workspace
    .getConfiguration("wayfind")
    .get<string>("skillPath", "")
    .trim();
  if (configured) {
    return configured;
  }

  const folders = vscode.workspace.workspaceFolders ?? [];
  for (const folder of folders) {
    const pattern = new vscode.RelativePattern(folder, "**/repo-fiches/SKILL.md");
    const hits = await vscode.workspace.findFiles(pattern, "**/node_modules/**", 1);
    if (hits[0]) {
      return vscode.workspace.asRelativePath(hits[0]);
    }
  }

  for (const folder of folders) {
    const candidate = vscode.Uri.joinPath(folder.uri, SKILL_REL);
    try {
      await vscode.workspace.fs.stat(candidate);
      return vscode.workspace.asRelativePath(candidate);
    } catch {
      // not in this folder root
    }
  }

  return undefined;
}
