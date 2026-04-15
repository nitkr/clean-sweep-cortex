import { SyncEvent } from "@/sync"
import { Session } from "./index"
import { TeamSupervisor } from "@/team/supervisor"

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

export default [
  SyncEvent.project(Session.Event.Created, (db, data) => {
    const sessionID = data.sessionID

    for (const agentName of TEAM_AGENTS) {
      TeamSupervisor.start(agentName, sessionID)
    }

    TeamSupervisor.start("cortex-critic", sessionID)
  }),
]
