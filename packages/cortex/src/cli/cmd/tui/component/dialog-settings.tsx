import { createMemo, createSignal } from "solid-js"
import { useSettings } from "@tui/context/settings"
import { DialogSelect, type DialogSelectRef, type DialogSelectOption } from "@tui/ui/dialog-select"
import { useTheme } from "../context/theme"
import { useDialog } from "@tui/ui/dialog"
import { Keybind } from "@/util/keybind"
import { TextAttributes } from "@opentui/core"

function SettingStatus(props: { enabled: boolean }) {
  const { theme } = useTheme()
  if (props.enabled) {
    return <span style={{ fg: theme.primary, attributes: TextAttributes.BOLD }}>enabled</span>
  }
  return <span style={{ fg: theme.textMuted }}>disabled</span>
}

export function DialogSettings() {
  const settings = useSettings()
  const dialog = useDialog()
  const [, setRef] = createSignal<DialogSelectRef<unknown>>()
  const [loading, setLoading] = createSignal(false)

  const options = createMemo(() => [
    {
      value: "team_chatroom",
      title: "Team Chatroom",
      description: "Enable flat real-time collaborative team chatroom (Grok 4.2 style)",
      footer: <SettingStatus enabled={settings.enableTeamChatroom()} />,
      category: undefined,
    },
  ])

  const keybinds = createMemo(() => [
    {
      keybind: Keybind.parse("return")[0],
      title: "toggle",
      onTrigger: async (_option: DialogSelectOption<string>) => {
        if (loading()) return
        setLoading(true)
        try {
          await settings.setEnableTeamChatroom(!settings.enableTeamChatroom())
        } finally {
          setLoading(false)
        }
      },
    },
  ])

  return (
    <DialogSelect
      ref={setRef}
      title="Experimental Settings"
      options={options()}
      keybind={keybinds()}
      onSelect={() => {}}
    />
  )
}
