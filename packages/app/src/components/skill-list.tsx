import { Component, For, Show, createMemo, createSignal, type JSX } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"

interface SkillInfo {
  id: string
  name: string
  description: string
  icon: string
  hasService?: boolean
}

const SKILLS: SkillInfo[] = [
  { id: "autoplan", name: "自动评审", description: "运行完整评审流程", icon: "prompt" },
  { id: "benchmark", name: "性能基准", description: "性能回归检测", icon: "status" },
  { id: "browse", name: "浏览器", description: "浏览器自动化", icon: "window-cursor", hasService: true },
  { id: "canary", name: "金丝雀", description: "发布后监控", icon: "eye" },
  { id: "codex", name: "Codex", description: "代码评审与挑战", icon: "glasses" },
  { id: "investigate", name: "调查", description: "根因分析调试", icon: "magnifying-glass" },
  { id: "qa", name: "QA", description: "完整 QA 测试", icon: "check" },
  { id: "review", name: "评审", description: "PR 预合并评审", icon: "review" },
  { id: "ship", name: "发布", description: "部署工作流", icon: "arrow-right" },
]

interface SkillStatus {
  [key: string]: "idle" | "starting" | "running" | "error"
}

interface SkillListProps {
  serverUrl?: () => string | undefined
  directory?: () => string
  onSkillSelect?: (skillId: string) => Promise<void>
}

export const SkillList: Component<SkillListProps> = (props) => {
  const [skillStatus, setSkillStatus] = createSignal<SkillStatus>({})
  const [message, setMessage] = createSignal<string>("")

  const refreshStatus = async () => {
    if (!props.serverUrl?.()) return

    try {
      const response = await fetch(
        `${props.serverUrl()}/service?directory=${encodeURIComponent(props.directory?.() || "")}`,
      )
      if (response.ok) {
        const services = await response.json()
        const newStatus: SkillStatus = {}
        for (const s of services) {
          newStatus[s.id] =
            s.status === "running"
              ? "running"
              : s.status === "starting"
                ? "starting"
                : s.status === "error"
                  ? "error"
                  : "idle"
        }
        setSkillStatus(newStatus)
      }
    } catch {}
  }

  const executeSkill = async (skillId: string) => {
    if (props.onSkillSelect) {
      await props.onSkillSelect(skillId)
      if (skillStatus()[skillId] !== "running") {
        refreshStatus()
      }
    } else {
      setMessage(`Skill ${skillId} selected`)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const getSkillStatus = (skillId: string) => {
    return skillStatus()[skillId] || "idle"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-status-success"
      case "starting":
        return "bg-status-warning animate-pulse"
      case "error":
        return "bg-status-error"
      default:
        return "bg-text-weak/30"
    }
  }

  return (
    <div class="p-4 max-w-xs">
      <div class="flex flex-col gap-2">
        <For each={SKILLS} fallback={<div class="text-12-regular text-text-weak">没有可用的技能</div>}>
          {(skill) => (
            <div
              class="flex items-center gap-3 p-2 rounded hover:bg-background-secondary transition cursor-pointer group"
              onClick={() => executeSkill(skill.id)}
            >
              <div class="w-5 h-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-full h-full"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                  <path d="M8.5 8.5v.01" />
                  <path d="M16 15.5v.01" />
                  <path d="M12 12v.01" />
                  <path d="M11 17v.01" />
                  <path d="M7 14v.01" />
                </svg>
              </div>
              <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                <span class="text-14-medium">{skill.name}</span>
                <span class="text-12-regular text-text-weak truncate">{skill.description}</span>
              </div>
              <Show when={skill.hasService}>
                <div
                  classList={{
                    "w-2 h-2 rounded-full shrink-0": true,
                    [getStatusColor(getSkillStatus(skill.id))]: true,
                  }}
                />
              </Show>
            </div>
          )}
        </For>
      </div>
      <Show when={message()}>
        <div class="mt-3 p-2 rounded bg-background-secondary text-12-regular text-text-weak">{message()}</div>
      </Show>
    </div>
  )
}
