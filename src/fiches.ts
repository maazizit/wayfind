import * as vscode from "vscode";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export type Freshness = "fresh" | "stale" | "unknown";

export interface Fiche {
  uri: vscode.Uri;
  title: string;
  scanDate?: string;
  commitHash?: string;
  scopePaths: string[];
  freshness: Freshness;
  /** Files changed since the fiche's commit, within its scope. */
  changedFiles: string[];
}

function workspaceRoot(): vscode.WorkspaceFolder | undefined {
  return vscode.workspace.workspaceFolders?.[0];
}

export function fichesDir(): string {
  return vscode.workspace
    .getConfiguration("wayfind")
    .get<string>("fichesDir", "docs/fiches");
}

/**
 * Parse the freshness header emitted by the repo-fiches skill:
 * `> Scan: 2026-06-09 · commit `abc1234` · scope: packages/foo, packages/bar`
 * Variants use `exemplaire:` instead of `scope:`.
 */
export function parseHeader(content: string): {
  title: string;
  scanDate?: string;
  commitHash?: string;
  scopePaths: string[];
} {
  const lines = content.split(/\r?\n/, 30);
  const titleLine = lines.find((l) => l.startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s*/, "").trim() : "";

  const headerLine = lines.find((l) => l.startsWith(">") && /commit/i.test(l));
  if (!headerLine) {
    return { title, scopePaths: [] };
  }

  const scanDate = /Scan:\s*([^·]+)/i.exec(headerLine)?.[1]?.trim();
  const commitHash = /commit\s*`([0-9a-fA-F]{7,40})`/.exec(headerLine)?.[1];

  const scopeMatch = /(?:scope|exemplaire(?:\s*basé[^:]*)?):\s*(.+)$/i.exec(
    headerLine
  );
  const scopePaths = scopeMatch
    ? scopeMatch[1]
        .split(/[,;]/)
        .map((s) => s.replace(/`/g, "").trim())
        .filter((s) => s.length > 0 && s !== "...")
    : [];

  return { title, scanDate, commitHash, scopePaths };
}

async function gitChangedSince(
  cwd: string,
  hash: string,
  scopePaths: string[]
): Promise<string[] | undefined> {
  try {
    const args = ["diff", "--name-only", `${hash}..HEAD`];
    if (scopePaths.length > 0) {
      args.push("--", ...scopePaths);
    }
    const { stdout } = await execFileAsync("git", args, { cwd });
    return stdout.split("\n").filter((l) => l.trim().length > 0);
  } catch {
    // Unknown hash, not a git repo, etc.
    return undefined;
  }
}

export async function loadFiches(): Promise<Fiche[]> {
  const root = workspaceRoot();
  if (!root) {
    return [];
  }

  const pattern = new vscode.RelativePattern(
    root,
    path.posix.join(fichesDir(), "*.md")
  );
  const files = await vscode.workspace.findFiles(pattern);
  files.sort((a, b) => a.fsPath.localeCompare(b.fsPath));

  const fiches: Fiche[] = [];
  for (const uri of files) {
    const raw = await vscode.workspace.fs.readFile(uri);
    const content = Buffer.from(raw).toString("utf8");
    const { title, scanDate, commitHash, scopePaths } = parseHeader(content);

    let freshness: Freshness = "unknown";
    let changedFiles: string[] = [];
    if (commitHash) {
      const changed = await gitChangedSince(
        root.uri.fsPath,
        commitHash,
        scopePaths
      );
      if (changed !== undefined) {
        changedFiles = changed;
        freshness = changed.length === 0 ? "fresh" : "stale";
      }
    }

    fiches.push({
      uri,
      title: title || path.basename(uri.fsPath, ".md"),
      scanDate,
      commitHash,
      scopePaths,
      freshness,
      changedFiles,
    });
  }
  return fiches;
}
