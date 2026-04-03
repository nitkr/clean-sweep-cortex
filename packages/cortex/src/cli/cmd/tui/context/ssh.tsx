import { createMemo } from "solid-js"
import { createSimpleContext } from "./helper"
import { Config } from "@/config/config"

export type SSHConnection = {
  name: string
  host: string
  port: number
  username: string
  password?: string
  privateKeyPath?: string
}

export type SSHState = {
  connections: () => Record<string, SSHConnection>
  defaultConnection: () => string | undefined
  add: (connection: SSHConnection) => Promise<void>
  update: (name: string, connection: SSHConnection) => Promise<void>
  remove: (name: string) => Promise<void>
  setDefault: (name: string) => Promise<void>
}

export const { use: useSSH, provider: SSHProvider } = createSimpleContext({
  name: "SSH",
  init: (): SSHState => {
    const connections = createMemo(() => {
      const cfg = Config.get()
      return cfg.ssh?.connections ?? {}
    })

    const defaultConnection = createMemo(() => {
      const cfg = Config.get()
      return cfg.ssh?.defaultConnection
    })

    return {
      connections,
      defaultConnection,
      async add(connection: SSHConnection) {
        const cfg = await Config.get()
        const ssh = cfg.ssh ?? {}
        const conns = ssh.connections ?? {}
        conns[connection.name] = connection
        await Config.update({ ssh: { ...ssh, connections: conns } })
      },
      async update(name: string, connection: SSHConnection) {
        const cfg = await Config.get()
        const ssh = cfg.ssh ?? {}
        const conns = ssh.connections ?? {}
        if (conns[name]) {
          conns[name] = connection
          await Config.update({ ssh: { ...ssh, connections: conns } })
        }
      },
      async remove(name: string) {
        const cfg = await Config.get()
        const ssh = cfg.ssh ?? {}
        const conns = ssh.connections ?? {}
        delete conns[name]
        const newDefault = ssh.defaultConnection === name ? undefined : ssh.defaultConnection
        await Config.update({ ssh: { ...ssh, connections: conns, defaultConnection: newDefault } })
      },
      async setDefault(name: string) {
        const cfg = await Config.get()
        const ssh = cfg.ssh ?? {}
        await Config.update({ ssh: { ...ssh, defaultConnection: name } })
      },
    }
  },
})
