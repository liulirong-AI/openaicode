import { Component, For, createSignal, Show } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import { Switch } from "@opencode-ai/ui/switch"
import { Tooltip } from "@opencode-ai/ui/tooltip"

interface SkillConfig {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  hasService?: boolean
}

const defaultSkills: SkillConfig[] = [
  { id: "autoplan", name: "自动评审", description: "运行完整评审流程", icon: "prompt", enabled: true },
  {
    id: "benchmark",
    name: "性能基准",
    description: "性能回归检测",
    icon: "status",
    enabled: true,
  },
  {
    id: "browse",
    name: "浏览器",
    description: "浏览器自动化",
    icon: "window-cursor",
    enabled: true,
    hasService: true,
  },
  { id: "canary", name: "金丝雀", description: "发布后监控", icon: "eye", enabled: true },
  { id: "codex", name: "Codex", description: "代码评审与挑战", icon: "glasses", enabled: true },
  {
    id: "investigate",
    name: "调查",
    description: "根因分析调试",
    icon: "magnifying-glass",
    enabled: true,
  },
  { id: "qa", name: "QA", description: "完整 QA 测试", icon: "check", enabled: true },
  { id: "review", name: "评审", description: "PR 预合并评审", icon: "review", enabled: true },
  { id: "ship", name: "发布", description: "部署工作流", icon: "arrow-right", enabled: true },
]

export const SettingsSkills: Component = () => {
  const [skills, setSkills] = createSignal<SkillConfig[]>(defaultSkills)
  const [expandedSkill, setExpandedSkill] = createSignal<string | null>(null)

  const toggleSkill = (id: string) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
  }

  return (
    <div class="flex flex-col gap-4 p-4 max-h-[60vh] overflow-y-auto">
      <div class="flex flex-col gap-2">
        <h2 class="text-18-semibold">技能</h2>
        <p class="text-14-regular text-text-weak">配置 GStack 技能以实现专业化工作流程</p>
      </div>

      <div class="flex flex-col gap-2">
        <For each={skills()}>
          {(skill) => (
            <div class="flex flex-col gap-2 p-3 rounded-lg bg-background-secondary">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded bg-background-base">
                    <Icon name={skill.icon as any} size="medium" />
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-14-medium">{skill.name}</span>
                    <span class="text-12-regular text-text-weak">{skill.description}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Show when={skill.hasService}>
                    <Tooltip value="需要后台服务">
                      <div class="w-2 h-2 rounded-full bg-status-warning" />
                    </Tooltip>
                  </Show>
                  <Switch checked={skill.enabled} onChange={() => toggleSkill(skill.id)} />
                </div>
              </div>
              <Show when={skill.id === "browse" && expandedSkill() === "browse"}>
                <div class="mt-2 pt-2 border-t border-border flex flex-col gap-2">
                  <label class="flex flex-col gap-1">
                    <span class="text-12-medium">Chrome 路径</span>
                    <input
                      type="text"
                      class="px-2 py-1.5 rounded bg-background-base border border-border text-14-regular"
                      placeholder="D:/AIcode/chrome-win/chrome.exe"
                    />
                  </label>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>

      <div class="flex flex-col gap-2 pt-4 border-t border-border">
        <h3 class="text-14-semibold">关于技能</h3>
        <p class="text-12-regular text-text-weak">
          技能是专业化的工作流程，可以从侧边栏或使用聊天中的 /skill 命令来调用。部分技能需要运行后台服务。
        </p>
      </div>
    </div>
  )
}
