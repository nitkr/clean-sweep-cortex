export interface TeamMessage {
  id: string
  agent: string
  content: string
  confidence?: number
  timestamp: number
  broadcast: boolean
  recipient?: string
  sessionID: string
}

export interface ChatroomEventBus {
  publish(msg: TeamMessage): void
  subscribe(agent: string, callback: (msg: TeamMessage) => void): () => void
  getHistory(sessionID: string, limit?: number): TeamMessage[]
}

const MAX_HISTORY = 100
const DEFAULT_LIMIT = 50

const history = new Map<string, TeamMessage[]>()
const subscribers = new Map<string, Set<(msg: TeamMessage) => void>>()

const chatroomEventBus: ChatroomEventBus = {
  publish(msg: TeamMessage) {
    const list = history.get(msg.sessionID) ?? []
    list.push(msg)
    if (list.length > MAX_HISTORY) {
      list.shift()
    }
    history.set(msg.sessionID, list)

    if (msg.broadcast) {
      for (const cb of subscribers.values()) {
        for (const fn of cb) {
          fn(msg)
        }
      }
    } else if (msg.recipient) {
      const set = subscribers.get(msg.recipient)
      if (set) {
        for (const fn of set) {
          fn(msg)
        }
      }
    }
  },

  subscribe(agent: string, callback: (msg: TeamMessage) => void) {
    let set = subscribers.get(agent)
    if (!set) {
      set = new Set()
      subscribers.set(agent, set)
    }
    set.add(callback)
    return () => set?.delete(callback)
  },

  getHistory(sessionID: string, limit?: number): TeamMessage[] {
    const list = history.get(sessionID) ?? []
    const n = limit ?? DEFAULT_LIMIT
    return list.slice(-n)
  },
}

export { chatroomEventBus }
