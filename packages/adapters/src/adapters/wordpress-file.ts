import { spawn } from "bun"
import path from "path"

export interface FileEntry {
  name: string
  path: string
  type: "file" | "directory"
  size: number
  modified: number
}

export interface WordPressFileAdapterConfig {
  sitePath: string
  cliPath?: string
}

export class WordPressFileAdapter {
  private readonly sitePath: string
  readonly cliPath: string

  constructor(config: WordPressFileAdapterConfig) {
    this.sitePath = config.sitePath
    this.cliPath = config.cliPath ?? "/home/venturer/myprojects/cleansweep-cortex/bin/clean-sweep"
  }

  async listFiles(targetPath?: string): Promise<FileEntry[]> {
    const dir = targetPath ?? this.sitePath
    const entries: FileEntry[] = []

    try {
      const proc = spawn({
        cmd: ["/bin/ls", "-la", "--time-style=long-iso", dir],
        stdout: "pipe",
        stderr: "pipe",
      })

      const output = await new Response(proc.stdout).text()
      const exitCode = await proc.exited

      if (exitCode !== 0) {
        const fallback = spawn({
          cmd: ["/bin/ls", "-la", dir],
          stdout: "pipe",
          stderr: "pipe",
        })
        const fallbackOutput = await new Response(fallback.stdout).text()
        return this.parseSimpleLsOutput(fallbackOutput, dir)
      }

      return this.parseLsOutput(output, dir)
    } catch {
      try {
        const fallback = spawn({
          cmd: ["/bin/ls", "-la", dir],
          stdout: "pipe",
          stderr: "pipe",
        })
        const fallbackOutput = await new Response(fallback.stdout).text()
        return this.parseSimpleLsOutput(fallbackOutput, dir)
      } catch {
        return []
      }
    }
  }

  private parseLsOutput(output: string, dir: string): FileEntry[] {
    const entries: FileEntry[] = []
    const lines = output.split("\n")

    for (const line of lines) {
      if (!line.trim() || line.startsWith("total")) continue

      const match = line.match(/^([drwx-]{10})\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(.+)$/)

      if (match) {
        const perms = match[1]
        const size = parseInt(match[2]) || 0
        const date = match[3]
        const time = match[4]
        const name = match[5]

        if (name === "." || name === "..") continue

        const type = perms[0] === "d" ? "directory" : "file"
        const fullPath = path.join(dir, name).replace(/\/+/g, "/")
        const modified = new Date(`${date}T${time}`).getTime()

        entries.push({
          name,
          path: fullPath,
          type,
          size,
          modified: isNaN(modified) ? Date.now() : modified,
        })
      } else {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 9) {
          const perms = parts[0]
          const size = parseInt(parts[4]) || 0
          const nameParts = parts.slice(8)
          const name = nameParts.join(" ")

          if (name && name !== "." && name !== "..") {
            const type = perms[0] === "d" ? "directory" : "file"
            const fullPath = path.join(dir, name).replace(/\/+/g, "/")

            entries.push({
              name,
              path: fullPath,
              type,
              size,
              modified: Date.now(),
            })
          }
        }
      }
    }

    return entries
  }

  private parseSimpleLsOutput(output: string, dir: string): FileEntry[] {
    const entries: FileEntry[] = []
    const lines = output.split("\n")

    for (const line of lines) {
      const name = line.trim()
      if (!name || name === "." || name === "..") continue

      const fullPath = path.join(dir, name).replace(/\/+/g, "/")
      entries.push({
        name,
        path: fullPath,
        type: "file",
        size: 0,
        modified: Date.now(),
      })
    }

    return entries
  }

  async readFile(filePath: string): Promise<{ content: string; encoding: "utf-8" | "binary" }> {
    try {
      const content = await Bun.file(filePath).text()
      return { content, encoding: "utf-8" }
    } catch {
      try {
        const content = await Bun.file(filePath).arrayBuffer()
        const base64 = Buffer.from(content).toString("base64")
        return { content: base64, encoding: "binary" }
      } catch {
        throw new Error(`Cannot read file: ${filePath}`)
      }
    }
  }

  async analyzeFile(filePath: string): Promise<{
    isThreat: boolean
    threats: Array<{ type: string; severity: string; description: string }>
    stats: { size: number; lines: number; entropy: number }
  }> {
    const stats = await this.getFileStats(filePath)

    let threats: Array<{ type: string; severity: string; description: string }> = []

    try {
      const proc = spawn({
        cmd: [this.cliPath, "scan", "--path", this.sitePath, "--verbose"],
        stdout: "pipe",
        stderr: "pipe",
      })

      const output = await new Response(proc.stdout).text()
      const fileName = path.basename(filePath)

      for (const line of output.split("\n")) {
        if (line.includes(fileName) || line.includes(filePath)) {
          if (line.includes("php_eval") || line.includes("php-backdoor") || line.includes("webshell")) {
            threats.push({
              type: "malware",
              severity: "high",
              description: "Potentially malicious PHP code detected",
            })
          } else if (line.includes("suspicious")) {
            threats.push({
              type: "suspicious",
              severity: "medium",
              description: "Suspicious code patterns detected",
            })
          }
        }
      }
    } catch {
      // CLI might not exist, continue with just stats
    }

    return {
      isThreat: threats.length > 0,
      threats,
      stats,
    }
  }

  private async getFileStats(filePath: string): Promise<{ size: number; lines: number; entropy: number }> {
    try {
      const content = await Bun.file(filePath).arrayBuffer()
      const size = content.byteLength
      const text = new TextDecoder().decode(content.slice(0, 10000))
      const lines = text.split("\n").length

      const bytes = new Uint8Array(content)
      const freq = new Map<number, number>()
      for (const b of bytes) freq.set(b, (freq.get(b) ?? 0) + 1)

      let entropy = 0
      const len = bytes.length
      for (const count of freq.values()) {
        const p = count / len
        entropy -= p * Math.log2(p)
      }

      return { size, lines, entropy: Math.round(entropy * 100) / 100 }
    } catch {
      return { size: 0, lines: 0, entropy: 0 }
    }
  }

  getSitePath(): string {
    return this.sitePath
  }
}
