import { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { Session } from "../../session"
import { SessionStatus } from "@/session/status"
import { Log } from "../../util/log"
import { lazy } from "../../util/lazy"

const log = Log.create({ service: "dashboard" })

export const DashboardRoutes = lazy(() => {
  const app = new Hono()

  app.get(
    "/overview",
    describeRoute({
      summary: "Dashboard overview",
      description: "Get overview statistics for the dashboard",
      responses: {
        200: {
          description: "Dashboard overview",
        },
      },
    }),
    async (c) => {
      const sessions: Session.Info[] = []
      for await (const session of Session.list()) {
        sessions.push(session)
      }

      const statuses = SessionStatus.list()
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000

      const totalSessions = sessions.length
      const activeSessions = sessions.filter((s) => s.time.updated > oneHourAgo).length

      const recentSessions = sessions
        .sort((a, b) => b.time.updated - a.time.updated)
        .slice(0, 10)
        .map((s) => {
          const status = statuses[s.id]
          return {
            id: s.id,
            title: s.title,
            directory: s.directory,
            updatedAt: s.time.updated,
            status: status?.type ?? "idle",
          }
        })

      const taskStats = {
        pending: Object.values(statuses).filter((s) => s.type === "idle").length,
        inProgress: Object.values(statuses).filter((s) => s.type === "busy").length,
        completed: sessions.filter((s) => s.time.archived !== undefined).length,
        idle: Object.values(statuses).filter((s) => s.type === "idle").length,
      }

      const agentHealth = Object.entries(statuses).map(([id, status]) => ({
        sessionId: id,
        status: status.type,
        isBusy: status.type === "busy",
        isRetrying: status.type === "retry",
      }))

      return c.json({
        totalSessions,
        activeSessions,
        recentSessions,
        agentHealth,
        taskStats,
      })
    },
  )

  app.get(
    "/sessions",
    describeRoute({
      summary: "Session kanban",
      description: "Get all sessions grouped by status for kanban view",
      responses: {
        200: {
          description: "Sessions grouped by status",
        },
      },
    }),
    async (c) => {
      const sessions: Session.Info[] = []
      for await (const session of Session.list()) {
        sessions.push(session)
      }

      const statuses = SessionStatus.list()
      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000

      const grouped = {
        active: [] as any[],
        idle: [] as any[],
        archived: [] as any[],
      }

      for (const session of sessions) {
        const status = statuses[session.id]
        const info = {
          id: session.id,
          title: session.title,
          directory: session.directory,
          updatedAt: session.time.updated,
          createdAt: session.time.created,
          status: status?.type ?? "idle",
          isBusy: status?.type === "busy",
        }

        if (session.time.archived) {
          grouped.archived.push(info)
        } else if (session.time.updated > oneDayAgo) {
          grouped.active.push(info)
        } else {
          grouped.idle.push(info)
        }
      }

      return c.json(grouped)
    },
  )

  app.get(
    "/session/:id/status",
    describeRoute({
      summary: "Session status",
      description: "Get the status of a specific session",
      responses: {
        200: {
          description: "Session status",
        },
      },
    }),
    async (c) => {
      const id = c.req.param("id")
      const status = SessionStatus.get(id as any)
      return c.json(status)
    },
  )

  app.get(
    "/stats",
    describeRoute({
      summary: "Usage statistics",
      description: "Get usage statistics for monitoring",
      responses: {
        200: {
          description: "Usage statistics",
        },
      },
    }),
    async (c) => {
      const sessions: Session.Info[] = []
      for await (const session of Session.list()) {
        sessions.push(session)
      }

      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

      const stats = {
        total: sessions.length,
        today: sessions.filter((s) => s.time.created > oneDayAgo).length,
        thisWeek: sessions.filter((s) => s.time.created > oneWeekAgo).length,
        byDirectory: {} as Record<string, number>,
      }

      for (const session of sessions) {
        stats.byDirectory[session.directory] = (stats.byDirectory[session.directory] || 0) + 1
      }

      return c.json(stats)
    },
  )

  return app
})
