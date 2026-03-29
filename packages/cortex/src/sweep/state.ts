import type { SweepSession, SweepSite, SweepStatus, SweepFinding, SweepRemediationStep } from "./types"

const sessions = new Map<string, SweepSession>()
let currentSessionId: string | null = null

export function generateId(): string {
  return `sweep_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function createSweepSession(site: SweepSite): SweepSession {
  const id = generateId()
  const session: SweepSession = {
    id,
    site,
    status: "idle",
    findings: [],
    remediationSteps: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  sessions.set(id, session)
  currentSessionId = id
  return session
}

export function getSweepSession(id: string): SweepSession | undefined {
  return sessions.get(id)
}

export function getCurrentSweepSession(): SweepSession | undefined {
  if (!currentSessionId) return undefined
  return sessions.get(currentSessionId)
}

export function setCurrentSweepSession(id: string): void {
  if (sessions.has(id)) {
    currentSessionId = id
  }
}

export function listSweepSessions(): SweepSession[] {
  return Array.from(sessions.values()).sort((a, b) => b.createdAt - a.createdAt)
}

export function updateSweepSession(id: string, updates: Partial<SweepSession>): SweepSession | undefined {
  const session = sessions.get(id)
  if (!session) return undefined
  const updated = { ...session, ...updates, updatedAt: Date.now() }
  sessions.set(id, updated)
  return updated
}

export function setSweepStatus(id: string, status: SweepStatus): SweepSession | undefined {
  return updateSweepSession(id, { status })
}

export function addSweepFinding(id: string, finding: Omit<SweepFinding, "id" | "detectedAt" | "resolved">): SweepFinding | undefined {
  const session = sessions.get(id)
  if (!session) return undefined
  const newFinding: SweepFinding = {
    ...finding,
    id: `finding_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    detectedAt: Date.now(),
    resolved: false,
  }
  session.findings.push(newFinding)
  session.updatedAt = Date.now()
  return newFinding
}

export function resolveSweepFinding(sessionId: string, findingId: string, resolution: string): boolean {
  const session = sessions.get(sessionId)
  if (!session) return false
  const finding = session.findings.find(f => f.id === findingId)
  if (!finding) return false
  finding.resolved = true
  finding.resolvedAt = Date.now()
  finding.resolution = resolution
  session.updatedAt = Date.now()
  return true
}

export function addRemediationStep(id: string, step: Omit<SweepRemediationStep, "order" | "timestamp">): SweepRemediationStep | undefined {
  const session = sessions.get(id)
  if (!session) return undefined
  const newStep: SweepRemediationStep = {
    ...step,
    order: session.remediationSteps.length + 1,
    timestamp: Date.now(),
  }
  session.remediationSteps.push(newStep)
  session.updatedAt = Date.now()
  return newStep
}

export function updateRemediationStep(sessionId: string, stepIndex: number, updates: Partial<SweepRemediationStep>): boolean {
  const session = sessions.get(sessionId)
  if (!session) return false
  const step = session.remediationSteps[stepIndex]
  if (!step) return false
  Object.assign(step, updates)
  session.updatedAt = Date.now()
  return true
}

export function completeSweepSession(id: string): SweepSession | undefined {
  return updateSweepSession(id, {
    status: "complete",
    completedAt: Date.now(),
  })
}

export function failSweepSession(id: string, error: string): SweepSession | undefined {
  return updateSweepSession(id, {
    status: "failed",
    error,
  })
}

export function deleteSweepSession(id: string): boolean {
  const deleted = sessions.delete(id)
  if (currentSessionId === id) {
    currentSessionId = sessions.keys().next().value ?? null
  }
  return deleted
}
