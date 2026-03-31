import { eq, desc, and, gt, sql } from "drizzle-orm"
import { Log } from "../util/log"
import { db } from "../storage/db"
import { MemoryTable, MemoryConfigTable } from "./memory.sql"
import type { ProjectID } from "../project/schema"
import type { SessionID, MessageID } from "../session/schema"
import { Project } from "../project/project"

const log = Log.create({ service: "memory" })

export namespace Memory {
  export type MemoryType = "user_preference" | "fact" | "context" | "summary"

  export interface Memory {
    id: string
    project_id: ProjectID
    session_id?: SessionID
    message_id?: MessageID
    type: MemoryType
    content: string
    importance: number
    created_at: number
    updated_at: number
  }

  export interface Config {
    enabled: boolean
    auto_capture: boolean
    max_memories: number
    min_importance: number
  }

  export async function getConfig(projectID: ProjectID): Promise<Config> {
    const row = await db.query.memory_config.findFirst({
      where: eq(MemoryConfigTable.project_id, projectID),
    })

    if (!row) {
      return {
        enabled: true,
        auto_capture: true,
        max_memories: 100,
        min_importance: 5,
      }
    }

    return {
      enabled: row.enabled === 1,
      auto_capture: row.auto_capture === 1,
      max_memories: row.max_memories,
      min_importance: row.min_importance,
    }
  }

  export async function setConfig(projectID: ProjectID, config: Partial<Config>): Promise<void> {
    await db
      .insert(MemoryConfigTable)
      .values({
        project_id: projectID,
        enabled: config.enabled ? 1 : 0,
        auto_capture: config.auto_capture ? 1 : 0,
        max_memories: config.max_memories ?? 100,
        min_importance: config.min_importance ?? 5,
      })
      .onConflictDoUpdate({
        target: MemoryConfigTable.project_id,
        set: {
          enabled: config.enabled !== undefined ? (config.enabled ? 1 : 0) : undefined,
          auto_capture: config.auto_capture !== undefined ? (config.auto_capture ? 1 : 0) : undefined,
          max_memories: config.max_memories,
          min_importance: config.min_importance,
          updated_at: Date.now(),
        },
      })
  }

  export async function add(
    projectID: ProjectID,
    content: string,
    type: MemoryType,
    options?: {
      sessionID?: SessionID
      messageID?: MessageID
      importance?: number
    },
  ): Promise<Memory> {
    const id = crypto.randomUUID()
    const now = Date.now()

    await db.insert(MemoryTable).values({
      id,
      project_id: projectID,
      session_id: options?.sessionID,
      message_id: options?.messageID,
      type,
      content,
      importance: options?.importance ?? 5,
      created_at: now,
      updated_at: now,
    })

    log.debug({ id, type, importance: options?.importance ?? 5 }, "Memory added")

    return {
      id,
      project_id: projectID,
      session_id: options?.sessionID,
      message_id: options?.messageID,
      type,
      content,
      importance: options?.importance ?? 5,
      created_at: now,
      updated_at: now,
    }
  }

  export async function getRelevant(
    projectID: ProjectID,
    query: string,
    options?: {
      limit?: number
      minImportance?: number
      types?: MemoryType[]
    },
  ): Promise<Memory[]> {
    const config = await getConfig(projectID)
    if (!config.enabled) return []

    const limit = options?.limit ?? config.max_memories
    const minImportance = options?.minImportance ?? config.min_importance

    let conditions = [eq(MemoryTable.project_id, projectID), gt(MemoryTable.importance, minImportance)]

    if (options?.types?.length) {
      conditions.push(sql`${MemoryTable.type} IN ${options.types}`)
    }

    const memories = await db.query.memory.findMany({
      where: and(...conditions),
      orderBy: [desc(MemoryTable.importance), desc(MemoryTable.created_at)],
      limit,
    })

    if (query && memories.length > 0) {
      return memories.filter(
        (m) =>
          m.content.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes(m.content.toLowerCase()),
      )
    }

    return memories
  }

  export async function getContext(projectID: ProjectID, maxTokens: number = 2000): Promise<string> {
    const memories = await getRelevant(projectID, "", { limit: 20 })
    if (memories.length === 0) return ""

    let context = "## Relevant memories from previous sessions:\n"
    let totalLength = context.length

    for (const memory of memories) {
      const memoryText = `- [${memory.type}] ${memory.content}\n`
      if (totalLength + memoryText.length > maxTokens * 4) break
      context += memoryText
      totalLength += memoryText.length
    }

    return context
  }

  export async function remove(id: string): Promise<void> {
    await db.delete(MemoryTable).where(eq(MemoryTable.id, id))
    log.debug({ id }, "Memory removed")
  }

  export async function clear(projectID: ProjectID, type?: MemoryType): Promise<void> {
    if (type) {
      await db.delete(MemoryTable).where(and(eq(MemoryTable.project_id, projectID), eq(MemoryTable.type, type)))
    } else {
      await db.delete(MemoryTable).where(eq(MemoryTable.project_id, projectID))
    }
    log.debug({ projectID, type }, "Memories cleared")
  }

  export async function captureFromSummary(
    projectID: ProjectID,
    summary: string,
    sessionID?: SessionID,
  ): Promise<void> {
    const config = await getConfig(projectID)
    if (!config.enabled || !config.auto_capture) return

    if (summary.length > 50) {
      await add(projectID, summary, "summary", { sessionID, importance: 7 })
    }
  }

  export async function capturePreference(
    projectID: ProjectID,
    preference: string,
    sessionID?: SessionID,
  ): Promise<void> {
    const config = await getConfig(projectID)
    if (!config.enabled) return

    await add(projectID, preference, "user_preference", { sessionID, importance: 8 })
  }

  export async function captureFact(projectID: ProjectID, fact: string, sessionID?: SessionID): Promise<void> {
    const config = await getConfig(projectID)
    if (!config.enabled || !config.auto_capture) return

    await add(projectID, fact, "fact", { sessionID, importance: 6 })
  }
}
