import { spawn, type ChildProcess } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { Global } from "../global"

interface ServiceInfo {
  id: string
  name: string
  pid: number
  port: number
  token: string
  startedAt: string
  status: "starting" | "running" | "stopped" | "error"
  error?: string
}

interface ServiceConfig {
  id: string
  name: string
  command: string[]
  args: string[]
  cwd?: string
  env?: Record<string, string>
  stateFile: string
  healthCheck?: string
  port?: number
}

const SKILL_SERVICES: ServiceConfig[] = [
  {
    id: "browse",
    name: "Browse",
    command: ["node"],
    args: [
      "--require",
      "./.opencode/skills/browse/dist/bun-polyfill.cjs",
      "./.opencode/skills/browse/dist/server-node.mjs",
    ],
    stateFile: ".gstack/browse.json",
    port: 0,
  },
  {
    id: "canary",
    name: "Canary",
    command: ["node"],
    args: [
      "--require",
      "./.opencode/skills/canary/dist/bun-polyfill.cjs",
      "./.opencode/skills/canary/dist/server-node.mjs",
    ],
    stateFile: ".gstack/canary.json",
    port: 0,
  },
]

class SkillServiceManager {
  private services: Map<string, ServiceInfo> = new Map()
  private processes: Map<string, ChildProcess> = new Map()
  private root: string = process.cwd()

  setRoot(root: string) {
    this.root = root
  }

  getRoot(): string {
    return this.root
  }

  async getServiceState(id: string): Promise<ServiceInfo | null> {
    const config = SKILL_SERVICES.find((s) => s.id === id)
    if (!config) return null

    const stateFile = join(this.root, config.stateFile)
    if (existsSync(stateFile)) {
      try {
        const state = JSON.parse(readFileSync(stateFile, "utf-8"))
        if (state.pid && this.isProcessRunning(state.pid)) {
          const info: ServiceInfo = {
            id,
            name: config.name,
            pid: state.pid,
            port: state.port,
            token: state.token,
            startedAt: state.startedAt,
            status: "running",
          }
          this.services.set(id, info)
          return info
        }
      } catch {}
    }

    return this.services.get(id) || null
  }

  async startService(id: string): Promise<ServiceInfo> {
    const existing = await this.getServiceState(id)
    if (existing) {
      return existing
    }

    const config = SKILL_SERVICES.find((s) => s.id === id)
    if (!config) {
      throw new Error(`Unknown service: ${id}`)
    }

    this.services.set(id, { id, name: config.name, pid: 0, port: 0, token: "", startedAt: "", status: "starting" })

    const proc = spawn(config.command[0], [...config.command.slice(1), ...config.args], {
      cwd: this.root,
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
      env: { ...process.env, ...config.env },
    })

    this.processes.set(id, proc)

    proc.on("error", (err) => {
      const info = this.services.get(id)
      if (info) {
        info.status = "error"
        info.error = err.message
      }
    })

    proc.on("exit", (code) => {
      const info = this.services.get(id)
      if (info) {
        info.status = "stopped"
      }
      this.processes.delete(id)
    })

    const info = await this.waitForService(id, 10000)
    return info
  }

  async stopService(id: string): Promise<void> {
    const info = await this.getServiceState(id)
    if (info) {
      try {
        process.kill(info.pid)
      } catch {}
    }
    this.services.delete(id)
    this.processes.delete(id)
  }

  async listServices(): Promise<ServiceInfo[]> {
    const results: ServiceInfo[] = []
    for (const config of SKILL_SERVICES) {
      const state = await this.getServiceState(config.id)
      if (state) {
        results.push(state)
      } else {
        results.push({
          id: config.id,
          name: config.name,
          pid: 0,
          port: 0,
          token: "",
          startedAt: "",
          status: "stopped",
        })
      }
    }
    return results
  }

  private isProcessRunning(pid: number): boolean {
    try {
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  }

  private async waitForService(id: string, timeout: number): Promise<ServiceInfo> {
    const config = SKILL_SERVICES.find((s) => s.id === id)!
    const stateFile = join(this.root, config.stateFile)
    const start = Date.now()

    while (Date.now() - start < timeout) {
      await new Promise((r) => setTimeout(r, 500))

      if (existsSync(stateFile)) {
        try {
          const state = JSON.parse(readFileSync(stateFile, "utf-8"))
          if (state.port && state.token) {
            const info: ServiceInfo = {
              id,
              name: config.name,
              pid: state.pid,
              port: state.port,
              token: state.token,
              startedAt: state.startedAt,
              status: "running",
            }
            this.services.set(id, info)
            return info
          }
        } catch {}
      }

      const proc = this.processes.get(id)
      if (proc && proc.exitCode !== null && proc.exitCode !== 0) {
        throw new Error(`Service exited with code ${proc.exitCode}`)
      }
    }

    throw new Error("Service start timeout")
  }
}

export const skillServiceManager = new SkillServiceManager()
