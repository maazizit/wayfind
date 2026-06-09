import * as vscode from "vscode";
import * as path from "path";
import { FichesProvider, FicheItem } from "./tree";
import {
  generateIntegrations,
  generateModulePattern,
  generateHowto,
  rescanFiche,
} from "./generate";
import { fichesDir, loadFiches } from "./fiches";

async function updateSidebarMessage(
  treeView: vscode.TreeView<FicheItem>
): Promise<void> {
  const fiches = await loadFiches();
  treeView.message =
    fiches.length === 0
      ? "No cards yet — run Wayfind: Generate Integrations Card"
      : undefined;
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new FichesProvider();

  const treeView = vscode.window.createTreeView("wayfind.list", {
    treeDataProvider: provider,
  });
  void updateSidebarMessage(treeView);

  const refreshAll = (): void => {
    provider.refresh();
    void updateSidebarMessage(treeView);
  };

  context.subscriptions.push(
    treeView,
    vscode.commands.registerCommand("wayfind.refresh", refreshAll),
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
    watcher.onDidChange(refreshAll);
    watcher.onDidCreate(refreshAll);
    watcher.onDidDelete(refreshAll);
    context.subscriptions.push(watcher);
  }
}

export function deactivate(): void {}
