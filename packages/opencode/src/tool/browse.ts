import z from "zod"
import { Tool } from "./tool"
import { Instance } from "../project/instance"
import { Global } from "../global"
import { Log } from "@/util/log"
import path from "path"
import { execSync } from "child_process"
import { skillServiceManager } from "../skill/service-manager"
import { browserServiceClient } from "../browser/service-client"

const log = Log.create({ service: "tool.browse" })

const BROWSE_DESCRIPTION = `Control a headless browser for web automation, testing, and data extraction.

Commands:
- goto <url>: Navigate to URL
- back / forward / reload: History and reload
- text: Get cleaned page text
- html [selector]: Get HTML content
- snapshot [-i] [-c] [-D]: Get accessibility snapshot with refs (@e1, @e2...)
- screenshot [path]: Take screenshot
- responsive [prefix]: Take screenshots at mobile/tablet/desktop sizes
- click <selector>: Click element
- fill <selector> <value>: Fill input
- select <selector> <value>: Select dropdown option
- hover <selector>: Hover element
- type <selector> <text>: Type into input
- press <key>: Press key (Enter, Tab, Escape, etc.)
- scroll [selector]: Scroll element into view
- wait <selector>: Wait for element
- viewport <WxH>: Set viewport size
- js <expr>: Run JavaScript expression
- cookies / storage: Get browser state
- console [--errors]: View console messages
- network: View network requests
- tabs / newtab / closetab: Tab management
- url: Get current URL`

function findGstackBrowse(): string | null {
  const homeDir = Global.Path.home
  const possiblePaths = [
    path.join(homeDir, ".claude", "skills", "gstack", "browse", "dist", "browse"),
    path.join(homeDir, ".codex", "skills", "gstack", "browse", "dist", "browse"),
    "D:\\AIcode\\gstack-main\\browse\\dist\\browse",
    "D:\\AIcode\\gstack-main\\browse\\dist\\browse.exe",
  ]

  for (const p of possiblePaths) {
    try {
      const fs = require("fs")
      if (fs.existsSync(p)) {
        return p
      }
    } catch {
      continue
    }
  }

  return null
}

async function executeWithBinary(command: string, args: string[]): Promise<string> {
  const browsePath = findGstackBrowse()
  if (!browsePath) {
    throw new Error(
      "Browse tool requires gstack binary.\n" +
        "Please install gstack and run its setup script:\n" +
        "  cd D:\\AIcode\\gstack-main && ./setup\n" +
        "Or ensure the browse binary is in your PATH.",
    )
  }

  const projectDir = Instance.directory
  const result = execSync(`"${browsePath}" ${command} ${args.join(" ")}`, {
    cwd: projectDir,
    encoding: "utf-8",
    timeout: 60000,
  })

  return result
}

async function executeWithService(command: string, args: string[]): Promise<string> {
  // Ensure service is running
  const state = await skillServiceManager.startService("browse")

  // Update client state
  browserServiceClient.setState({ port: state.port, token: state.token })

  switch (command) {
    case "goto": {
      const url = args[0]
      if (!url) throw new Error("Usage: browse goto <url>")
      return await browserServiceClient.goto(url)
    }
    case "text":
      return await browserServiceClient.text()
    case "html": {
      const selector = args[0]
      return await browserServiceClient.html(selector)
    }
    case "snapshot": {
      const interactive = args.includes("-i") || args.includes("--interactive")
      const compact = args.includes("-c") || args.includes("--compact")
      return await browserServiceClient.snapshot(interactive, compact)
    }
    case "screenshot": {
      const outputPath = args[0]
      return await browserServiceClient.screenshot(outputPath)
    }
    case "responsive": {
      const prefix = args[0]
      return await browserServiceClient.responsive(prefix)
    }
    case "click": {
      const selector = args[0]
      if (!selector) throw new Error("Usage: browse click <selector>")
      return await browserServiceClient.click(selector)
    }
    case "fill": {
      const selector = args[0]
      const value = args[1]
      if (!selector || !value) throw new Error("Usage: browse fill <selector> <value>")
      return await browserServiceClient.fill(selector, value)
    }
    case "select": {
      const selector = args[0]
      const value = args[1]
      if (!selector || !value) throw new Error("Usage: browse select <selector> <value>")
      return await browserServiceClient.select(selector, value)
    }
    case "hover": {
      const selector = args[0]
      if (!selector) throw new Error("Usage: browse hover <selector>")
      return await browserServiceClient.hover(selector)
    }
    case "type": {
      const selector = args[0]
      const text = args[1]
      if (!selector || !text) throw new Error("Usage: browse type <selector> <text>")
      return await browserServiceClient.type(selector, text)
    }
    case "press": {
      const key = args[0]
      if (!key) throw new Error("Usage: browse press <key>")
      return await browserServiceClient.press(key)
    }
    case "scroll": {
      const selector = args[0]
      return await browserServiceClient.scroll(selector)
    }
    case "wait": {
      const selector = args[0]
      if (!selector) throw new Error("Usage: browse wait <selector>")
      return await browserServiceClient.wait(selector)
    }
    case "js": {
      const expr = args[0]
      if (!expr) throw new Error("Usage: browse js <expression>")
      return await browserServiceClient.js(expr)
    }
    case "cookies":
      return await browserServiceClient.cookies()
    case "storage":
      return await browserServiceClient.storage()
    case "url":
      return await browserServiceClient.url()
    case "back":
      return await browserServiceClient.back()
    case "forward":
      return await browserServiceClient.forward()
    case "reload":
      return await browserServiceClient.reload()
    case "viewport": {
      const wh = args[0]
      if (!wh) throw new Error("Usage: browse viewport <WxH>")
      const [w, h] = wh.split("x").map(Number)
      if (isNaN(w) || isNaN(h)) throw new Error("Invalid viewport format. Use WxH (e.g., 1280x720)")
      return await browserServiceClient.viewport(w, h)
    }
    case "console": {
      const filter = args.includes("--errors") ? "errors" : undefined
      return await browserServiceClient.console(filter)
    }
    case "network": {
      const clear = args.includes("--clear")
      return await browserServiceClient.network(clear)
    }
    case "tabs":
      return await browserServiceClient.tabs()
    case "newtab": {
      const url = args[0]
      return await browserServiceClient.newtab(url)
    }
    case "closetab": {
      const id = args[0]
      return await browserServiceClient.closetab(id)
    }
    case "tab": {
      const id = args[0]
      if (!id) throw new Error("Usage: browse tab <id>")
      return await browserServiceClient.tab(id)
    }
    default:
      return await executeWithBinary(command, args)
  }
}

