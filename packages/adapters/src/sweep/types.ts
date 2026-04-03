export type SweepStatus =
  | "idle"
  | "scanning"
  | "analyzing"
  | "planning"
  | "cleaning"
  | "verifying"
  | "complete"
  | "failed"

export interface SweepFinding {
  id: string
  type: "file" | "database" | "user" | "cron" | "plugin" | "theme"
  severity: "critical" | "high" | "medium" | "low" | "info"
  path?: string
  description: string
  confidence: number // 0-100
  detectedAt: number
  resolved: boolean
  resolvedAt?: number
  resolution?: string
}

export interface SweepRemediationStep {
  order: number
  action: "quarantine" | "delete" | "repair" | "reinstall" | "clean" | "restore"
  target: string
  description: string
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped"
  result?: string
  timestamp?: number
}

export interface SweepSite {
  path: string
  url?: string
  name?: string
  sshHost?: string
  sshUser?: string
}

export interface SweepSession {
  id: string
  site: SweepSite
  status: SweepStatus
  findings: SweepFinding[]
  remediationSteps: SweepRemediationStep[]
  createdAt: number
  updatedAt: number
  completedAt?: number
  error?: string
}

export interface SweepSummary {
  totalFindings: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  resolvedCount: number
  scanDuration?: number
  cleanDuration?: number
}
