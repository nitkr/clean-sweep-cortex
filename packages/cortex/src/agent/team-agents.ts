import { Permission } from "@/permission"
import { Agent } from "./agent"
import path from "path"
import fs from "fs"
import { Global } from "@/global"
import { Config } from "@/config/config"

function parseFrontmatter(content: string): {
  name: string
  description: string
  permission: Config.Permission
  prompt: string
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error("Invalid agent file format")

  const [, frontmatterStr, prompt] = match
  let name = ""
  let description = ""
  const permission: Config.Permission = {}

  for (const line of frontmatterStr.split("\n")) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()

    if (key === "name") {
      name = value
    } else if (key === "description") {
      description = value
    } else if (key === "permission") {
      // permission lines are handled separately below
    }
  }

  const permMatch = frontmatterStr.match(/permission:\s*\n([\s\S]*?)(?=\n\S|$)/)
  if (permMatch) {
    for (const pline of permMatch[1].split("\n")) {
      const colonIdx = pline.indexOf(":")
      if (colonIdx === -1) continue
      const permKey = pline.slice(0, colonIdx).trim()
      const permValue = pline.slice(colonIdx + 1).trim() as Config.PermissionAction
      if (permKey && permValue) {
        permission[permKey] = permValue
      }
    }
  }

  return { name, description, permission, prompt: prompt.trim() }
}

const TEAM_AGENTS = [
  "file-phantom",
  "db-ghost",
  "stealth-phantom",
  "cron-wraith",
  "user-specter",
  "risk-oracle",
  "action-architect",
  "resource-warden",
  "backup-phantom",
  "forensic-oracle",
  "core-eraser",
  "plugin-scrubber",
  "db-purifier",
  "file-incinerator",
  "integrity-verifier",
  "lockdown-enforcer",
  "monitor-watcher",
  "report-sage",
  "log-oracle",
]

const AGENT_SUBDIRS: Record<string, string> = {
  "file-phantom": "vanguard",
  "db-ghost": "vanguard",
  "stealth-phantom": "vanguard",
  "cron-wraith": "vanguard",
  "user-specter": "vanguard",
  "risk-oracle": "tactician",
  "action-architect": "tactician",
  "resource-warden": "tactician",
  "backup-phantom": "tactician",
  "forensic-oracle": "tactician",
  "core-eraser": "purger",
  "plugin-scrubber": "purger",
  "db-purifier": "purger",
  "file-incinerator": "purger",
  "integrity-verifier": "sentinel",
  "lockdown-enforcer": "sentinel",
  "monitor-watcher": "sentinel",
  "report-sage": "sentinel",
  "log-oracle": "sentinel",
}

export function loadTeamAgents(): Record<string, Agent.Info> {
  const agentsDir = path.join(Global.Path.home, "myprojects", "cleansweep-cortex", "agents")
  const result: Record<string, Agent.Info> = {}

  const defaults = Permission.fromConfig({
    "*": "deny",
    scan: "allow",
    "list-files": "allow",
    "read-file": "allow",
    "analyze-file": "allow",
    "run-clean-sweep": "allow",
    backup: "allow",
  })

  for (const agentName of TEAM_AGENTS) {
    const subdir = AGENT_SUBDIRS[agentName]
    const filePath = path.join(agentsDir, subdir, agentName, `${agentName}.md`)

    if (!fs.existsSync(filePath)) {
      console.warn(`Agent file not found: ${filePath}`)
      continue
    }

    const content = fs.readFileSync(filePath, "utf-8")
    const { name, description, permission, prompt } = parseFrontmatter(content)

    result[agentName] = {
      name,
      description,
      mode: "team",
      permission: Permission.merge(defaults, Permission.fromConfig(permission)),
      prompt,
      options: {},
      native: false,
    }
  }

  result["cortex-critic"] = {
    name: "cortex-critic",
    description: "Cortex Critic — Always-on reviewer & chatroom moderator with elevated privileges",
    mode: "team",
    permission: Permission.merge(defaults, Permission.fromConfig({ "*": "allow" })),
    prompt:
      fs
        .readFileSync(path.join(agentsDir, "critic", "critic.md"), "utf-8")
        .split("---\n")[2]
        ?.trim() ?? "",
    options: {},
    native: false,
  }

  return result
}
