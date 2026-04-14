import { Effect, Layer, ServiceMap } from "effect"
import { Log } from "@/util/log"
import { chatroomEventBus, type TeamMessage } from "./chatroom"
import { SyncEvent } from "@/sync"
import { makeRuntime } from "@/effect/run-service"

export namespace TeamSupervisor {
  const log = Log.create({ service: "team.supervisor" })

  export enum AgentState {
    Listening = "listening",
    Processing = "processing",
    Idle = "idle",
    Crashed = "crashed",
  }

  type AgentContext = {
    state: AgentState
    sessionID: string
    unsubscribe?: () => void
    lastHeartbeat: number
    restartCount: number
    restartTimeout?: ReturnType<typeof setTimeout>
  }

  export interface Interface {
    readonly start: (agent: string, sessionID: string) => Effect.Effect<void>
    readonly stop: (agent: string) => Effect.Effect<void>
    readonly restart: (agent: string) => Effect.Effect<void>
    readonly state: (agent: string) => Effect.Effect<AgentState>
    readonly states: () => Effect.Effect<Record<string, AgentState>>
  }

  export class Service extends ServiceMap.Service<Service, Interface>()("@opencode/TeamSupervisor") {}

  const MAX_RESTART_DELAY_MS = 30000
  const INITIAL_RESTART_DELAY_MS = 1000
  const HEARTBEAT_INTERVAL_MS = 30000

  const agents = new Map<string, AgentContext>()

  function getBackoffDelay(restartCount: number): number {
    return Math.min(INITIAL_RESTART_DELAY_MS * Math.pow(2, restartCount), MAX_RESTART_DELAY_MS)
  }

  function updateState(agent: string, state: AgentState) {
    const ctx = agents.get(agent)
    if (ctx) {
      ctx.state = state
      ctx.lastHeartbeat = Date.now()
    }
  }

  function startHeartbeatMonitor() {
    setInterval(() => {
      const now = Date.now()
      for (const [agent, ctx] of agents) {
        if (ctx.state !== AgentState.Crashed && now - ctx.lastHeartbeat > HEARTBEAT_INTERVAL_MS * 2) {
          log.warn("agent heartbeat timeout", { agent })
          ctx.state = AgentState.Crashed
        }
      }
    }, HEARTBEAT_INTERVAL_MS)
  }

  if (typeof process !== "undefined") {
    startHeartbeatMonitor()
  }

  const layer = Layer.succeed(
    Service,
    Service.of({
      start: Effect.fn("TeamSupervisor.start")(function* (agent: string, sessionID: string) {
        const existing = agents.get(agent)
        if (existing) {
          existing.sessionID = sessionID
          return
        }

        const ctx: AgentContext = {
          state: AgentState.Idle,
          sessionID,
          lastHeartbeat: Date.now(),
          restartCount: 0,
        }

        const unsubscribe = chatroomEventBus.subscribe(agent, (msg: TeamMessage) => {
          updateState(agent, AgentState.Processing)

          SyncEvent.run(SyncEvent.TeamMessageAdded, { teamMessage: msg } as any)

          updateState(agent, AgentState.Listening)
        })

        ctx.unsubscribe = unsubscribe
        agents.set(agent, ctx)
        updateState(agent, AgentState.Listening)

        log.info("agent started", { agent, sessionID })
      }),

      stop: Effect.fn("TeamSupervisor.stop")(function* (agent: string) {
        const ctx = agents.get(agent)
        if (!ctx) {
          log.warn("stop called on non-running agent", { agent })
          return
        }

        if (ctx.restartTimeout) {
          clearTimeout(ctx.restartTimeout)
        }
        ctx.unsubscribe?.()
        agents.delete(agent)

        log.info("agent stopped", { agent })
      }),

      restart: Effect.fn("TeamSupervisor.restart")(function* (agent: string) {
        const ctx = agents.get(agent)
        if (!ctx) {
          log.warn("restart called on non-running agent", { agent })
          return
        }

        ctx.state = AgentState.Crashed
        const delay = getBackoffDelay(ctx.restartCount)

        ctx.restartTimeout = setTimeout(() => {
          ctx.unsubscribe?.()
          const sessionID = ctx.sessionID

          const unsub = chatroomEventBus.subscribe(agent, () => {
            updateState(agent, AgentState.Processing)
            updateState(agent, AgentState.Listening)
          })

          ctx.unsubscribe = unsub
          ctx.restartCount++
          ctx.state = AgentState.Listening
          ctx.lastHeartbeat = Date.now()

          log.info("agent restarted", { agent, sessionID, restartCount: ctx.restartCount })
        }, delay)
      }),

      state: Effect.fn("TeamSupervisor.state")(function* (agent: string) {
        return agents.get(agent)?.state ?? AgentState.Idle
      }),

      states: Effect.fn("TeamSupervisor.states")(function* () {
        const result: Record<string, AgentState> = {}
        for (const [agent, ctx] of agents) {
          result[agent] = ctx.state
        }
        return result
      }),
    }),
  )

  const { runSync } = makeRuntime(Service, layer)

  export const start = (agent: string, sessionID: string) => runSync((svc) => svc.start(agent, sessionID))

  export const stop = (agent: string) => runSync((svc) => svc.stop(agent))

  export const restart = (agent: string) => runSync((svc) => svc.restart(agent))

  export const state = (agent: string): AgentState => runSync((svc) => svc.state(agent))

  export const states = (): Record<string, AgentState> => runSync((svc) => svc.states())
}
