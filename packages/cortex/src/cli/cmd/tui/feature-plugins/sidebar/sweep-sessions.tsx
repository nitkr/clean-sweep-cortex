import type { SweepSession, SweepStatus } from "@cleansweep-cortex/core"
import { getCurrentSweepSession, createSweepSession, setSweepStatus } from "@cleansweep-cortex/core"
import type { TuiPlugin, TuiPluginApi, TuiPluginModule, TuiThemeCurrent } from "@opencode-ai/plugin/tui"
import { createMemo, createSignal, For, onMount, Show } from "solid-js"

const id = "internal:sweep-sessions"

const STATUS_LABELS: Record<SweepStatus, string> = {
  idle: "Idle",
  scanning: "Scanning",
  analyzing: "Analyzing",
  planning: "Planning",
  cleaning: "Cleaning",
  verifying: "Verifying",
  complete: "Complete",
  failed: "Failed",
}

const SEVERITY_ORDER = ["critical", "high", "medium", "low", "info"] as const

const SEVERITY_COLORS = {
  critical: "error",
  high: "warning",
  medium: "text",
  low: "textMuted",
  info: "textMuted",
} as const

function View(props: { api: TuiPluginApi; session_id: string }) {
  const theme = () => props.api.theme.current

  const [session, setSession] = createSignal<SweepSession | undefined>(undefined)
  const [loading, setLoading] = createSignal(false)

  const loadSession = () => {
    setSession(getCurrentSweepSession())
  }

  onMount(() => {
    loadSession()
  })

  const counts = createMemo(() => {
    const s = session()
    if (!s) return { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    const c = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    for (const f of s.findings) {
      if (f.severity in c) c[f.severity as keyof typeof c]++
    }
    return c
  })

  const recentFindings = createMemo((): Array<{ severity: string; description: string }> => {
    const s = session()
    if (!s) return []
    return [...s.findings].sort((a, b) => b.detectedAt - a.detectedAt).slice(0, 5)
  })

  const startScan = async () => {
    const sitePath = props.api.kv.get<string>("wordpress_site_path", "")
    if (!sitePath) return

    setLoading(true)
    try {
      const newSession = createSweepSession({ path: sitePath })
      setSession(newSession)
      setSweepStatus(newSession.id, "scanning")
      loadSession()
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadSession()
  }

  return (
    <box>
      <box flexDirection="row" justifyContent="space-between" alignItems="center">
        <text fg={theme().text}>
          <b>Sweep Session</b>
        </text>
        <text fg={theme().textMuted} onMouseDown={handleRefresh}>
          🔄
        </text>
      </box>

      <Show when={!session()}>
        <text fg={theme().textMuted}>No active session</text>
        <Show when={props.api.kv.get<string>("wordpress_site_path", "")}>
          <box marginTop={1}>
            <text fg={theme().primary} onMouseDown={startScan}>
              ▶ Start Scan
            </text>
          </box>
        </Show>
      </Show>

      <Show when={session()}>
        <text fg={theme().textMuted} wrapMode="none">
          {session()!.site.path}
        </text>

        <text fg={theme().text} marginTop={1}>
          Status:{" "}
          <text fg={session()!.status === "idle" ? theme().textMuted : theme().primary}>
            {STATUS_LABELS[session()!.status]}
          </text>
        </text>

        <box marginTop={1} flexDirection="column" gap={0}>
          <text fg={theme().text} marginBottom={0}>
            Findings:
          </text>
          <For each={SEVERITY_ORDER}>
            {(sev) => (
              <Show when={counts()[sev] > 0}>
                <text fg={theme()[SEVERITY_COLORS[sev]]} marginLeft={2}>
                  {sev}: {counts()[sev]}
                </text>
              </Show>
            )}
          </For>
        </box>

        <Show when={recentFindings().length > 0}>
          <text fg={theme().text} marginTop={1}>
            Recent:
          </text>
          <For each={recentFindings()}>
            {(f) => (
              <text fg={theme()[SEVERITY_COLORS[f.severity as (typeof SEVERITY_ORDER)[number]]]} marginLeft={2}>
                • {f.description.slice(0, 40)}
              </text>
            )}
          </For>
        </Show>
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 150,
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