async function executeWithBuiltin(command: string, args: string[]): Promise<string> {
  try {
    const { browserClient } = await import("../browser/client")
    const client = browserClient

    switch (command) {
      case "goto": {
        const url = args[0]
        if (!url) throw new Error("Usage: browse goto <url>")
        return await client.goto(url)
      }
      case "text":
        return await client.text()
      case "html": {
        const selector = args[0]
        return await client.html(selector)
      }
      case "snapshot": {
        const interactive = args.includes("-i") || args.includes("--interactive")
        const compact = args.includes("-c") || args.includes("--compact")
        return await client.snapshot(interactive, compact)
      }
      case "screenshot": {
        const outputPath = args[0]
        return await client.screenshot(outputPath)
      }
      case "click": {
        const selector = args[0]
        if (!selector) throw new Error("Usage: browse click <selector>")
        return await client.click(selector)
      }
      case "fill": {
        const selector = args[0]
        const value = args[1]
        if (!selector || !value) throw new Error("Usage: browse fill <selector> <value>")
        return await client.fill(selector, value)
      }
      case "select": {
        const selector = args[0]
        const value = args[1]
        if (!selector || !value) throw new Error("Usage: browse select <selector> <value>")
        return await client.select(selector, value)
      }
      case "hover": {
        const selector = args[0]
        if (!selector) throw new Error("Usage: browse hover <selector>")
        return await client.hover(selector)
      }
      case "type": {
        const selector = args[0]
        const text = args[1]
        if (!selector || !text) throw new Error("Usage: browse type <selector> <text>")
        return await client.type(selector, text)
      }
      case "press": {
        const key = args[0]
        if (!key) throw new Error("Usage: browse press <key>")
        return await client.press(key)
      }
      case "scroll": {
        const selector = args[0]
        return await client.scroll(selector)
      }
      case "wait": {
        const selector = args[0]
        if (!selector) throw new Error("Usage: browse wait <selector>")
        return await client.wait(selector)
      }
      case "js": {
        const expr = args[0]
        if (!expr) throw new Error("Usage: browse js <expression>")
        return await client.js(expr)
      }
      case "cookies":
        return await client.cookies()
      case "storage":
        return await client.storage()
      case "url":
        return await client.url()
      case "back":
        return await client.back()
      case "forward":
        return await client.forward()
      case "reload":
        return await client.reload()
      case "viewport": {
        const wh = args[0]
        if (!wh) throw new Error("Usage: browse viewport <WxH>")
        const [w, h] = wh.split("x").map(Number)
        if (isNaN(w) || isNaN(h)) throw new Error("Invalid viewport format. Use WxH (e.g., 1280x720)")
        return await client.viewport(w, h)
      }
      default:
        return await executeWithBinary(command, args)
    }
  } catch (err: any) {
    if (err.code === "ERR_MODULE_NOT_FOUND" || err.message?.includes("playwright")) {
      return await executeWithBinary(command, args)
    }
    throw err
  }
}

export const BrowseTool = Tool.define("browse", async () => {
  return {
    description: BROWSE_DESCRIPTION,
    parameters: z.object({
      command: z.string().describe("Command: goto, click, fill, snapshot, screenshot, text, etc."),
      args: z.array(z.string()).optional().describe("Command arguments"),
    }),
    async execute(params: { command: string; args?: string[] }, ctx) {
      const command = params.command
      const args = params.args ?? []
      const projectDir = Instance.directory

      await ctx.ask({
        permission: "browse",
        patterns: ["*"],
        always: [],
        metadata: { command, args, projectDir },
      })

      // Set root directory for service manager
      skillServiceManager.setRoot(projectDir)

      try {
        // Try service mode first (full-featured)
        const result = await executeWithService(command, args)
        return { output: result, metadata: {}, title: "" }
      } catch (err: any) {
        // Fall back to built-in mode if service fails
        log.warn(`Service mode failed, falling back to built-in: ${err.message}`)
        try {
          const result = await executeWithBuiltin(command, args)
          return { output: result, metadata: {}, title: "" }
        } catch (builtinErr: any) {
          throw new Error(`Browse command failed: ${builtinErr.message}`)
        }
      }
    },
  }
})
