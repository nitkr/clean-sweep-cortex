import { createMemo, createSignal } from "solid-js"
import { createSimpleContext } from "./helper"
import { Config } from "@/config/config"

export type SettingsState = {
  enableTeamChatroom: () => boolean
  setEnableTeamChatroom: (value: boolean) => Promise<void>
}

export const { use: useSettings, provider: SettingsProvider } = createSimpleContext({
  name: "Settings",
  init: (): SettingsState => {
    const [config, setConfig] = createSignal<Awaited<ReturnType<typeof Config.getGlobal>> | undefined>(undefined)

    ;(async () => {
      const cfg = await Config.getGlobal()
      setConfig(cfg)
    })()

    const enableTeamChatroom = createMemo(() => {
      const cfg = config()
      return cfg?.experimental?.enable_team_chatroom ?? true
    })

    return {
      enableTeamChatroom,
      async setEnableTeamChatroom(value: boolean) {
        const cfg = await Config.getGlobal()
        const experimental = cfg.experimental ?? {}
        await Config.updateGlobal({ experimental: { ...experimental, enable_team_chatroom: value } })
        const updated = await Config.getGlobal()
        setConfig(updated)
      },
    }
  },
})
