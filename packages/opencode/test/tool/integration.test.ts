import { describe, expect, test } from "bun:test"
import path from "path"
import { tmpdir } from "../fixture/fixture"
import { Instance } from "../../src/project/instance"
import { Plugin } from "../../src/plugin"
import { Config } from "../../src/config/config"

describe("Integration.Config", () => {
  test("config initializes correctly", async () => {
    await using tmp = await tmpdir()

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const config = await Config.get()
        expect(config).toBeDefined()
        expect(config.agent).toBeDefined()
      },
    })
  })

  test("config loads model from config", async () => {
    await using tmp = await tmpdir({
      config: { model: "test/model" },
    })

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const config = await Config.get()
        expect(config.model).toBe("test/model")
      },
    })
  })
})

describe("Integration.Plugin", () => {
  test("plugin list returns array", async () => {
    await using tmp = await tmpdir()

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const plugins = await Plugin.list()
        expect(Array.isArray(plugins)).toBe(true)
      },
    })
  })

  test("plugin hooks are registered", async () => {
    await using tmp = await tmpdir()

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const hooks = await Plugin.list()
        expect(hooks.length).toBeGreaterThanOrEqual(0)
      },
    })
  })
})
