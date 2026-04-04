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
    const [config, setConfig] = createSignal<Awaited<ReturnType<typeof Config.get>> | undefined>(undefined)

    ;(async () => {
      const cfg = await Config.get()
      setConfig(cfg)
    })()

    const enableTeamChatroom = createMemo(() => {
      const cfg = config()
      return cfg?.experimental?.enable_team_chatroom ?? false
    })

    return {
      enableTeamChatroom,
      async setEnableTeamChatroom(value: boolean) {
        const cfg = await Config.get()
        const experimental = cfg.experimental ?? {}
        await Config.update({ experimental: { ...experimental, enable_team_chatroom: value } })
      },
    }
  },
})
