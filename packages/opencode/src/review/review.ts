import z from "zod"

export namespace Review {
  export const Rule = z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean(),
    conditions: z.object({
      minTokens: z.number().optional(),
      maxTokens: z.number().optional(),
      requiresApproval: z.boolean().optional(),
      autoApprove: z.boolean().optional(),
    }),
    actions: z.object({
      log: z.boolean().optional(),
      notify: z.boolean().optional(),
      requireConfirmation: z.boolean().optional(),
    }),
  })

  export type Rule = z.infer<typeof Rule>

  export const Result = z.object({
    id: z.string(),
    sessionId: z.string(),
    ruleId: z.string(),
    passed: z.boolean(),
    message: z.string().optional(),
    timestamp: z.number(),
    metadata: z.record(z.string(), z.any()).optional(),
  })

  export type Result = z.infer<typeof Result>

  export const Config = z.object({
    enabled: z.boolean(),
    rules: z.array(Rule),
    notifyOnFailure: z.boolean(),
    logLevel: z.enum(["off", "error", "warn", "info"]),
  })

  export type Config = z.infer<typeof Config>

  const defaultRules: Rule[] = [
    {
      id: "high-cost",
      name: "高消耗任务审核",
      enabled: true,
      conditions: {
        requiresApproval: true,
      },
      actions: {
        log: true,
        notify: true,
        requireConfirmation: true,
      },
    },
    {
      id: "file-modification",
      name: "文件修改审核",
      enabled: true,
      conditions: {
        requiresApproval: true,
      },
      actions: {
        log: true,
        notify: false,
        requireConfirmation: true,
      },
    },
    {
      id: "command-execution",
      name: "命令执行审核",
      enabled: true,
      conditions: {
        requiresApproval: true,
      },
      actions: {
        log: true,
        notify: true,
        requireConfirmation: true,
      },
    },
  ]

  export const defaultConfig: Config = {
    enabled: true,
    rules: defaultRules,
    notifyOnFailure: true,
    logLevel: "info",
  }
}
