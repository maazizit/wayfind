import * as vscode from "vscode";
import { Fiche, loadFiches } from "./fiches";

export class FicheItem extends vscode.TreeItem {
  constructor(public readonly fiche: Fiche) {
    super(fiche.title, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "fiche";
    this.resourceUri = fiche.uri;
    this.command = {
      command: "vscode.open",
      title: "Open Fiche",
      arguments: [fiche.uri],
    };

    switch (fiche.freshness) {
      case "fresh":
        this.iconPath = new vscode.ThemeIcon(
          "check",
          new vscode.ThemeColor("testing.iconPassed")
        );
        this.description = fiche.scanDate ?? "à jour";
        this.tooltip = `À jour — scan ${fiche.scanDate ?? "?"} (commit ${fiche.commitHash})`;
        break;
      case "stale":
        this.iconPath = new vscode.ThemeIcon(
          "warning",
          new vscode.ThemeColor("list.warningForeground")
        );
        this.description = `${fiche.changedFiles.length} fichier(s) modifié(s)`;
        this.tooltip =
          `Dérive possible depuis ${fiche.commitHash} :\n` +
          fiche.changedFiles.slice(0, 15).join("\n") +
          (fiche.changedFiles.length > 15 ? "\n…" : "") +
          "\n\nClic droit → Re-scan pour rafraîchir.";
        break;
      default:
        this.iconPath = new vscode.ThemeIcon("question");
        this.description = "fraîcheur inconnue";
        this.tooltip =
          "Pas de header `> Scan: … · commit `hash`` lisible, ou hash introuvable dans git.";
    }
  }
}

export class FichesProvider implements vscode.TreeDataProvider<FicheItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    FicheItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: FicheItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: FicheItem): Promise<FicheItem[]> {
    if (element) {
      return [];
    }
    const fiches = await loadFiches();
    return fiches.map((f) => new FicheItem(f));
  }
}
