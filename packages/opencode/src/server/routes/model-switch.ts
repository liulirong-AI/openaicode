import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { Provider } from "../../provider/provider"
import { Log } from "../../util/log"
import { lazy } from "../../util/lazy"

const log = Log.create({ service: "model-switch" })

interface ModelInfo {
  providerId: string
  modelId: string
  name: string
  capabilities: {
    reasoning: boolean
    toolcall: boolean
    temperature: boolean
  }
}

interface ProviderInfo {
  providerId: string
  name: string
  models: ModelInfo[]
}

const modelConfigs = new Map<string, ModelInfo>()
let activeConfig: ModelInfo | null = null

export const ModelSwitchRoutes = lazy(() => {
  const app = new Hono()

  app.get(
    "/providers",
    describeRoute({
      summary: "List available providers and models",
      description: "Get all available providers with their models",
      responses: {
        200: {
          description: "Available providers",
        },
      },
    }),
    async (c) => {
      const providers = await Provider.list()
      const result: ProviderInfo[] = []

      for (const [providerId, provider] of Object.entries(providers)) {
        const models: ModelInfo[] = []
        for (const [modelId, model] of Object.entries(provider.models)) {
          models.push({
            providerId,
            modelId,
            name: model.name,
            capabilities: {
              reasoning: model.capabilities.reasoning,
              toolcall: model.capabilities.toolcall,
              temperature: model.capabilities.temperature,
            },
          })
        }
        result.push({
          providerId,
          name: provider.name,
          models,
        })
      }

      return c.json(result)
    },
  )

  app.get(
    "/active",
    describeRoute({
      summary: "Get active model",
      description: "Get the currently active model configuration",
      responses: {
        200: {
          description: "Active model configuration",
        },
      },
    }),
    async (c) => {
      if (activeConfig) {
        return c.json(activeConfig)
      }

      try {
        const defaultModel = await Provider.defaultModel()
        const providers = await Provider.list()
        const provider = providers[defaultModel.providerID]
        const model = provider?.models[defaultModel.modelID]

        if (provider && model) {
          activeConfig = {
            providerId: defaultModel.providerID,
            modelId: defaultModel.modelID,
            name: model.name,
            capabilities: {
              reasoning: model.capabilities.reasoning,
              toolcall: model.capabilities.toolcall,
              temperature: model.capabilities.temperature,
            },
          }
          return c.json(activeConfig)
        }
      } catch (e) {
        log.warn("Failed to get default model", { error: e })
      }

      return c.json({ error: "No active model" }, 400)
    },
  )

  app.post(
    "/switch",
    describeRoute({
      summary: "Switch model",
      description: "Hot-swap to a different model without restart",
      responses: {
        200: {
          description: "Model switched successfully",
        },
      },
    }),
    async (c) => {
      const body = await c.req.json()
      const { providerId, modelId } = body

      if (!providerId || !modelId) {
        return c.json({ error: "providerId and modelId are required" }, 400)
      }

      const providers = await Provider.list()
      const provider = providers[providerId as keyof typeof providers]
      if (!provider) {
        return c.json({ error: "Provider not found" }, 404)
      }

      const model = provider.models[modelId as keyof typeof provider.models]
      if (!model) {
        return c.json({ error: "Model not found" }, 404)
      }

      activeConfig = {
        providerId,
        modelId,
        name: model.name,
        capabilities: {
          reasoning: model.capabilities.reasoning,
          toolcall: model.capabilities.toolcall,
          temperature: model.capabilities.temperature,
        },
      }

      modelConfigs.set(`${providerId}/${modelId}`, activeConfig)

      log.info(`Model switched to ${providerId}/${modelId}`)

      return c.json({
        success: true,
        model: activeConfig,
      })
    },
  )

  app.get(
    "/history",
    describeRoute({
      summary: "Get model switch history",
      description: "Get the history of model switches",
      responses: {
        200: {
          description: "Model switch history",
        },
      },
    }),
    async (c) => {
      const history = Array.from(modelConfigs.entries()).map(([key, config]) => ({
        key,
        ...config,
      }))
      return c.json(history)
    },
  )

  return app
})
