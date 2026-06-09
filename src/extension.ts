import * as vscode from "vscode";
import * as path from "path";
import { FichesProvider, FicheItem } from "./tree";
import {
  generateIntegrations,
  generateModulePattern,
  generateHowto,
  rescanFiche,
} from "./generate";
import { fichesDir } from "./fiches";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new FichesProvider();

  context.subscriptions.push(
    vscode.window.createTreeView("wayfind.list", {
      treeDataProvider: provider,
    }),
    vscode.commands.registerCommand("wayfind.refresh", () =>
      provider.refresh()
    ),
    vscode.commands.registerCommand(
      "wayfind.generateIntegrations",
      generateIntegrations
    ),
    vscode.commands.registerCommand(
      "wayfind.generateModulePattern",
      generateModulePattern
    ),
    vscode.commands.registerCommand("wayfind.generateHowto", generateHowto),
    vscode.commands.registerCommand(
      "wayfind.rescan",
      async (item: FicheItem) => {
        if (item?.fiche) {
          await rescanFiche(item.fiche);
        }
      }
    )
  );

  // Auto-refresh statuses when fiches change on disk.
  const root = vscode.workspace.workspaceFolders?.[0];
  if (root) {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(root, path.posix.join(fichesDir(), "*.md"))
    );
    watcher.onDidChange(() => provider.refresh());
    watcher.onDidCreate(() => provider.refresh());
    watcher.onDidDelete(() => provider.refresh());
    context.subscriptions.push(watcher);
  }
}

export function deactivate(): void {}
