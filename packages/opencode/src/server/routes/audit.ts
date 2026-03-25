import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { Audit } from "../../audit/audit"
import { lazy } from "../../util/lazy"

export const AuditRoutes = lazy(() => {
  const app = new Hono()

  app.get(
    "/history",
    describeRoute({
      summary: "Get audit history",
      description: "Get audit log entries",
      responses: {
        200: {
          description: "Audit history",
        },
      },
    }),
    async (c) => {
      const sessionId = c.req.query("sessionId")
      const limit = parseInt(c.req.query("limit") || "100", 10)
      const entries = Audit.getHistory(sessionId, limit)
      return c.json(entries)
    },
  )

  app.get(
    "/timeline/:sessionId",
    describeRoute({
      summary: "Get session timeline",
      description: "Get the complete timeline of a session",
      responses: {
        200: {
          description: "Session timeline",
        },
      },
    }),
    async (c) => {
      const sessionId = c.req.param("sessionId")
      const timeline = Audit.getTimeline(sessionId)
      return c.json(timeline)
    },
  )

  app.get(
    "/stats",
    describeRoute({
      summary: "Get audit statistics",
      description: "Get statistics about audit entries",
      responses: {
        200: {
          description: "Audit statistics",
        },
      },
    }),
    async (c) => {
      const stats = Audit.getStats()
      return c.json(stats)
    },
  )

  app.get(
    "/export/json",
    describeRoute({
      summary: "Export audit log as JSON",
      description: "Export audit entries as JSON",
      responses: {
        200: {
          description: "JSON export",
        },
      },
    }),
    async (c) => {
      const sessionId = c.req.query("sessionId")
      const json = Audit.exportToJSON(sessionId || undefined)
      return c.json(JSON.parse(json))
    },
  )

  app.get(
    "/export/markdown",
    describeRoute({
      summary: "Export audit log as Markdown",
      description: "Export audit entries as Markdown",
      responses: {
        200: {
          description: "Markdown export",
        },
      },
    }),
    async (c) => {
      const sessionId = c.req.query("sessionId")
      const markdown = Audit.exportToMarkdown(sessionId || undefined)
      return c.text(markdown)
    },
  )

  return app
})
