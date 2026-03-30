import WebSocket from "ws"

export interface CDPMessage {
  id: number
  method: string
  params?: Record<string, unknown>
}

export interface CDPResponse {
  id: number
  result?: Record<string, unknown>
  error?: {
    code: number
    message: string
  }
}

export class CDPClient {
  private ws: WebSocket | null = null
  private messageId = 0
  private pending = new Map<number, (result: CDPResponse) => void>()
  private listeners = new Map<string, Set<(params: Record<string, unknown>) => void>>()

  async connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl)

      this.ws.on("open", () => {
        resolve()
      })

      this.ws.on("message", (data) => {
        const msg = JSON.parse(data.toString())
        if (msg.id) {
          const callback = this.pending.get(msg.id)
          if (callback) {
            callback(msg)
            this.pending.delete(msg.id)
          }
        } else if (msg.method) {
          const listeners = this.listeners.get(msg.method)
          if (listeners) {
            listeners.forEach((fn) => fn(msg.params || {}))
          }
        }
      })

      this.ws.on("error", (err) => {
        reject(err)
      })
    })
  }

  async send<T = Record<string, unknown>>(method: string, params?: Record<string, unknown>): Promise<T> {
    if (!this.ws) throw new Error("Not connected")

    const id = ++this.messageId

    return new Promise((resolve, reject) => {
      this.pending.set(id, (result) => {
        if (result.error) {
          reject(new Error(`CDP Error ${result.error.code}: ${result.error.message}`))
        } else {
          // If returnByValue was passed, result may contain the actual value
          const resultData = result.result as { type?: string; value?: unknown } | undefined
          if (resultData && typeof resultData === "object" && "type" in resultData && resultData.type === "undefined") {
            resolve({} as T)
          } else {
            resolve(result.result as T)
          }
        }
      })

      this.ws!.send(JSON.stringify({ id, method, params }))
    })
  }

  on(method: string, callback: (params: Record<string, unknown>) => void): void {
    if (!this.listeners.has(method)) {
      this.listeners.set(method, new Set())
    }
    this.listeners.get(method)!.add(callback)
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

interface ChromeTarget {
  id: string
  type: string
  url: string
  webSocketDebuggerUrl: string
}

export async function getPageWebSocketUrl(port: number): Promise<string> {
  const res = await fetch(`http://localhost:${port}/json`)
  const targets: ChromeTarget[] = await res.json()

  const kuaishouTarget = targets.find((t) => t.url.includes("kuaishou") && t.type === "page")

  if (kuaishouTarget) {
    return kuaishouTarget.webSocketDebuggerUrl
  }

  if (targets.length > 0 && targets[0].webSocketDebuggerUrl) {
    return targets[0].webSocketDebuggerUrl
  }

  throw new Error("No page target found. Please open a page in Chrome first.")
}

export async function connectToChrome(port: number): Promise<CDPClient> {
  const wsUrl = await getPageWebSocketUrl(port)
  const client = new CDPClient()
  await client.connect(wsUrl)
  return client
}
