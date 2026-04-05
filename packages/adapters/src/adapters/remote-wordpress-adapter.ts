import { Client } from "ssh2"
import path from "path"
import type { FileEntry } from "./wordpress-file"
import { connectionManager } from "../connection-manager"

export class RemoteAdapter {
  private readonly connectionName: string
  private readonly sitePath: string

  constructor(connectionName: string, sitePath: string) {
    this.connectionName = connectionName
    this.sitePath = sitePath
  }

  private getClient(): Client {
    if (!connectionManager.isConnected()) {
      throw new Error(`No active SSH connection. Please connect to "${this.connectionName}" first.`)
    }
    const client = connectionManager.getActiveClient()
    if (!client) {
      throw new Error(`Connection "${this.connectionName}" is not active.`)
    }
    return client
  }

  async listFiles(targetPath?: string): Promise<FileEntry[]> {
    const dir = targetPath ?? this.sitePath
    const client = this.getClient()

    return new Promise((resolve, reject) => {
      client.exec(`ls -la --time-style=long-iso ${dir}`, (err, stream) => {
        if (err) {
          client.exec(`ls -la ${dir}`, (fallbackErr, fallbackStream) => {
            if (fallbackErr) {
              reject(new Error(`Failed to list files: ${fallbackErr.message}`))
              return
            }
            let stdout = ""
            fallbackStream.on("data", (data: Buffer) => {
              stdout += data.toString()
            })
            fallbackStream.stderr.on("data", (data: Buffer) => {
              stdout += data.toString()
            })
            fallbackStream.on("close", () => {
              resolve(this.parseSimpleLsOutput(stdout, dir))
            })
          })
          return
        }

        let stdout = ""
        let stderr = ""
        stream.on("data", (data: Buffer) => {
          stdout += data.toString()
        })
        stream.stderr.on("data", (data: Buffer) => {
          stderr += data.toString()
        })
        stream.on("close", (code: number) => {
          if (code !== 0) {
            client.exec(`ls -la ${dir}`, (fallbackErr, fallbackStream) => {
              if (fallbackErr) {
                reject(new Error(`Failed to list files: ${fallbackErr.message}`))
                return
              }
              let fallbackOut = ""
              fallbackStream.on("data", (data: Buffer) => {
                fallbackOut += data.toString()
              })
              fallbackStream.stderr.on("data", (data: Buffer) => {
                fallbackOut += data.toString()
              })
              fallbackStream.on("close", () => {
                resolve(this.parseSimpleLsOutput(fallbackOut, dir))
              })
            })
          } else {
            resolve(this.parseLsOutput(stdout, dir))
          }
        })
      })
    })
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
    const client = this.getClient()

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) {
          reject(new Error(`Failed to open SFTP connection: ${err.message}`))
          return
        }

        sftp.readFile(filePath, (readErr: Error | undefined, buf: Buffer) => {
          if (readErr) {
            reject(new Error(`Cannot read file: ${filePath}`))
            return
          }

          try {
            const content = buf.toString("utf-8")
            resolve({ content, encoding: "utf-8" })
          } catch {
            const base64 = buf.toString("base64")
            resolve({ content: base64, encoding: "binary" })
          }
        })
      })
    })
  }

  async analyzeFile(filePath: string): Promise<{
    isThreat: boolean
    threats: Array<{ type: string; severity: string; description: string }>
    stats: { size: number; lines: number; entropy: number }
  }> {
    const stats = await this.getFileStats(filePath)
    let threats: Array<{ type: string; severity: string; description: string }> = []

    const client = this.getClient()

    const threatsResult = await new Promise<{ success: boolean; data?: string }>((resolve) => {
      const cmd = `clean-sweep-cli scan --path ${this.sitePath} --verbose`
      client.exec(cmd, (err, stream) => {
        if (err) {
          resolve({ success: false })
          return
        }
        let stdout = ""
        stream.on("data", (data: Buffer) => {
          stdout += data.toString()
        })
        stream.stderr.on("data", (data: Buffer) => {
          stdout += data.toString()
        })
        stream.on("close", () => {
          resolve({ success: true, data: stdout })
        })
      })
    })

    if (threatsResult.success && threatsResult.data) {
      const output = threatsResult.data
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
    }

    return {
      isThreat: threats.length > 0,
      threats,
      stats,
    }
  }

  private async getFileStats(filePath: string): Promise<{ size: number; lines: number; entropy: number }> {
    const client = this.getClient()

    return new Promise((resolve) => {
      client.sftp((err, sftp) => {
        if (err) {
          resolve({ size: 0, lines: 0, entropy: 0 })
          return
        }

        sftp.readFile(filePath, (readErr, buf?: Buffer) => {
          if (readErr || !buf) {
            resolve({ size: 0, lines: 0, entropy: 0 })
            return
          }

          const size = buf.byteLength
          const text = buf.slice(0, 10000).toString("utf-8")
          const lines = text.split("\n").length

          const bytes = new Uint8Array(buf)
          const freq = new Map<number, number>()
          for (const b of bytes) freq.set(b, (freq.get(b) ?? 0) + 1)

          let entropy = 0
          const len = bytes.length
          for (const count of freq.values()) {
            const p = count / len
            entropy -= p * Math.log2(p)
          }

          resolve({ size, lines, entropy: Math.round(entropy * 100) / 100 })
        })
      })
    })
  }

  getSitePath(): string {
    return this.sitePath
  }
}

export function createRemoteAdapter(connectionName: string, remotePath: string): RemoteAdapter {
  return new RemoteAdapter(connectionName, remotePath)
}
