import { existsSync, writeFileSync } from "fs"
import path from "path"
import os from "os"
import { Client } from "ssh2"
import type { ConnectConfig } from "ssh2"
import { readFileSync as fsReadFileSync } from "fs"

export interface SSHConnectionConfig {
  name: string
  host: string
  port: number
  username: string
  password?: string
  privateKeyPath?: string
  defaultSitePath?: string
}

interface ConnectionStore {
  connections: Record<string, SSHConnectionConfig>
  activeConnection: string | null
}

const STORE_FILENAME = "cortex-connections.json"

function getStorePath(): string {
  return path.join(os.homedir(), ".config", "cortex", STORE_FILENAME)
}

function loadStore(): ConnectionStore {
  const storePath = getStorePath()
  if (!existsSync(storePath)) {
    return { connections: {}, activeConnection: null }
  }
  try {
    const data = fsReadFileSync(storePath, "utf-8")
    return JSON.parse(data) as ConnectionStore
  } catch {
    return { connections: {}, activeConnection: null }
  }
}

function saveStore(store: ConnectionStore): void {
  const storePath = getStorePath()
  const dir = path.dirname(storePath)
  if (!existsSync(dir)) {
    require("fs").mkdirSync(dir, { recursive: true })
  }
  writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8")
}

export class ConnectionManager {
  private static instance: ConnectionManager
  private store: ConnectionStore
  private client: Client | null = null

  private constructor() {
    this.store = loadStore()
  }

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  async addConnection(config: SSHConnectionConfig): Promise<void> {
    this.store.connections[config.name] = config
    saveStore(this.store)
  }

  async removeConnection(name: string): Promise<void> {
    delete this.store.connections[name]
    if (this.store.activeConnection === name) {
      this.store.activeConnection = null
      await this.disconnect()
    }
    saveStore(this.store)
  }

  async listConnections(): Promise<SSHConnectionConfig[]> {
    return Object.values(this.store.connections)
  }

  getConnection(name: string): SSHConnectionConfig | null {
    return this.store.connections[name] ?? null
  }

  getActiveConnection(): SSHConnectionConfig | null {
    if (!this.store.activeConnection) return null
    return this.store.connections[this.store.activeConnection] ?? null
  }

  isConnected(): boolean {
    return this.client !== null && this.store.activeConnection !== null
  }

  async testConnection(name: string): Promise<{ success: boolean; error?: string }> {
    const config = this.store.connections[name]
    if (!config) {
      return { success: false, error: `Connection "${name}" not found` }
    }

    return new Promise((resolve) => {
      const client = new Client()
      const timeout = setTimeout(() => {
        client.end()
        resolve({ success: false, error: "Connection timeout" })
      }, 10000)

      client.on("ready", () => {
        clearTimeout(timeout)
        client.end()
        resolve({ success: true })
      })

      client.on("error", (err) => {
        clearTimeout(timeout)
        resolve({ success: false, error: err.message })
      })

      const connectOpts: ConnectConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
      }

      if (config.password) {
        connectOpts.password = config.password
      }
      if (config.privateKeyPath) {
        try {
          connectOpts.privateKey = fsReadFileSync(config.privateKeyPath)
        } catch {
          resolve({ success: false, error: `Failed to read private key: ${config.privateKeyPath}` })
          return
        }
      }

      client.connect(connectOpts)
    })
  }

  async connect(name: string): Promise<{ success: boolean; error?: string }> {
    const config = this.store.connections[name]
    if (!config) {
      return { success: false, error: `Connection "${name}" not found` }
    }

    const testResult = await this.testConnection(name)
    if (!testResult.success) {
      return testResult
    }

    this.store.activeConnection = name
    saveStore(this.store)

    return { success: true }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.end()
      this.client = null
    }
    this.store.activeConnection = null
    saveStore(this.store)
  }

  getActiveClient(): Client | null {
    if (!this.store.activeConnection) return null
    const config = this.store.connections[this.store.activeConnection]
    if (!config) return null

    if (!this.client) {
      this.client = new Client()
    }
    return this.client
  }
}

export const connectionManager = ConnectionManager.getInstance()
