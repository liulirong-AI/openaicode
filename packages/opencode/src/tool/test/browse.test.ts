import { expect, test } from "@playwright/test"
import { browserClient } from "../../browser/client"

let page: any

test.describe('BrowserClient core commands', () => {
  test.beforeAll(async () => {
    await browserClient.ensureBrowser()
    ;(browserClient as any).page && (page = (browserClient as any).page)
})
  test('goto and url', async () => {
    const url = "https://example.com"
    const result = await browserClient.goto(url)
    expect(result).toContain(url)
    const cur = await browserClient.url()
    expect(cur).toBe(url)
  })

  test('text', async () => {
    const txt = await browserClient.text()
    expect(txt.length).toBeGreaterThan(0)
  })

  test('snapshot interactive', async () => {
    const snap = await browserClient.snapshot(true, false)
    expect(snap).toContain('@e')
  })

  test('click and fill', async () => {
    await browserClient.goto(
      'data:text/html,\u003chtml\u003e\u003cbody\u003e\u003cbutton id="b"\u003eClick\u003c/button\u003e\u003cinput id="i"/\u003e\u003c/body\u003e\u003c/html\u003e'
    )
    await browserClient.click('#b')
    await browserClient.fill('#i', 'hello')
    const val = await page.evaluate(() => (document.querySelector('#i') as HTMLInputElement).value)
    expect(val).toBe('hello')
  })
})


  test.afterAll(async () => {
    await browserClient.close()
  })

  test("goto and url", async () => {
    const url = "https://example.com"
    const result = await browserClient.goto(url)
    expect(result).toContain(url)
    const cur = await browserClient.url()
    expect(cur).toBe(url)
  })

  test("text", async () => {
    const txt = await browserClient.text()
    expect(txt.length).toBeGreaterThan(0)
  })

  test("snapshot interactive", async () => {
    const snap = await browserClient.snapshot(true, false)
    expect(snap).toContain("@e")
  })

  test("click and fill", async () => {
    // Load a minimal page with button and input
    await browserClient.goto('data:text/html,<html><body><button id="b">Click</button><input id="i"/></body></html>')
    await browserClient.click("#b")
    await browserClient.fill("#i", "hello")
    const val = await page.evaluate(() => (document.querySelector("#i") as HTMLInputElement).value)
    expect(val).toBe("hello")
  })
})
