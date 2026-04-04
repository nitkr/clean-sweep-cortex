import { tool } from "@opencode-ai/plugin"
import { spawn } from "bun"
import { WordPressFileAdapter, type FileEntry } from "../adapters/wordpress-file"
import { siteManager } from "../site-manager"
;(globalThis as any).__cortexSitePath = (globalThis as any).__cortexSitePath ?? null

export function setCortexSitePath(path: string | null) {
  ;(globalThis as any).__cortexSitePath = path
  siteManager.setSitePath(path ?? "")
}

export function getCortexSitePath(): string | null {
  return (globalThis as any).__cortexSitePath
}

function getAdapter(sitePath?: string): WordPressFileAdapter {
  const path = sitePath ?? (globalThis as any).__cortexSitePath ?? (siteManager.getSitePath() || undefined)
  if (!path) {
    throw new Error("No WordPress site path configured. Use @cortex set-site to configure the site.")
  }
  return new WordPressFileAdapter({ sitePath: path })
}

export const CortexListFilesTool = tool({
  description:
    "List files and directories in a WordPress site. Use this to browse the file system of the connected WordPress installation.",
  args: {
    path: tool.schema.string().optional().describe("Directory path to list (defaults to site root)"),
    filter: tool.schema.string().optional().describe("Filter pattern (e.g., '*.php' to show only PHP files)"),
  },
  async execute(args, ctx) {
    const adapter = getAdapter()
    const targetPath = args.path ?? adapter.getSitePath()

    const entries = await adapter.listFiles(targetPath)

    let filtered = entries
    if (args.filter) {
      const pattern = args.filter.replace(/\*/g, ".*").replace(/\?/g, ".")
      const regex = new RegExp(`^${pattern}$`, "i")
      filtered = entries.filter((e) => regex.test(e.name))
    }

    const lines = filtered.map((e) => {
      const icon = e.type === "directory" ? "📁" : "📄"
      const size = e.type === "file" ? ` (${formatSize(e.size)})` : ""
      const modified = new Date(e.modified).toISOString().split("T")[0]
      return `${icon} ${e.name}${size} [${modified}]`
    })

    return `Files in ${targetPath}:\n${lines.join("\n")}\n\nTotal: ${filtered.length} items`
  },
})

export const CortexReadFileTool = tool({
  description: "Read the contents of a file in the WordPress site. Use this to examine file contents for analysis.",
  args: {
    path: tool.schema.string().describe("Absolute path to the file"),
    maxLines: tool.schema.number().optional().default(500).describe("Maximum number of lines to read"),
  },
  async execute(args, ctx) {
    const adapter = getAdapter()

    try {
      const { content, encoding } = await adapter.readFile(args.path)

      if (encoding === "binary") {
        return `File is binary (${content.length} bytes base64 encoded). Use analyze-file to check for threats.`
      }

      const lines = content.split("\n")
      const truncated = lines.length > args.maxLines
      const displayLines = lines.slice(0, args.maxLines)

      return `File: ${args.path}\n${truncated ? `(showing first ${args.maxLines} of ${lines.length} lines)\n` : ""}\n${displayLines.join("\n")}${truncated ? "\n... (truncated)" : ""}`
    } catch (err) {
      return `Error reading file: ${err instanceof Error ? err.message : String(err)}`
    }
  },
})

export const CortexAnalyzeFileTool = tool({
  description:
    "Analyze a file for potential malware threats. Uses Clean Sweep CLI signatures to detect malicious code patterns.",
  args: {
    path: tool.schema.string().describe("Absolute path to the file to analyze"),
  },
  async execute(args, ctx) {
    const adapter = getAdapter()

    try {
      const result = await adapter.analyzeFile(args.path)

      const lines = [
        `Analysis of: ${args.path}`,
        "",
        `Stats:`,
        `  Size: ${formatSize(result.stats.size)}`,
        `  Lines: ${result.stats.lines}`,
        `  Entropy: ${result.stats.entropy} (high entropy may indicate obfuscation)`,
        "",
      ]

      if (result.isThreat) {
        lines.push("⚠️ THREATS DETECTED:")
        for (const threat of result.threats) {
          lines.push(`  [${threat.severity.toUpperCase()}] ${threat.type}: ${threat.description}`)
        }
      } else {
        lines.push("✅ No threats detected")
      }

      return lines.join("\n")
    } catch (err) {
      return `Error analyzing file: ${err instanceof Error ? err.message : String(err)}`
    }
  },
})

