import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { createMemo, For, Show, createSignal, onMount } from "solid-js"
import { Process } from "@/util/process"
import { siteManager, type DetectedSite } from "@cleansweep-cortex/core/site-manager"
import { connectionManager } from "@cleansweep-cortex/core/connection-manager"

type ConnectionStatus = { type: "ssh"; name: string } | { type: "local" }

const id = "internal:wordpress-files"

interface FileEntry {
  name: string
  type: "file" | "dir"
  size: number
  modified: string
}

function View(props: { api: TuiPluginApi; session_id: string }) {
  const theme = () => props.api.theme.current

  const sitePath = createMemo(() => props.api.kv.get<string>("wordpress_site_path", undefined))
  const [currentPath, setCurrentPath] = createSignal("")
  const [entries, setEntries] = createSignal<FileEntry[]>([])
  const [expandedDirs, setExpandedDirs] = createSignal<Set<string>>(new Set())
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [detectedSites, setDetectedSites] = createSignal<DetectedSite[]>([])
  const [validationError, setValidationError] = createSignal<string | null>(null)

  const connectionStatus = createMemo<ConnectionStatus>(() => {
    if (connectionManager.isConnected()) {
      const conn = connectionManager.getActiveConnection()
      if (conn) return { type: "ssh", name: conn.name }
    }
    return { type: "local" }
  })

  const displayPath = createMemo(() => currentPath() || sitePath() || "")

  onMount(async () => {
    const path = sitePath()
    if (path) {
      const validation = await siteManager.validatePath(path)
      if (!validation.exists) {
        setValidationError(`Site path does not exist: ${path}`)
      } else if (!validation.isWordPress) {
        setValidationError(`Not a WordPress installation: ${path}`)
      }
      loadEntries(displayPath())
    } else {
      const detected = await siteManager.detectLocalWordPress("/home/venturer/myprojects")
      const cortexProject = detected.filter((s: DetectedSite) => s.path.includes("cleansweep-cortex"))
      const other = detected.filter((s: DetectedSite) => !s.path.includes("cleansweep-cortex"))
      setDetectedSites([...cortexProject, ...other].slice(0, 5))
    }
  })

  const loadEntries = async (dirPath: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await Process.text(["/bin/ls", "-la", dirPath])
      const lines = result.text.split("\n").filter((line) => line.trim() && !line.startsWith("total"))

      const parsed: FileEntry[] = []
      for (const line of lines) {
        const match = line.match(/^([d-])([rwxts-]{9})\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\w+\s+\d+\s+\d+\s+\d+)\s+(.+)$/)
        if (!match) continue

        const [, type, , size, modified, name] = match
        if (name === "." || name === "..") continue

        parsed.push({
          name,
          type: type === "d" ? "dir" : "file",
          size: parseInt(size, 10),
          modified,
        })
      }

      const sorted = [
        ...parsed.filter((e) => e.type === "dir").sort((a, b) => a.name.localeCompare(b.name)),
        ...parsed.filter((e) => e.type === "file").sort((a, b) => a.name.localeCompare(b.name)),
      ]

      setEntries(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load directory")
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => {
    loadEntries(displayPath())
  }

  const toggleDir = (name: string) => {
    const newExpanded = new Set(expandedDirs())
    const fullPath = currentPath() ? `${currentPath()}/${name}` : `${sitePath()}/${name}`
    if (newExpanded.has(fullPath)) {
      newExpanded.delete(fullPath)
    } else {
      newExpanded.add(fullPath)
    }
    setExpandedDirs(newExpanded)
  }

  const navigateTo = (name: string) => {
    const newPath = currentPath() ? `${currentPath()}/${name}` : `${sitePath()}/${name}`
    setCurrentPath(newPath)
    setExpandedDirs((prev) => new Set([...prev, newPath]))
    loadEntries(newPath)
  }

  const navigateUp = () => {
    const parts = currentPath().split("/")
    parts.pop()
    const newPath = parts.join("/").replace(sitePath(), "")
    setCurrentPath(newPath === sitePath() ? "" : newPath.replace(/^\//, ""))
    loadEntries(currentPath() || sitePath())
  }

  const getFileIcon = (name: string, type: "file" | "dir") => {
    if (type === "dir") return "📁"
    const ext = name.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "php":
        return "🐘"
      case "js":
      case "mjs":
        return "📜"
      case "css":
      case "scss":
      case "sass":
        return "🎨"
      case "html":
      case "htm":
        return "🌐"
      case "json":
        return "📋"
      case "md":
        return "📝"
      case "txt":
        return "📄"
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "svg":
        return "🖼"
      default:
        return "📄"
    }
  }

  const isExpanded = (name: string) => {
    const fullPath = currentPath() ? `${currentPath()}/${name}` : `${sitePath()}/${name}`
    return expandedDirs().has(fullPath)
  }

  const connectionName = createMemo(() => {
    const status = connectionStatus()
    return status.type === "ssh" ? status.name : null
  })

  return (
    <box>
      <box flexDirection="row" justifyContent="space-between" alignItems="center">
        <text fg={theme().text}>
          <b>WordPress Site</b>
        </text>
        <box flexDirection="row" gap={2}>
          <Show
            when={connectionName()}
            fallback={
              <text fg={theme().textMuted} wrapMode="none">
                💻 Local
              </text>
            }
          >
            <text fg={theme().primary} wrapMode="none">
              🔗 SSH: {connectionName()}
            </text>
          </Show>
          <text fg={theme().textMuted} onMouseDown={refresh}>
            🔄
          </text>
        </box>
      </box>

      <Show when={validationError()}>
        <text fg={theme().error}>{validationError()}</text>
      </Show>

      <Show when={!sitePath() && !validationError()}>
        <text fg={theme().textMuted}>No WordPress site configured</text>
        <Show when={detectedSites().length > 0}>
          <text fg={theme().textMuted}>Detected sites:</text>
          <For each={detectedSites()}>
            {(site) => (
              <text fg={theme().primary} wrapMode="none">
                📁 {site.name || site.path}
              </text>
            )}
          </For>
        </Show>
        <text fg={theme().textMuted} wrapMode="none">
          💻 Local: Use @cortex set-site to configure
        </text>
        <text fg={theme().textMuted} wrapMode="none">
          🔗 Remote: Use @cortex connect to connect to a server
        </text>
      </Show>

      <Show when={sitePath() && !validationError()}>
        <text fg={theme().textMuted} wrapMode="none">
          {displayPath()}
        </text>

        <Show when={currentPath()}>
          <text fg={theme().primary} onMouseDown={navigateUp}>
            ⬆ Up
          </text>
        </Show>

        <Show when={loading()}>
          <text fg={theme().textMuted}>Loading...</text>
        </Show>

        <Show when={error()}>
          <text fg={theme().error}>{error()}</text>
        </Show>

        <For each={entries()}>
          {(entry) => (
            <box flexDirection="row" gap={1}>
              <Show
                when={entry.type === "dir"}
                fallback={
                  <text fg={theme().textMuted} wrapMode="none">
                    {getFileIcon(entry.name, entry.type)} {entry.name}
                  </text>
                }
              >
                <text
                  fg={theme().primary}
                  wrapMode="none"
                  onMouseDown={() => (isExpanded(entry.name) ? toggleDir(entry.name) : navigateTo(entry.name))}
                >
                  {isExpanded(entry.name) ? "▼" : "▶"} {getFileIcon(entry.name, entry.type)} {entry.name}
                </text>
              </Show>
            </box>
          )}
        </For>
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 200,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} session_id={props.session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
}

export default plugin
