import { createMemo, createSignal } from "solid-js"
import { useSSH, type SSHConnectionConfig } from "../context/ssh"
import { map, pipe, entries, sortBy } from "remeda"
import { DialogSelect, type DialogSelectRef, type DialogSelectOption } from "@tui/ui/dialog-select"
import { useTheme } from "../context/theme"
import { Keybind } from "@/util/keybind"
import { TextAttributes } from "@opentui/core"
import { useDialog } from "@tui/ui/dialog"
import { DialogPrompt } from "@tui/ui/dialog-prompt"
import { DialogConfirm } from "@tui/ui/dialog-confirm"

function ConnectionStatus(props: { isDefault: boolean }) {
  const { theme } = useTheme()
  if (props.isDefault) {
    return <span style={{ fg: theme.primary, attributes: TextAttributes.BOLD }}>default</span>
  }
  return <span style={{ fg: theme.textMuted }}> </span>
}

export function DialogSSH() {
  const ssh = useSSH()
  const dialog = useDialog()
  const [, setRef] = createSignal<DialogSelectRef<unknown>>()
  const [loading, setLoading] = createSignal(false)

  const options = createMemo(() => {
    const connections = ssh.connections()
    const defaultConn = ssh.defaultConnection()

    return pipe(
      entries(connections),
      sortBy(([name]) => name),
      map(([name, conn]) => ({
        value: name,
        title: conn.name,
        description: `${conn.username}@${conn.host}:${conn.port}`,
        footer: <ConnectionStatus isDefault={name === defaultConn} />,
        category: undefined,
      })),
    )
  })

  const keybinds = createMemo(() => [
    {
      keybind: Keybind.parse("enter")[0],
      title: "set default",
      onTrigger: async (option: DialogSelectOption<string>) => {
        if (loading()) return
        setLoading(true)
        try {
          await ssh.setDefault(option.value)
        } finally {
          setLoading(false)
        }
      },
    },
    {
      keybind: Keybind.parse("ctrl+e")[0],
      title: "edit",
      onTrigger: async (option: DialogSelectOption<string>) => {
        const conn = ssh.connections()[option.value]
        if (!conn) return
        await showEditForm(option.value, conn)
      },
    },
    {
      keybind: Keybind.parse("ctrl+d")[0],
      title: "delete",
      onTrigger: async (option: DialogSelectOption<string>) => {
        const confirmed = await DialogConfirm.show(dialog, "Delete Connection", `Delete "${option.value}"?`)
        if (confirmed) {
          await ssh.remove(option.value)
        }
      },
    },
  ])

  async function showAddForm() {
    const name = await DialogPrompt.show(dialog, "Connection Name", { placeholder: "my-server" })
    if (!name) return

    const host = await DialogPrompt.show(dialog, "Host", { placeholder: "192.168.1.1 or example.com" })
    if (!host) return

    const portStr = await DialogPrompt.show(dialog, "Port", { placeholder: "22", value: "22" })
    const port = parseInt(portStr ?? "22", 10)
    if (isNaN(port) || port <= 0 || port > 65535) return

    const username = await DialogPrompt.show(dialog, "Username", { placeholder: "root" })
    if (!username) return

    const password = await DialogPrompt.show(dialog, "Password (optional)", { placeholder: "Leave empty for key auth" })
    const privateKeyPath = await DialogPrompt.show(dialog, "Private Key Path (optional)", {
      placeholder: "Leave empty for password auth",
    })

    const connection: SSHConnectionConfig = {
      name,
      host,
      port,
      username,
      password: password || undefined,
      privateKeyPath: privateKeyPath || undefined,
    }

    await ssh.add(connection)
  }

  async function showEditForm(name: string, conn: SSHConnectionConfig) {
    const newName = await DialogPrompt.show(dialog, "Connection Name", { value: conn.name })
    if (!newName || newName === name) {
      if (newName && newName !== name) {
        await ssh.remove(name)
        await ssh.add({ ...conn, name: newName })
      }
      return
    }

    const host = await DialogPrompt.show(dialog, "Host", { value: conn.host })
    if (!host) return

    const portStr = await DialogPrompt.show(dialog, "Port", { value: conn.port.toString() })
    const port = parseInt(portStr ?? "22", 10)
    if (isNaN(port) || port <= 0 || port > 65535) return

    const username = await DialogPrompt.show(dialog, "Username", { value: conn.username })
    if (!username) return

    const password = await DialogPrompt.show(dialog, "Password (optional)", { value: conn.password ?? "" })
    const privateKeyPath = await DialogPrompt.show(dialog, "Private Key Path (optional)", {
      value: conn.privateKeyPath ?? "",
    })

    await ssh.remove(name)
    await ssh.add({
      name: newName,
      host,
      port,
      username,
      password: password || undefined,
      privateKeyPath: privateKeyPath || undefined,
    })
  }

  return (
    <DialogSelect
      ref={setRef}
      title="SSH Connections"
      options={options()}
      keybind={keybinds()}
      onSelect={(option) => {
        // Don't close on select, only on escape
      }}
      onFilter={(query) => {
        if (query.length === 0) return
        if (query === "add" || query === "new") {
          showAddForm()
        }
      }}
    />
  )
}
