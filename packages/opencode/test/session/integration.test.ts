import { describe, expect, test, beforeEach } from "bun:test"
import path from "path"
import { tmpdir } from "../fixture/fixture"
import { Instance } from "../../src/project/instance"
import { Session } from "../../src/session"
import { Config } from "../../src/config/config"
import { Provider } from "../../src/provider/provider"
import { ModelID, ProviderID } from "../../src/provider/schema"
import { Env } from "../../src/env"

describe("Integration.Session", () => {
  test("creates a session with default values", async () => {
    await using tmp = await tmpdir({
      config: {
        model: "test/model",
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        expect(session.id).toBeDefined()
        expect(session.title).toMatch(/^New session - \d{4}-\d{2}-\d{2}T/)
        expect(session.version).toBeDefined()
      },
    })
  })

  test("creates a child session from parent", async () => {
    await using tmp = await tmpdir({
      config: {
        model: "test/model",
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const parent = await Session.create({})
        const child = await Session.create({
          parentID: parent.id,
          title: "Child Session",
        })

        expect(child.id).not.toBe(parent.id)
        expect(child.parentID).toBe(parent.id)
        expect(child.title).toBe("Child Session")
      },
    })
  })

  test("lists sessions in a project", async () => {
    await using tmp = await tmpdir()

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        await Session.create({})
        await Session.create({})
        await Session.create({})

        const sessions = Session.list()
        let count = 0
        for (const _ of sessions) count++

        expect(count).toBe(3)
      },
    })
  })

  test("updates session title", async () => {
    await using tmp = await tmpdir()

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const session = await Session.create({})
        const updated = await Session.setTitle({
          sessionID: session.id,
          title: "Updated Title",
        })

        expect(updated.title).toBe("Updated Title")
      },
    })
  })

  test("gets session usage", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(
          path.join(dir, "opencode.json"),
          JSON.stringify({
            $schema: "https://opencode.ai/config.json",
            provider: {
              test: {
                options: { apiKey: "test-key" },
              },
            },
            model: "test/model",
          }),
        )
      },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const usage = Session.getUsage({
          model: {
            id: "test-model",
            api: { npm: "@ai-sdk/test" },
            cost: { input: 1, output: 3 },
          } as any,
          usage: {
            inputTokens: 1000,
            outputTokens: 500,
            totalTokens: 1500,
          },
          metadata: undefined,
        })

        expect(usage.cost).toBe(0.0025) // 1000 * 1/1M + 500 * 3/1M
        expect(usage.tokens.total).toBe(1500)
      },
    })
  })
})
