import { Client } from "ssh2"
import type { ConnectConfig } from "ssh2"
import { readFileSync } from "fs"
import { RemediationBackend } from "../backend"
import type {
  ScanResult,
  RemediationPlan,
  CleanResult,
  VerifyResult,
  BackendCapability,
  Finding,
  FindingType,
  RemediationAction,
} from "../types"

export interface SSHAdapterConfig {
  host: string
  port: number
  username: string
  password?: string
  privateKeyPath?: string
}

export class SSHAdapter extends RemediationBackend {
  readonly config = {
    name: "SSHAdapter",
    version: "1.0.0",
    capabilities: ["scan", "plan", "clean", "verify", "dry_run"] as BackendCapability[],
  }

  private readonly connection: SSHAdapterConfig
  private client: Client | null = null

  constructor(connection: SSHAdapterConfig) {
    super()
    this.connection = connection
  }

  private getConnectionOptions(): ConnectConfig {
    const opts: ConnectConfig = {
      host: this.connection.host,
      port: this.connection.port,
      username: this.connection.username,
    }
    if (this.connection.password) {
      opts.password = this.connection.password
    }
    if (this.connection.privateKeyPath) {
      opts.privateKey = readFileSync(this.connection.privateKeyPath)
    }
    return opts
  }

  private async withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
    if (this.client) {
      return fn(this.client)
    }
    return new Promise((resolve, reject) => {
      const client = new Client()
      client.on("ready", async () => {
        this.client = client
        try {
          const result = await fn(client)
          resolve(result)
        } catch (e) {
          reject(e)
        }
      })
      client.on("error", (err) => {
        reject(new Error(`SSH connection failed: ${err.message}`))
      })
      client.connect(this.getConnectionOptions())
    })
  }

  private async execCommand(
    client: Client,
    cmd: string,
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    return new Promise((resolve) => {
      client.exec(cmd, (err, stream) => {
        if (err) {
          resolve({ success: false, error: err.message })
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
            resolve({ success: false, error: stderr || `Exit code: ${code}` })
          } else {
            const text = stdout.trim()
            if (!text) {
              resolve({ success: true })
            }
            try {
              resolve({ success: true, data: JSON.parse(text) })
            } catch {
              resolve({ success: true, data: text })
            }
          }
        })
      })
    })
  }

  async scan(target: string): Promise<ScanResult> {
    const result = await this.withClient(async (client) => {
      return this.execCommand(client, `clean-sweep-cli scan --path ${target}`)
    })

    const id = crypto.randomUUID()
    const timestamp = Date.now()

    if (!result.success || !result.data) {
      return {
        id,
        target,
        timestamp,
        findings: [],
        summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, clean: 0 },
      }
    }

    const data = result.data as Record<string, unknown>
    const findings: Finding[] = (data.findings as Finding[]) ?? []

    return {
      id,
      target,
      timestamp,
      findings,
      summary: this.computeSummary(findings),
    }
  }

  async plan(scanResults: ScanResult): Promise<RemediationPlan> {
    const id = crypto.randomUUID()
    const steps = this.generateSteps(scanResults.findings)
    return {
      id,
      scanId: scanResults.id,
      steps,
      estimatedDuration: steps.length * 30,
      risks: this.assessRisks(steps),
    }
  }

  async clean(plan: RemediationPlan, dryRun = false): Promise<CleanResult> {
    const id = crypto.randomUUID()
    const timestamp = Date.now()
    const executedSteps = []

    for (const step of plan.steps) {
      if (dryRun) {
        executedSteps.push({
          stepId: step.id,
          status: "skipped" as const,
          message: `[DRY-RUN] Would execute: ${step.action} on ${step.target}`,
        })
        continue
      }

      const result = await this.executeStep(step)
      executedSteps.push(result)
    }

    return {
      id,
      planId: plan.id,
      dryRun,
      timestamp,
      executedSteps,
      summary: {
        total: executedSteps.length,
        succeeded: executedSteps.filter((s) => s.status === "success").length,
        failed: executedSteps.filter((s) => s.status === "failed").length,
        skipped: executedSteps.filter((s) => s.status === "skipped").length,
      },
    }
  }

  async verify(cleanResults: CleanResult): Promise<VerifyResult> {
    const id = crypto.randomUUID()
    const timestamp = Date.now()

    const [statusResult, hardenResult, permissionsResult] = await Promise.all([
      this.withClient(async (client) => this.execCommand(client, "clean-sweep-cli status")),
      this.withClient(async (client) => this.execCommand(client, "clean-sweep-cli harden:check")),
      this.withClient(async (client) => this.execCommand(client, "clean-sweep-cli permissions:check")),
    ])

    const checks = []

    checks.push({
      name: "system_status",
      passed: statusResult.success,
      details: statusResult.success ? "System status OK" : statusResult.error,
    })

    checks.push({
      name: "hardening",
      passed: hardenResult.success,
      details: hardenResult.success ? "Hardening checks passed" : hardenResult.error,
    })

    checks.push({
      name: "permissions",
      passed: permissionsResult.success,
      details: permissionsResult.success ? "Permissions checks passed" : permissionsResult.error,
    })

    const verified = checks.every((c) => c.passed)

    return {
      id,
      cleanId: cleanResults.id,
      timestamp,
      verified,
      checks,
      report: {
        filesScanned: 0,
        threatsRemoved: cleanResults.summary.succeeded,
        integrityRestored: verified,
        hardeningApplied: checks.find((c) => c.name === "hardening")?.passed ?? false,
      },
    }
  }

  private generateSteps(findings: Finding[]): RemediationStep[] {
    let order = 0
    return findings
      .filter((f) => f.type !== "clean")
      .map((finding) => {
        const action = this.mapFindingToAction(finding)
        return {
          id: crypto.randomUUID(),
          order: order++,
          action,
          target: finding.path,
          description: `${action} ${finding.type} file: ${finding.path}`,
          rollback: this.getRollbackCommand(action, finding.path),
        }
      })
  }

  private mapFindingToAction(finding: Finding): RemediationAction {
    const actionMap: Record<FindingType, RemediationAction> = {
      malware: "quarantine",
      backdoor: "quarantine",
      obfuscated: "quarantine",
      suspicious: "quarantine",
      unknown: "delete",
      clean: "skip",
    }
    return actionMap[finding.type]
  }

  private getRollbackCommand(action: RemediationAction, target: string): string {
    switch (action) {
      case "quarantine":
        return `restore ${target}`
      case "delete":
        return `restore ${target}`
      default:
        return ""
    }
  }

  private assessRisks(steps: { action: RemediationAction; target: string }[]): string[] {
    const risks: string[] = []
    const criticalActions = steps.filter(
      (s) => s.action === "delete" && (s.target.includes("wp-config") || s.target.includes(".htaccess")),
    )
    if (criticalActions.length > 0) {
      risks.push(`Critical system files will be modified: ${criticalActions.map((s) => s.target).join(", ")}`)
    }
    return risks
  }

  private async executeStep(step: { id: string; action: RemediationAction; target: string }): Promise<{
    stepId: string
    status: "success" | "failed" | "skipped"
    message?: string
    duration?: number
  }> {
    const start = Date.now()
    let cmd: string

    switch (step.action) {
      case "quarantine":
        cmd = `clean-sweep-cli quarantine ${step.target}`
        break
      case "delete":
        cmd = `clean-sweep-cli fix --delete ${step.target}`
        break
      case "restore":
        cmd = `clean-sweep-cli restore ${step.target}`
        break
      case "reinstall":
        return { stepId: step.id, status: "skipped", message: "Reinstall requires explicit plugin/theme specification" }
      case "clean":
        cmd = `clean-sweep-cli fix ${step.target}`
        break
      case "remove":
        cmd = `clean-sweep-cli fix --remove ${step.target}`
        break
      case "skip":
        return { stepId: step.id, status: "skipped" }
      default:
        return { stepId: step.id, status: "failed", message: `Unknown action: ${step.action}` }
    }

    const result = await this.withClient(async (client) => this.execCommand(client, cmd))
    return {
      stepId: step.id,
      status: result.success ? "success" : "failed",
      message: result.success ? undefined : result.error,
      duration: Date.now() - start,
    }
  }

  private computeSummary(findings: Finding[]): ScanResult["summary"] {
    return {
      total: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      clean: findings.filter((f) => f.type === "clean").length,
    }
  }
}

interface RemediationStep {
  id: string
  order: number
  action: RemediationAction
  target: string
  description: string
  rollback?: string
}
