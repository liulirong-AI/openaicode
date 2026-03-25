import { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { Review } from "../../review/review"
import { Session } from "../../session"
import { Log } from "../../util/log"
import { lazy } from "../../util/lazy"

const log = Log.create({ service: "review" })

let reviewConfig = Review.defaultConfig
const reviewResults: Review.Result[] = []

export const ReviewRoutes = lazy(() => {
  const app = new Hono()

  app.get(
    "/config",
    describeRoute({
      summary: "Get review config",
      description: "Get the current review configuration",
      responses: {
        200: {
          description: "Review configuration",
        },
      },
    }),
    async (c) => {
      return c.json(reviewConfig)
    },
  )

  app.post(
    "/config",
    describeRoute({
      summary: "Update review config",
      description: "Update the review configuration",
      responses: {
        200: {
          description: "Updated configuration",
        },
      },
    }),
    async (c) => {
      const body = await c.req.json()
      reviewConfig = Review.Config.parse(body)
      return c.json(reviewConfig)
    },
  )

  app.post(
    "/rule/:id/toggle",
    describeRoute({
      summary: "Toggle rule",
      description: "Enable or disable a specific review rule",
      responses: {
        200: {
          description: "Rule toggled",
        },
      },
    }),
    async (c) => {
      const id = c.req.param("id")
      const rule = reviewConfig.rules.find((r) => r.id === id)
      if (rule) {
        rule.enabled = !rule.enabled
      }
      return c.json({ id, enabled: rule?.enabled })
    },
  )

  app.get(
    "/results",
    describeRoute({
      summary: "Get review results",
      description: "Get the history of review results",
      responses: {
        200: {
          description: "Review results",
        },
      },
    }),
    async (c) => {
      return c.json(reviewResults.slice(-100))
    },
  )

  app.post(
    "/session/:id/review",
    describeRoute({
      summary: "Review session",
      description: "Review a session and return approval status",
      responses: {
        200: {
          description: "Review result",
        },
      },
    }),
    async (c) => {
      const sessionId = c.req.param("id")
      const sessions: Session.Info[] = []
      for await (const session of Session.list()) {
        sessions.push(session)
      }

      const session = sessions.find((s) => s.id === sessionId)
      if (!session) {
        return c.json({ error: "Session not found" }, 404)
      }

      const results = await performReview(session)
      return c.json(results)
    },
  )

  app.post(
    "/approve/:id",
    describeRoute({
      summary: "Approve session",
      description: "Manually approve a session for execution",
      responses: {
        200: {
          description: "Session approved",
        },
      },
    }),
    async (c) => {
      const id = c.req.param("id")
      const result: Review.Result = {
        id: `manual-approve-${Date.now()}`,
        sessionId: id,
        ruleId: "manual",
        passed: true,
        message: "Manually approved",
        timestamp: Date.now(),
        metadata: { type: "manual_approval" },
      }
      reviewResults.push(result)
      return c.json(result)
    },
  )

  app.post(
    "/reject/:id",
    describeRoute({
      summary: "Reject session",
      description: "Reject a session",
      responses: {
        200: {
          description: "Session rejected",
        },
      },
    }),
    async (c) => {
      const id = c.req.param("id")
      const body = await c.req.json().catch(() => ({}))
      const result: Review.Result = {
        id: `manual-reject-${Date.now()}`,
        sessionId: id,
        ruleId: "manual",
        passed: false,
        message: body.message ?? "Manually rejected",
        timestamp: Date.now(),
        metadata: { type: "manual_rejection" },
      }
      reviewResults.push(result)
      return c.json(result)
    },
  )

  return app
})

async function performReview(session: Session.Info): Promise<{
  approved: boolean
  requiresConfirmation: boolean
  results: Review.Result[]
}> {
  const results: Review.Result[] = []
  let requiresConfirmation = false

  for (const rule of reviewConfig.rules) {
    if (!rule.enabled) continue

    let passed = true
    let message: string | undefined

    if (rule.conditions.requiresApproval) {
      passed = false
      requiresConfirmation = true
      message = `Rule "${rule.name}" requires approval`
    }

    const result: Review.Result = {
      id: `review-${Date.now()}-${rule.id}`,
      sessionId: session.id,
      ruleId: rule.id,
      passed,
      message,
      timestamp: Date.now(),
      metadata: {
        sessionTitle: session.title,
        directory: session.directory,
      },
    }

    results.push(result)
    reviewResults.push(result)

    if (reviewConfig.logLevel !== "off" && rule.actions.log) {
      log.info(`Review: ${rule.name}`, { sessionId: session.id, passed })
    }
  }

  return {
    approved: results.every((r) => r.passed),
    requiresConfirmation,
    results,
  }
}
