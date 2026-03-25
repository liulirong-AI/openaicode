import { describe, expect, test } from "bun:test"
import { tmpdir } from "../fixture/fixture"
import { Instance } from "../../src/project/instance"
import { Config } from "../../src/config/config"

describe("Integration.Config.Loading", () => {
  test("loads global config", async () => {
    await using tmp = await tmpdir()

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const cfg = await Config.get()
        expect(cfg).toBeDefined()
      },
    })
  })

  test("applies model setting", async () => {
    await using tmp = await tmpdir({ config: { model: "anthropic/claude-3" } })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const cfg = await Config.get()
        expect(cfg.model).toBe("anthropic/claude-3")
      },
    })
  })

  test("applies permission settings", async () => {
    await using tmp = await tmpdir({
      config: {
        permission: {
          read: "allow",
          edit: "deny",
        },
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const cfg = await Config.get()
        expect(cfg.permission?.read).toBe("allow")
        expect(cfg.permission?.edit).toBe("deny")
      },
    })
  })

  test("applies mcp settings", async () => {
    await using tmp = await tmpdir({
      config: {
        mcp: {
          "my-server": {
            type: "local",
            command: ["npx", "my-mcp-server"],
            enabled: true,
          },
        },
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const cfg = await Config.get()
        expect(cfg.mcp?.["my-server"]).toBeDefined()
      },
    })
  })

  test("applies agent settings", async () => {
    await using tmp = await tmpdir({
      config: {
        agent: {
          build: {
            model: "anthropic/claude-3",
            steps: 100,
          },
        },
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const cfg = await Config.get()
        expect(cfg.agent?.build?.model).toBe("anthropic/claude-3")
        expect(cfg.agent?.build?.steps).toBe(100)
      },
    })
  })
})

describe("Integration.Config.Priority", () => {
  test("project config overrides global", async () => {
    await using tmp = await tmpdir()

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const cfg = await Config.get()
        expect(cfg.$schema).toBe("https://openaicode.ai/config.json")
      },
    })
  })
})
