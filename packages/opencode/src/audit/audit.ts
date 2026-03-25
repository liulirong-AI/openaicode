import z from "zod"
import { Session } from "../session"
import { SessionStatus } from "../session/status"

export namespace Audit {
  export const Entry = z.object({
    id: z.string(),
    sessionId: z.string(),
    timestamp: z.number(),
    type: z.enum([
      "session_created",
      "session_updated",
      "session_completed",
      "session_archived",
      "message_sent",
      "message_received",
      "tool_called",
      "tool_result",
      "review_requested",
      "review_approved",
      "review_rejected",
      "model_switched",
      "error_occurred",
    ]),
    actor: z.string().optional(),
    details: z.record(z.string(), z.any()).optional(),
  })

  export type Entry = z.infer<typeof Entry>

  const auditLog: Entry[] = []
  const MAX_ENTRIES = 1000

  export function log(sessionId: string, type: Entry["type"], details?: Record<string, any>, actor?: string) {
    const entry: Entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sessionId,
      timestamp: Date.now(),
      type,
      actor,
      details,
    }

    auditLog.push(entry)

    if (auditLog.length > MAX_ENTRIES) {
      auditLog.shift()
    }

    return entry
  }

  export function getHistory(sessionId?: string, limit = 100): Entry[] {
    let entries = sessionId ? auditLog.filter((e) => e.sessionId === sessionId) : auditLog
    return entries.slice(-limit)
  }

  export function getTimeline(sessionId: string): {
    session: Session.Info | null
    entries: Entry[]
    statuses: Record<string, SessionStatus.Info>
  } {
    let session: Session.Info | null = null

    for (const s of Session.list()) {
      if (s.id === sessionId) {
        session = s
        break
      }
    }

    const entries = auditLog.filter((e) => e.sessionId === sessionId)
    const statuses = SessionStatus.list()

    return {
      session,
      entries,
      statuses,
    }
  }

  export function getStats(): {
    total: number
    byType: Record<string, number>
    bySession: Record<string, number>
    recentActivity: Entry[]
  } {
    const byType: Record<string, number> = {}
    const bySession: Record<string, number> = {}

    for (const entry of auditLog) {
      byType[entry.type] = (byType[entry.type] || 0) + 1
      bySession[entry.sessionId] = (bySession[entry.sessionId] || 0) + 1
    }

    return {
      total: auditLog.length,
      byType,
      bySession,
      recentActivity: auditLog.slice(-50),
    }
  }

  export function exportToJSON(sessionId?: string): string {
    const entries = sessionId ? auditLog.filter((e) => e.sessionId === sessionId) : auditLog
    return JSON.stringify(entries, null, 2)
  }

  export function exportToMarkdown(sessionId?: string): string {
    const entries = sessionId ? auditLog.filter((e) => e.sessionId === sessionId) : auditLog

    let markdown = "# 审计记录\n\n"

    if (sessionId) {
      markdown += `## 会话: ${sessionId}\n\n`
    }

    for (const entry of entries) {
      const date = new Date(entry.timestamp).toISOString()
      markdown += `### ${date}\n\n`
      markdown += `- **类型**: ${entry.type}\n`
      if (entry.actor) {
        markdown += `- **执行者**: ${entry.actor}\n`
      }
      if (entry.details) {
        markdown += `- **详情**:\n\`\`\`json\n${JSON.stringify(entry.details, null, 2)}\n\`\`\`\n`
      }
      markdown += "\n"
    }

    return markdown
  }
}
