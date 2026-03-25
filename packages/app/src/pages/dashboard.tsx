import { createSignal, createResource, For, Show, onMount } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { useLanguage } from "@/context/language"
import { Button } from "@opencode-ai/ui/button"
import { Card } from "@opencode-ai/ui/card"
import { Spinner } from "@opencode-ai/ui/spinner"

interface DashboardOverview {
  totalSessions: number
  activeSessions: number
  recentSessions: Array<{
    id: string
    title: string
    directory: string
    updatedAt: number
    status: string
  }>
  agentHealth: Array<{
    sessionId: string
    status: string
    isBusy: boolean
  }>
  taskStats: {
    pending: number
    inProgress: number
    completed: number
    idle: number
  }
}

interface SessionGroup {
  active: Array<{
    id: string
    title: string
    directory: string
    updatedAt: number
    createdAt: number
    status: string
  }>
  idle: Array<{
    id: string
    title: string
    directory: string
    updatedAt: number
    createdAt: number
    status: string
  }>
  archived: Array<{
    id: string
    title: string
    directory: string
    updatedAt: number
    createdAt: number
    status: string
  }>
}

export default function DashboardPage() {
  const language = useLanguage()
  const navigate = useNavigate()
  const [lastRefresh, setLastRefresh] = createSignal(Date.now())
  const [serverUrl] = createSignal("http://localhost:4096")

  const fetchAPI = async (endpoint: string) => {
    const response = await fetch(`${serverUrl()}${endpoint}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }

  const [overview, { refetch: refetchOverview }] = createResource(async () => {
    try {
      return (await fetchAPI("/dashboard/overview")) as DashboardOverview
    } catch (e) {
      console.error("Failed to fetch dashboard overview:", e)
      return null
    }
  })

  const [sessions, { refetch: refetchSessions }] = createResource(async () => {
    try {
      return (await fetchAPI("/dashboard/sessions")) as SessionGroup
    } catch (e) {
      console.error("Failed to fetch sessions:", e)
      return null
    }
  })

  onMount(() => {
    const interval = setInterval(() => {
      refetchOverview()
      refetchSessions()
      setLastRefresh(Date.now())
    }, 15000)

    return () => clearInterval(interval)
  })

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString(language.locale() === "zh" ? "zh-CN" : "en-US")
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "busy":
        return language.t("dashboard.status.busy")
      case "idle":
        return language.t("dashboard.status.idle")
      case "retry":
        return language.t("dashboard.status.retry")
      default:
        return status
    }
  }

  return (
    <div class="flex-1 overflow-auto p-6 bg-background">
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-text-strong">{language.t("dashboard.title")}</h1>
            <p class="text-sm text-text-weak mt-1">
              {language.t("dashboard.lastUpdated")}: {formatTime(lastRefresh())}
            </p>
          </div>
          <Button
            onClick={() => {
              refetchOverview()
              refetchSessions()
            }}
          >
            {language.t("dashboard.refresh")}
          </Button>
        </div>

        <Show when={overview()} fallback={<Spinner />}>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card class="p-4">
              <div class="text-sm text-text-weak">{language.t("dashboard.totalSessions")}</div>
              <div class="text-3xl font-bold mt-1">{overview()!.totalSessions}</div>
            </Card>
            <Card class="p-4">
              <div class="text-sm text-text-weak">{language.t("dashboard.activeSessions")}</div>
              <div class="text-3xl font-bold mt-1 text-green-500">{overview()!.activeSessions}</div>
            </Card>
            <Card class="p-4">
              <div class="text-sm text-text-weak">{language.t("dashboard.inProgress")}</div>
              <div class="text-3xl font-bold mt-1 text-blue-500">{overview()!.taskStats.inProgress}</div>
            </Card>
            <Card class="p-4">
              <div class="text-sm text-text-weak">{language.t("dashboard.idle")}</div>
              <div class="text-3xl font-bold mt-1 text-yellow-500">{overview()!.taskStats.idle}</div>
            </Card>
          </div>
        </Show>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <Card class="p-4">
              <h2 class="text-lg font-semibold mb-4">{language.t("dashboard.kanban")}</h2>
              <Show when={sessions()} fallback={<Spinner />}>
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="font-medium text-green-500">{language.t("dashboard.active")}</h3>
                      <span class="text-sm text-text-weak">{sessions()!.active.length}</span>
                    </div>
                    <div class="space-y-2 min-h-[200px]">
                      <For each={sessions()!.active.slice(0, 5)}>
                        {(session) => (
                          <div
                            class="p-3 rounded-lg bg-green-500/10 border border-green-500/20 cursor-pointer hover:bg-green-500/20 transition"
                            onClick={() => navigate(`/session/${session.id}`)}
                          >
                            <div class="font-medium text-sm truncate">{session.title}</div>
                            <div class="text-xs text-text-weak mt-1">{formatTime(session.updatedAt)}</div>
                          </div>
                        )}
                      </For>
                      <Show when={sessions()!.active.length === 0}>
                        <div class="text-center text-text-weak py-8">{language.t("dashboard.noActive")}</div>
                      </Show>
                    </div>
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="font-medium text-yellow-500">{language.t("dashboard.idle")}</h3>
                      <span class="text-sm text-text-weak">{sessions()!.idle.length}</span>
                    </div>
                    <div class="space-y-2 min-h-[200px]">
                      <For each={sessions()!.idle.slice(0, 5)}>
                        {(session) => (
                          <div
                            class="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/20 transition"
                            onClick={() => navigate(`/session/${session.id}`)}
                          >
                            <div class="font-medium text-sm truncate">{session.title}</div>
                            <div class="text-xs text-text-weak mt-1">{formatTime(session.updatedAt)}</div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="font-medium text-gray-500">{language.t("dashboard.archived")}</h3>
                      <span class="text-sm text-text-weak">{sessions()!.archived.length}</span>
                    </div>
                    <div class="space-y-2 min-h-[200px]">
                      <For each={sessions()!.archived.slice(0, 5)}>
                        {(session) => (
                          <div
                            class="p-3 rounded-lg bg-gray-500/10 border border-gray-500/20 cursor-pointer hover:bg-gray-500/20 transition"
                            onClick={() => navigate(`/session/${session.id}`)}
                          >
                            <div class="font-medium text-sm truncate">{session.title}</div>
                            <div class="text-xs text-text-weak mt-1">{formatTime(session.updatedAt)}</div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </Show>
            </Card>
          </div>

          <div>
            <Card class="p-4">
              <h2 class="text-lg font-semibold mb-4">{language.t("dashboard.recentSessions")}</h2>
              <Show when={overview()?.recentSessions} fallback={<Spinner />}>
                <div class="space-y-3">
                  <For each={overview()!.recentSessions.slice(0, 8)}>
                    {(session) => (
                      <div
                        class="flex items-center justify-between p-2 rounded hover:bg-background-secondary cursor-pointer"
                        onClick={() => navigate(`/session/${session.id}`)}
                      >
                        <div class="flex-1 min-w-0">
                          <div class="font-medium text-sm truncate">{session.title}</div>
                          <div class="text-xs text-text-weak truncate">{session.directory}</div>
                        </div>
                        <span class="ml-2 text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                          {getStatusLabel(session.status)}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </Card>

            <Card class="p-4 mt-4">
              <h2 class="text-lg font-semibold mb-4">{language.t("dashboard.agentHealth")}</h2>
              <Show when={overview()?.agentHealth} fallback={<Spinner />}>
                <div class="space-y-2">
                  <For each={overview()!.agentHealth.slice(0, 5)}>
                    {(agent) => (
                      <div class="flex items-center justify-between">
                        <span class="text-sm truncate flex-1">{agent.sessionId.slice(0, 8)}...</span>
                        <span
                          class={`text-xs px-2 py-1 rounded ${
                            agent.isBusy ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {agent.status}
                        </span>
                      </div>
                    )}
                  </For>
                  <Show when={overview()!.agentHealth.length === 0}>
                    <div class="text-center text-text-weak py-4">{language.t("dashboard.noAgents")}</div>
                  </Show>
                </div>
              </Show>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