export const CortexSetSiteTool = tool({
  description:
    "Set the active WordPress site path for cortex tools. Use this when switching between different WordPress installations.",
  args: {
    path: tool.schema.string().describe("Absolute path to the WordPress site"),
  },
  async execute(args, ctx) {
    setCortexSitePath(args.path)
    return `Site path set to: ${args.path}\n\nCortex tools will now operate on this WordPress installation.`
  },
})

export const CortexGetSiteTool = tool({
  description: "Get the currently active WordPress site path.",
  args: {},
  async execute(args, ctx) {
    const path = getCortexSitePath()
    if (!path) {
      return "No site path set. Use @cortex set-site to configure the WordPress installation."
    }
    return `Current site: ${path}`
  },
})

export const CortexScanTool = tool({
  description:
    "Perform a comprehensive security scan of the WordPress site using Clean Sweep CLI. Returns a summary of threats found with severity levels.",
  args: {},
  async execute(args, ctx) {
    const adapter = getAdapter()
    const sitePath = adapter.getSitePath()

    const proc = spawn({
      cmd: [adapter.cliPath, "scan", "--path", sitePath],
      stdout: "pipe",
      stderr: "pipe",
    })

    const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
    const exitCode = await proc.exited

    if (exitCode !== 0) {
      return `Scan failed: ${stderr || `Exit code: ${exitCode}`}`
    }

    return `Scan completed on ${sitePath}:\n${stdout.trim()}`
  },
})

export const CortexBackupTool = tool({
  description: "Create a backup of files before remediation. Quarantines files so they can be restored if needed.",
  args: {
    path: tool.schema.string().optional().describe("Path to quarantine (defaults to entire site)"),
  },
  async execute(args, ctx) {
    const adapter = getAdapter()
    const sitePath = adapter.getSitePath()
    const targetPath = args.path ?? sitePath

    const proc = spawn({
      cmd: [adapter.cliPath, "quarantine", "--path", targetPath],
      stdout: "pipe",
      stderr: "pipe",
    })

    const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
    const exitCode = await proc.exited

    if (exitCode !== 0) {
      return `Backup/quarantine failed: ${stderr || `Exit code: ${exitCode}`}`
    }

    return `Backup created for ${targetPath}:\n${stdout.trim()}`
  },
})

export const CortexRunCleanSweepTool = tool({
  description:
    "Run any Clean Sweep CLI command. Use this for advanced operations like core:repair, plugin:reinstall, db:scan, etc.",
  args: {
    command: tool.schema
      .string()
      .describe("The Clean Sweep CLI command to run (e.g., 'core:repair', 'plugin:reinstall', 'db:scan')"),
    options: tool.schema.string().optional().describe("Additional command options as a string (e.g., '--force')"),
  },
  async execute(args, ctx) {
    const adapter = getAdapter()
    const sitePath = adapter.getSitePath()

    const cmdParts = args.command.split(" ")
    const cmd = [adapter.cliPath, ...cmdParts, "--path", sitePath]
    if (args.options) {
      cmd.push(...args.options.split(" "))
    }

    const proc = spawn({
      cmd,
      stdout: "pipe",
      stderr: "pipe",
    })

    const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
    const exitCode = await proc.exited

    if (exitCode !== 0) {
      return `Command failed: ${stderr || `Exit code: ${exitCode}`}`
    }

    return `Command executed successfully:\n${stdout.trim()}`
  },
})

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
}
