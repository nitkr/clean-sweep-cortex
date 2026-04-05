import { createMemo, createSignal, type Accessor } from "solid-js"
import { createSimpleContext } from "./helper"
import { Config } from "@/config/config"
import type { SSHConnectionConfig } from "@cleansweep-cortex/core"
export type { SSHConnectionConfig }

export interface SSHState {
  connections: Accessor<Record<string, SSHConnectionConfig>>
  defaultConnection: Accessor<string | undefined>
  add(connection: SSHConnectionConfig): Promise<void>
  update(name: string, connection: SSHConnectionConfig): Promise<void>
  remove(name: string): Promise<void>
  setDefault(name: string): Promise<void>
}

export const { use: useSSH, provider: SSHProvider } = createSimpleContext({
  name: "SSH",
  init: (): SSHState => {
    const [config, setConfig] = createSignal<Awaited<ReturnType<typeof Config.get>> | undefined>(undefined)

    ;(async () => {
      const cfg = await Config.get()
      setConfig(cfg)
    })()

    const connections = createMemo(() => {
      const cfg = config()
      return cfg?.ssh?.connections ?? {}
    })

    const defaultConnection = createMemo(() => {
      const cfg = config()
      return cfg?.ssh?.defaultConnection
    })

    return {
      connections,
      defaultConnection,
      async add(connection: SSHConnectionConfig) {
        const cfg = await Config.get()
        const ssh = cfg.ssh ?? {}
        const conns = ssh.connections ?? {}
        conns[connection.name] = connection
        await Config.update({ ssh: { ...ssh, connections: conns } })
      },
      async update(name: string, connection: SSHConnectionConfig) {
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
