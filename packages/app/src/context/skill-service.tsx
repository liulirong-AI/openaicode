import { createSignal } from "solid-js"

export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  status: "idle" | "running" | "success" | "error"
}

export interface SkillExecutionResult {
  skillId: string
  success: boolean
  output: string
  error?: string
}

const SKILLS_DATA: Skill[] = []

export function createSkillService() {
  const [skills] = createSignal<Skill[]>(SKILLS_DATA)
  const [isExecuting, setIsExecuting] = createSignal(false)
  const [lastResult, setLastResult] = createSignal<SkillExecutionResult | null>(null)

  const executeSkill = async (skillId: string): Promise<SkillExecutionResult> => {
    setIsExecuting(true)

    const skill = skills().find((s) => s.id === skillId)
    if (!skill) {
      const result = { skillId, success: false, output: "", error: "Skill not found" }
      setLastResult(result)
      setIsExecuting(false)
      return result
    }

    console.log(`[SkillService] Executing skill: ${skillId}`)

    try {
      let result: SkillExecutionResult

      switch (skillId) {
        case "browse":
          result = await executeBrowseSkill()
          break
        case "qa":
          result = await executeQASkill()
          break
        case "review":
          result = await executeReviewSkill()
          break
        case "investigate":
          result = await executeInvestigateSkill()
          break
        default:
          result = {
            skillId,
            success: true,
            output: `Skill '${skill.name}' is ready to use. Use the skill command in the chat to activate it.`,
          }
      }

      setLastResult(result)
      return result
    } catch (error) {
      const result = {
        skillId,
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Unknown error",
      }
      setLastResult(result)
      return result
    } finally {
      setIsExecuting(false)
    }
  }

  const executeBrowseSkill = async (): Promise<SkillExecutionResult> => {
    return new Promise((resolve) => {
      const { spawn } = require("child_process")

      const proc = spawn(
        "node",
        [
          "--require",
          "./.opencode/skills/browse/dist/bun-polyfill.cjs",
          "./.opencode/skills/browse/dist/server-node.mjs",
        ],
        {
          stdio: ["ignore", "pipe", "pipe"],
          detached: true,
          cwd: process.cwd(),
        },
      )

      let output = ""
      let errorOutput = ""

      proc.stdout?.on("data", (data: any) => {
        output += data.toString()
      })

      proc.stderr?.on("data", (data: any) => {
        errorOutput += data.toString()
      })

      proc.on("error", (err: any) => {
        resolve({
          skillId: "browse",
          success: false,
          output: errorOutput,
          error: err.message,
        })
      })

      setTimeout(() => {
        if (proc.pid) {
          try {
            const fs = require("fs")
            if (fs.existsSync(".gstack/browse.json")) {
              const state = JSON.parse(fs.readFileSync(".gstack/browse.json", "utf8"))
              resolve({
                skillId: "browse",
                success: true,
                output: `Browser service started on port ${state.port}`,
              })
            } else {
              resolve({
                skillId: "browse",
                success: false,
                output: output,
                error: "Failed to start browser service",
              })
            }
          } catch (e) {
            resolve({
              skillId: "browse",
              success: false,
              output: output,
              error: "Failed to read service state",
            })
          }
        } else {
          resolve({
            skillId: "browse",
            success: false,
            output: output,
            error: errorOutput || "Process terminated",
          })
        }
      }, 5000)
    })
  }

  const executeQASkill = async (): Promise<SkillExecutionResult> => {
    return {
      skillId: "qa",
      success: true,
      output: "QA skill is available. Use 'skill qa' in chat to start testing.",
    }
  }

  const executeReviewSkill = async (): Promise<SkillExecutionResult> => {
    return {
      skillId: "review",
      success: true,
      output: "Review skill is available. Use 'skill review' in chat to start code review.",
    }
  }

  const executeInvestigateSkill = async (): Promise<SkillExecutionResult> => {
    return {
      skillId: "investigate",
      success: true,
      output: "Investigate skill is available. Use 'skill investigate' in chat to start debugging.",
    }
  }

  return {
    skills,
    isExecuting,
    lastResult,
    executeSkill,
  }
}
