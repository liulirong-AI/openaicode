import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { tmpdir } from "../fixture/fixture"
import { Instance } from "../../src/project/instance"
import { Session } from "../../src/session"
import { Database } from "../../src/storage/db"

describe("Integration.Database.Transaction", () => {
  test("executes database operation", async () => {
    await using tmp = await tmpdir()

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const db = Database.Client
        expect(db).toBeDefined()
      },
    })
  })

  test("uses database path", async () => {
    await using tmp = await tmpdir()

    await Instance.provide({
      directory: tmp.path,
      fn: async () => {
        const path = Database.Path
        expect(path).toContain("opencode")
        expect(path).toMatch(/\.db$/)
      },
    })
  })
})
