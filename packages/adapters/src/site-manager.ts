import { existsSync } from "fs"
import path from "path"
import { spawn } from "bun"

export interface DetectedSite {
  path: string
  type: "local" | "remote"
  hasWordPress: boolean
  connectionName?: string
  name?: string
}

export interface PathValidation {
  exists: boolean
  isWordPress: boolean
  isReadable: boolean
  issues: string[]
}

export class SiteManager {
  private sitePath: string | null = null

  async setSitePath(path: string): Promise<void> {
    this.sitePath = path
  }

  async getSitePath(): Promise<string | null> {
    return this.sitePath
  }

  async validatePath(targetPath: string): Promise<PathValidation> {
    const issues: string[] = []
    let exists = false
    let isWordPress = false
    let isReadable = false

    try {
      exists = existsSync(targetPath)
    } catch {
      issues.push("Cannot access path")
    }

    if (exists) {
      isReadable = true
      try {
        const wpConfig = path.join(targetPath, "wp-config.php")
        const wpAdmin = path.join(targetPath, "wp-admin", "index.php")
        const wpIncludes = path.join(targetPath, "wp-includes")

        const hasConfig = existsSync(wpConfig)
        const hasAdmin = existsSync(wpAdmin)
        const hasIncludes = existsSync(wpIncludes)

        isWordPress = hasConfig || (hasAdmin && hasIncludes)

        if (!isWordPress) {
          issues.push("Not a WordPress installation (wp-config.php or wp-admin/wp-includes not found)")
        }
      } catch {
        issues.push("Cannot verify WordPress installation")
        isReadable = false
      }
    } else {
      issues.push("Path does not exist")
    }

    return { exists, isWordPress, isReadable, issues }
  }

  async detectLocalWordPress(rootPath: string): Promise<DetectedSite[]> {
    const candidates: DetectedSite[] = []

    const isWordPress = (dir: string): boolean => {
      try {
        const hasConfig = existsSync(path.join(dir, "wp-config.php"))
        const hasAdmin = existsSync(path.join(dir, "wp-admin"))
        const hasIncludes = existsSync(path.join(dir, "wp-includes"))
        return hasConfig || (hasAdmin && hasIncludes)
      } catch {
        return false
      }
    }

    if (isWordPress(rootPath)) {
      candidates.push({
        path: rootPath,
        type: "local",
        hasWordPress: true,
        name: path.basename(rootPath),
      })
    }

    try {
      const proc = spawn({
        cmd: ["/bin/ls", "-la", rootPath],
        stdout: "pipe",
        stderr: "pipe",
      })
      const output = await new Response(proc.stdout).text()
      const exitCode = await proc.exited

      if (exitCode === 0) {
        const lines = output.split("\n")
        for (const line of lines) {
          const match = line.match(/^([d-])[rwxts-]{9}\s+\d+\s+\S+\s+\S+\s+\d+\s+\S+\s+\d+\s+\d+\s+(.+)$/)
          if (match && match[1] === "d") {
            const dirName = match[2].trim()
            if (dirName && dirName !== "." && dirName !== "..") {
              const fullPath = path.join(rootPath, dirName)
              if (isWordPress(fullPath)) {
                candidates.push({
                  path: fullPath,
                  type: "local",
                  hasWordPress: true,
                  name: dirName,
                })
              }
            }
          }
        }
      }
    } catch {
      // Ignore errors scanning subdirectories
    }

    return candidates
  }
}

export const siteManager = new SiteManager()
