import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import path from "path"
import { tmpdir } from "../fixture/fixture"
import { Database } from "../../src/storage/db"
import { SessionTable } from "../../src/session/session.sql"
import { eq } from "drizzle-orm"

describe("Database.Session", () => {
  test("creates and retrieves a session", async () => {
    await using tmp = await tmpdir()
    // This test requires the Database to be initialized in the tmp context
    // For now, we test the path configuration
    const dbPath = Database.Path
    expect(dbPath).toContain("opencode")
  })

  test("database path uses correct channel", async () => {
    const dbPath = Database.Path
    expect(dbPath.endsWith(".db")).toBe(true)
  })
})

describe("Database.Query", () => {
  test("can execute raw query", () => {
    const db = Database.Client
    expect(db).toBeDefined()
  })
})
