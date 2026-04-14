import { createHash } from "node:crypto"
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"

export interface BaselineSnapshot {
  file_signatures: Record<string, string>
  plugin_list: string[]
  db_patterns: string[]
  created_at: number
  session_id: string
}

export interface ReInfection {
  new_files: string[]
  changed_files: string[]
  new_plugins: string[]
  new_db_patterns: string[]
}

const BASELINE_DIR = ".cleansweep/baseline"

export namespace Baseline {
  export async function hashFile(filePath: string): Promise<string> {
    const content = await readFile(filePath)
    return createHash("sha256").update(content).digest("hex")
  }

  export async function getPath(sessionID: string, dir: string): Promise<string> {
    return path.join(dir, BASELINE_DIR, sessionID)
  }

  export async function create(sessionID: string, dir: string): Promise<BaselineSnapshot> {
    const basePath = await getPath(sessionID, dir)
    await mkdir(basePath, { recursive: true })

    const fileSignatures = await hashDirectory(dir, [BASELINE_DIR])
    const snapshot: BaselineSnapshot = {
      file_signatures: fileSignatures,
      plugin_list: [],
      db_patterns: [],
      created_at: Date.now(),
      session_id: sessionID,
    }

    await writeFileJson(path.join(basePath, "file-signatures.json"), snapshot.file_signatures)
    await writeFileJson(path.join(basePath, "db-patterns.json"), snapshot.db_patterns)
    await writeFileJson(path.join(basePath, "plugin-list.json"), snapshot.plugin_list)
    await writeFileJson(path.join(basePath, "timestamp.json"), { created_at: snapshot.created_at })

    return snapshot
  }

  export async function load(sessionID: string, dir: string): Promise<BaselineSnapshot | undefined> {
    const basePath = await getPath(sessionID, dir)

    try {
      const [fileSignatures, dbPatterns, pluginList, timestampData] = await Promise.all([
        readFileJson<Record<string, string>>(path.join(basePath, "file-signatures.json")),
        readFileJson<string[]>(path.join(basePath, "db-patterns.json")),
        readFileJson<string[]>(path.join(basePath, "plugin-list.json")),
        readFileJson<{ created_at: number }>(path.join(basePath, "timestamp.json")),
      ])

      return {
        file_signatures: fileSignatures,
        db_patterns: dbPatterns,
        plugin_list: pluginList,
        created_at: timestampData.created_at,
        session_id: sessionID,
      }
    } catch {
      return undefined
    }
  }

  export async function compare(baseline: BaselineSnapshot, current: BaselineSnapshot): Promise<ReInfection> {
    const newFiles: string[] = []
    const changedFiles: string[] = []

    for (const [file, hash] of Object.entries(current.file_signatures)) {
      if (!(file in baseline.file_signatures)) {
        newFiles.push(file)
      } else if (baseline.file_signatures[file] !== hash) {
        changedFiles.push(file)
      }
    }

    const newPlugins = current.plugin_list.filter((p) => !baseline.plugin_list.includes(p))
    const newDbPatterns = current.db_patterns.filter((p) => !baseline.db_patterns.includes(p))

    return {
      new_files: newFiles,
      changed_files: changedFiles,
      new_plugins: newPlugins,
      new_db_patterns: newDbPatterns,
    }
  }

  async function hashDirectory(dir: string, exclude: string[]): Promise<Record<string, string>> {
    const signatures: Record<string, string> = {}
    const excludeSet = new Set(exclude)

    await hashDirectoryRecursive(dir, dir, signatures, excludeSet)

    return signatures
  }

  async function hashDirectoryRecursive(
    root: string,
    current: string,
    signatures: Record<string, string>,
    exclude: Set<string>,
  ): Promise<void> {
    let entries
    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name.length > 1) continue
      if (exclude.has(entry.name)) continue

      const fullPath = path.join(current, entry.name)
      const relativePath = path.relative(root, fullPath)

      if (entry.isDirectory()) {
        await hashDirectoryRecursive(root, fullPath, signatures, exclude)
      } else if (entry.isFile()) {
        try {
          signatures[relativePath] = await hashFile(fullPath)
        } catch {
          // Skip files that can't be read
        }
      }
    }
  }
}

async function writeFileJson(p: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(p), { recursive: true })
  await writeFile(p, JSON.stringify(data, null, 2), "utf-8")
}

async function readFileJson<T>(p: string): Promise<T> {
  const content = await readFile(p, "utf-8")
  return JSON.parse(content) as T
}
