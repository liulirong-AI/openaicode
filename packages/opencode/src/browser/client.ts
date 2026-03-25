import path from "path"
import fs from "fs"
import { Instance } from "../project/instance"
import { Log } from "@/util/log"

const log = Log.create({ service: "browser" })

export interface RefEntry {
  locator: any
  role: string
  name: string
}

let playwright: any = null

function getPlaywright() {
  if (playwright) return playwright
  try {
    const bunCachePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "node_modules",
      ".bun",
      "playwright@1.57.0",
      "node_modules",
      "playwright",
    )
    if (fs.existsSync(bunCachePath)) {
      playwright = require(bunCachePath)
      return playwright
    }
    playwright = require("playwright")
    return playwright
  } catch {
    return null
  }
}

class BrowserClient {
  private browser: any = null
  private context: any = null
  private page: any = null
  private refMap: Map<string, RefEntry> = new Map()
  private nextRef = 1
  private stateDir: string

  constructor() {
    this.stateDir = path.join(Instance.directory, ".opencode", "browser")
  }

  async ensureBrowser(): Promise<void> {
    if (this.browser) return

    const pw = getPlaywright()
    if (!pw) throw new Error("playwright not installed")

    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true })
    }

    this.browser = await pw.chromium.launch({ headless: true })
    this.context = await this.browser.newContext({ viewport: { width: 1280, height: 720 } })
    this.page = await this.context.newPage()
    log.info("Browser launched")

    this.browser.on("disconnected", () => {
      this.browser = null
      this.context = null
      this.page = null
      log.info("Browser disconnected")
    })
  }

  getPage(): any {
    if (!this.page) throw new Error("Browser not initialized")
    return this.page
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      log.info("Browser closed")
      this.browser = null
      this.context = null
      this.page = null
    }
  }

  async goto(url: string): Promise<string> {
    await this.ensureBrowser()
    const response = await this.page!.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 })
    const status = response?.status() || "unknown"
    log.info(`Navigated to ${url} (${status})`)
    return `Navigated to ${url} (${status})`
  }

  async text(): Promise<string> {
    if (!this.page) throw new Error("Browser not initialized")
    const txt = await this.page.evaluate(() => {
      const body = document.body
      if (!body) return ""
      const clone = body.cloneNode(true) as HTMLElement
      clone.querySelectorAll("script, style, noscript, svg").forEach((el) => (el as Element).remove())
      return clone.innerText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n")
    })
    log.info("Extracted page text")
    return txt
  }

  async html(selector?: string): Promise<string> {
    if (!this.page) throw new Error("Browser not initialized")
    if (selector) {
      const el = await this.page.$(selector)
      if (!el) throw new Error(`Element not found: ${selector}`)
      const html = await el.innerHTML()
      log.info(`Got HTML for selector ${selector}`)
      return html
    }
    const full = await this.page.content()
    log.info("Got full page HTML")
    return full
  }

  async snapshot(interactive = false, compact = false): Promise<string> {
    await this.ensureBrowser()
    const page = this.page!
    this.refMap.clear()
    this.nextRef = 1
    const scope = page.locator("body")
    const tree = await scope.ariaSnapshot()
    const lines = tree.split("\n")
    const result: string[] = []
    const interactiveRoles = new Set([
      "button",
      "link",
      "textbox",
      "checkbox",
      "radio",
      "combobox",
      "menuitem",
      "option",
      "searchbox",
      "slider",
      "switch",
      "tab",
    ])
    for (const line of lines) {
      const match = line.match(/^(\s*)(- )?([^\[]+)(?:\[([^\]]+)\])?: (.*)$/)
      if (!match) {
        result.push(line)
        continue
      }
      const [, indent, , role, props, name] = match
      const isInteractive = interactiveRoles.has(role)
      if (interactive && !isInteractive) continue
      const ref = `@e${this.nextRef++}`
      const locator = page.locator("body").getByRole(role as any, { name: name?.trim() })
      this.refMap.set(ref, { locator, role, name: name?.trim() || "" })
      const refPrefix = interactive ? `${ref} ` : ""
      result.push(`${indent}${refPrefix}${role}${props ? `[${props}]` : ""}: ${name}`)
    }
    if (compact) {
      const compacted = result.filter((line) => !line.match(/^\s*[-:]?\s*$/)).join("\n")
      log.info("Generated compact snapshot")
      return compacted
    }
    const snapshotStr = result.join("\n")
    log.info("Generated snapshot")
    return snapshotStr
  }

  async screenshot(outputPath?: string): Promise<string> {
    await this.ensureBrowser()
    const p = outputPath || path.join(this.stateDir, `screenshot-${Date.now()}.png`)
    await this.page!.screenshot({ path: p, fullPage: true })
    log.info(`Screenshot saved to ${p}`)
    return `Screenshot saved to ${p}`
  }

  async click(selector: string): Promise<string> {
    await this.ensureBrowser()
    const resolved = await this.resolveRef(selector)
    if ("locator" in resolved) {
      await resolved.locator.click({ timeout: 5000 })
    } else {
      await this.page!.click(resolved.selector, { timeout: 5000 })
    }
    log.info(`Clicked ${selector}`)
    return `Clicked ${selector}`
  }

  async fill(selector: string, value: string): Promise<string> {
    await this.ensureBrowser()
    const resolved = await this.resolveRef(selector)
    if ("locator" in resolved) {
      await resolved.locator.fill(value, { timeout: 5000 })
    } else {
      await this.page!.fill(resolved.selector, value, { timeout: 5000 })
    }
    log.info(`Filled ${selector} with "${value}"`)
    return `Filled ${selector} with "${value}"`
  }

  async select(selector: string, value: string): Promise<string> {
    await this.ensureBrowser()
    const resolved = await this.resolveRef(selector)
    if ("locator" in resolved) {
      await resolved.locator.selectOption(value, { timeout: 5000 })
    } else {
      await this.page!.selectOption(resolved.selector, value, { timeout: 5000 })
    }
    log.info(`Selected ${value} in ${selector}`)
    return `Selected ${value} in ${selector}`
  }

  async hover(selector: string): Promise<string> {
    await this.ensureBrowser()
    const resolved = await this.resolveRef(selector)
    if ("locator" in resolved) {
      await resolved.locator.hover({ timeout: 5000 })
    } else {
      await this.page!.hover(resolved.selector, { timeout: 5000 })
    }
    log.info(`Hovered ${selector}`)
    return `Hovered ${selector}`
  }

  async type(selector: string, text: string): Promise<string> {
    await this.ensureBrowser()
    await this.page!.click(selector, { timeout: 5000 })
    await this.page!.keyboard.type(text)
    log.info(`Typed "${text}" into ${selector}`)
    return `Typed "${text}" into ${selector}`
  }

  async press(key: string): Promise<string> {
    await this.ensureBrowser()
    await this.page!.keyboard.press(key)
    log.info(`Pressed ${key}`)
    return `Pressed ${key}`
  }

  async scroll(selector?: string): Promise<string> {
    await this.ensureBrowser()
    if (selector) {
      const el = await this.page!.$(selector)
      if (el) await el.scrollIntoViewIfNeeded()
    } else {
      await this.page!.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    }
    const msg = selector ? `Scrolled to ${selector}` : "Scrolled to bottom"
    log.info(msg)
    return msg
  }

  async wait(selector: string): Promise<string> {
    await this.ensureBrowser()
    await this.page!.waitForSelector(selector, { timeout: 15000 })
    log.info(`Found ${selector}`)
    return `Found ${selector}`
  }

  async js(expr: string): Promise<string> {
    await this.ensureBrowser()
    const result = await this.page!.evaluate(expr)
    const str = String(result)
    log.info(`Evaluated JS: ${expr}`)
    return str
  }

  async cookies(): Promise<string> {
    await this.ensureBrowser()
    const cookies = await this.context.cookies()
    const out = JSON.stringify(cookies, null, 2)
    log.info("Fetched cookies")
    return out
  }

  async storage(): Promise<string> {
    await this.ensureBrowser()
    const localStorage = await this.page!.evaluate(() => JSON.stringify(localStorage))
    const sessionStorage = await this.page!.evaluate(() => JSON.stringify(sessionStorage))
    const out = JSON.stringify(
      { localStorage: JSON.parse(localStorage), sessionStorage: JSON.parse(sessionStorage) },
      null,
      2,
    )
    log.info("Fetched storage")
    return out
  }

  async url(): Promise<string> {
    if (!this.page) throw new Error("Browser not initialized")
    const u = this.page.url()
    log.info(`Current URL: ${u}`)
    return u
  }

  async back(): Promise<string> {
    await this.ensureBrowser()
    await this.page!.goBack()
    const u = this.page!.url()
    log.info(`Back to ${u}`)
    return `Back to ${u}`
  }

  async forward(): Promise<string> {
    await this.ensureBrowser()
    await this.page!.goForward()
    const u = this.page!.url()
    log.info(`Forward to ${u}`)
    return `Forward to ${u}`
  }

  async reload(): Promise<string> {
    await this.ensureBrowser()
    await this.page!.reload()
    const u = this.page!.url()
    log.info(`Reloaded ${u}`)
    return `Reloaded ${u}`
  }

  async viewport(width: number, height: number): Promise<string> {
    await this.ensureBrowser()
    await this.context.setViewportSize({ width, height })
    log.info(`Viewport set to ${width}x${height}`)
    return `Viewport set to ${width}x${height}`
  }

  async resolveRef(selector: string): Promise<{ locator: any } | { selector: string }> {
    if (selector.startsWith("@e")) {
      const ref = this.refMap.get(selector)
      if (ref) return { locator: ref.locator }
      throw new Error(`Invalid ref: ${selector}. Run snapshot first.`)
    }
    return { selector }
  }

  getRefRole(selector: string): string | null {
    if (selector.startsWith("@e")) {
      const ref = this.refMap.get(selector)
      return ref?.role || null
    }
    return null
  }
}

const browserClient = new BrowserClient()

export { browserClient }
