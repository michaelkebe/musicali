import { test, expect } from "@playwright/test"

test.describe("Musicali E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
    await page.goto("/")
    await page.waitForLoadState("networkidle")
  })

  async function mockPerfNow(page: import("@playwright/test").Page, increment = 1000) {
    await page.evaluate((inc: number) => {
      if (!window.__origPerfNow) {
        window.__origPerfNow = performance.now.bind(performance)
      }
      let t = 0
      performance.now = () => { t += inc; return t }
    }, increment)
  }

  async function restorePerfNow(page: import("@playwright/test").Page) {
    await page.evaluate(() => {
      if (window.__origPerfNow) {
        performance.now = window.__origPerfNow
      }
    })
  }

  async function tapExact(page: import("@playwright/test").Page, count: number, multiplier = 1, increment = 1000) {
    await mockPerfNow(page, increment)
    const btn = page.getByTitle(multiplier === 1 ? "Tap every 1 beat" : multiplier === 2 ? "Tap every 2 beats" : "Tap every 4 beats")
    for (let i = 0; i < count; i++) await btn.click()
  }

  async function tapReal(page: import("@playwright/test").Page, count: number, intervalMs = 400, multiplier = 1) {
    const btn = page.getByTitle(multiplier === 1 ? "Tap every 1 beat" : multiplier === 2 ? "Tap every 2 beats" : "Tap every 4 beats")
    for (let i = 0; i < count; i++) {
      await btn.click()
      // Small pause for React to flush state before next click or assertion
      await page.waitForTimeout(50)
      if (i < count - 1) await page.waitForTimeout(intervalMs)
    }
  }

  test("app loads with title and all major UI sections", async ({ page }) => {
    await expect(page.getByText("Musicali")).toBeVisible()
    await expect(page.getByText("WCS Phrase & Pattern Visualizer")).toBeVisible()

    await expect(page.getByTitle("Detect BPM from microphone")).toBeVisible()
    await expect(page.getByTitle("Tap every 1 beat")).toBeVisible()
    await expect(page.getByTitle("Tap every 2 beats")).toBeVisible()
    await expect(page.getByTitle("Tap every 4 beats")).toBeVisible()
    await expect(page.getByTitle("Reset tap counter")).toBeVisible()
    await expect(page.getByText("— BPM")).toBeVisible()

    await expect(page.getByTitle("Start playback")).toBeVisible()
    await expect(page.getByTitle("Stop playback")).toBeVisible()
    await expect(page.getByTitle("Toggle pattern announcements")).toBeVisible()

    await expect(page.getByRole("heading", { name: "Patterns", exact: true })).toBeVisible()
    await expect(page.getByText("6-Count Patterns")).toBeVisible()
    await expect(page.getByText("8-Count Patterns")).toBeVisible()
  })

  test("legacy tapping: exact 60 BPM with mocked performance.now", async ({ page }) => {
    await tapExact(page, 4)
    await expect(page.getByText("60.000 BPM")).toBeVisible()
  })

  test("legacy tapping: exact 120 BPM with 500ms intervals", async ({ page }) => {
    await tapExact(page, 4, 1, 500)
    await expect(page.getByText("120.000 BPM")).toBeVisible()
  })

  test("legacy tapping: multiplier=2 gives exact 120 BPM at 1000ms intervals", async ({ page }) => {
    await tapExact(page, 4, 2)
    await expect(page.getByText("120.000 BPM")).toBeVisible()
  })

  test("legacy tapping: shows placeholder before 4 taps", async ({ page }) => {
    await tapExact(page, 3)
    await expect(page.getByText("— BPM")).toBeVisible()
  })

  test("legacy tapping: multiplier=4 gives exact 240 BPM at 1000ms intervals", async ({ page }) => {
    await tapExact(page, 4, 4)
    await expect(page.getByText("240.000 BPM")).toBeVisible()
  })

  test("reset clears taps in legacy mode", async ({ page }) => {
    await tapExact(page, 4)
    await expect(page.getByText("60.000 BPM")).toBeVisible()

    await page.getByTitle("Reset tap counter").click()

    const btn = page.getByTitle("Tap every 1 beat")
    await btn.click()
    await btn.click()
    await btn.click()
    await expect(page.getByText("— BPM")).toBeVisible()
  })

  test("mode toggle switches between AVG and PLL", async ({ page }) => {
    const toggle = page.getByTitle("Switch to PLL mode")
    await expect(toggle).toHaveText("AVG")
    await toggle.click()

    const newToggle = page.getByTitle("Switch to averaged mode")
    await expect(newToggle).toHaveText("PLL")
  })

  test("PLL mode: tapping 8 times triggers FIT indicator with real timing", async ({ page }) => {
    await page.getByTitle("Switch to PLL mode").click()
    await tapReal(page, 8, 400)

    await expect(page.getByText("FIT")).toBeVisible()
    const bpmText = await page.locator(".bpm-display").textContent()
    expect(bpmText).toMatch(/\d+\.\d{3} BPM/)
    const bpm = parseFloat(bpmText!)
    expect(bpm).toBeGreaterThan(100)
    expect(bpm).toBeLessThan(200)
  })

  test("PLL mode: confidence bar visible after 8 taps", async ({ page }) => {
    await page.getByTitle("Switch to PLL mode").click()
    await tapReal(page, 8, 400)

    const confidenceBar = page.locator(".pll-confidence-bar")
    await expect(confidenceBar).toBeVisible()
    const width = await confidenceBar.getAttribute("style")
    expect(width).toMatch(/width:\s*\d+%/)
  })

  test("PLL mode: 17 taps transitions to tracking (LCK)", async ({ page }) => {
    await page.getByTitle("Switch to PLL mode").click()
    await tapReal(page, 17, 300)

    await expect(page.getByText("LCK")).toBeVisible()
    const bpmText = await page.locator(".bpm-display").textContent()
    expect(bpmText).toMatch(/\d+\.\d{3} BPM/)
    const bpm = parseFloat(bpmText!)
    expect(bpm).toBeGreaterThan(100)
    expect(bpm).toBeLessThan(300)
  })

  test("play button is disabled when BPM is 0", async ({ page }) => {
    await expect(page.getByTitle("Start playback")).toBeDisabled()
  })

  test("play button becomes enabled after tapping BPM", async ({ page }) => {
    await tapExact(page, 4)
    await expect(page.getByTitle("Start playback")).not.toBeDisabled()
  })

  test("trimmer buttons appear in AVG mode, disappear in PLL mode", async ({ page }) => {
    await expect(page.getByTitle("Trim BPM +0.1")).toBeVisible()

    await page.getByTitle("Switch to PLL mode").click()
    await expect(page.getByTitle("Trim BPM +0.1")).not.toBeVisible()
  })

  test("trimmer adjusts BPM", async ({ page }) => {
    await tapExact(page, 4)
    await expect(page.getByText("60.000 BPM")).toBeVisible()

    await page.getByTitle("Trim BPM +0.1").click()
    await expect(page.getByText("60.100 BPM")).toBeVisible()
  })

  test("beat display shows correct row beat", async ({ page }) => {
    await tapExact(page, 4)

    await page.getByTitle("Start playback").click()
    await page.waitForTimeout(200)

    const beatNum = page.locator(".beat-num-lg")
    await expect(beatNum).toBeVisible()
    const text = await beatNum.textContent()
    expect(Number(text)).toBeGreaterThanOrEqual(1)
    expect(Number(text)).toBeLessThanOrEqual(8)
  })

  test("pattern palette items are clickable", async ({ page }) => {
    const firstPattern = page.locator(".palette-item").first()
    await expect(firstPattern).toBeVisible()
    await firstPattern.click()

    await expect(firstPattern).toHaveClass(/selected/)
  })

  test("double-click palette item shows on timeline", async ({ page }) => {
    await tapExact(page, 4)

    const pattern = page.locator(".palette-item").first()
    await pattern.dblclick()

    const timeline = page.locator(".timeline")
    await expect(timeline).toBeVisible()

    const placed = page.locator(".placed-row").first()
    await expect(placed).toBeVisible()

    await expect(placed.locator(".placed-name")).toBeVisible()
  })

  test("announce toggle button works", async ({ page }) => {
    const toggle = page.getByTitle("Toggle pattern announcements")
    const initialClass = await toggle.getAttribute("class")
    expect(initialClass).not.toContain("announce-btn muted")

    await toggle.click()
    await page.waitForTimeout(100)

    const afterClass = await toggle.getAttribute("class")
    expect(afterClass).toContain("announce-btn muted")
  })

  test("nudge buttons disabled when not playing", async ({ page }) => {
    await expect(page.getByTitle("Nudge playback earlier by 100ms")).toBeDisabled()
    await expect(page.getByTitle("Nudge playback later by 100ms")).toBeDisabled()
  })

  test("play and stop cycle", async ({ page }) => {
    await tapExact(page, 4)

    await page.getByTitle("Start playback").click()
    await page.waitForTimeout(200)

    await expect(page.getByTitle("Stop playback")).not.toBeDisabled()
    await expect(page.getByTitle("Start playback")).toBeDisabled()

    await page.getByTitle("Stop playback").click()
    await page.waitForTimeout(100)
    await expect(page.getByText("DOWN")).not.toBeVisible()
  })

  test("beat advances at correct timing for 60 BPM", async ({ page }) => {
    await tapExact(page, 4)

    await restorePerfNow(page)

    const startTime = await page.evaluate(() => performance.now())
    await page.getByTitle("Start playback").click()

    // At 60 BPM (1000ms per beat), beat 1 fires immediately on play.
    // Wait slightly more than 1000ms to see beat 2.
    await page.waitForTimeout(1200)
    await expect(page.locator(".beat-num-lg")).toHaveText("2")
    await expect(page.locator(".beat-dir")).toHaveText("UP")

    await page.waitForTimeout(1000)
    await expect(page.locator(".beat-num-lg")).toHaveText("3")
    await expect(page.locator(".beat-dir")).toHaveText("DOWN")

    await page.waitForTimeout(1000)
    await expect(page.locator(".beat-num-lg")).toHaveText("4")
    await expect(page.locator(".beat-dir")).toHaveText("UP")

    const elapsed = await page.evaluate(() => performance.now()) - startTime
    expect(elapsed).toBeGreaterThan(3000)
  })

  test("stats bar shows correct counts", async ({ page }) => {
    await expect(page.locator(".stats-bar")).toBeVisible()
    await expect(page.locator(".stats-bar .stat-label").first()).toBeVisible()
    await expect(page.getByText("Beats Used")).toBeVisible()
    await expect(page.locator(".stats-bar").getByText("Phrases", { exact: true })).toBeVisible()
    await expect(page.getByText("8-counts")).toBeVisible()
  })

  test("version link is visible", async ({ page }) => {
    const versionLink = page.locator(".version")
    await expect(versionLink).toBeVisible()
    const href = await versionLink.getAttribute("href")
    expect(href).toContain("github.com/michaelkebe/musicali")
  })

  test("no cumulative beat-timing drift over 64 beats at 300 BPM", async ({ page }) => {
    await tapExact(page, 4, 1, 200)
    await expect(page.getByText("300.000 BPM")).toBeVisible()
    await restorePerfNow(page)

    // Start a rAF-based poller before play — counts beat transitions via rowBeat DOM.
    await page.evaluate(() => {
      const el = document.querySelector(".beat-num-lg")
      let lastBeat = el ? parseInt(el.textContent || "0") : 0
      let transitionsDone = 0
      let startTime = 0

      const poll = () => {
        const cur = document.querySelector(".beat-num-lg")
        if (cur) {
          const rowBeat = parseInt(cur.textContent || "0")
          if (rowBeat !== lastBeat) {
            lastBeat = rowBeat
            transitionsDone++
            if (transitionsDone === 1) {
              startTime = performance.now()
            } else if (transitionsDone === 65) {
              // 64 intervals measured from beat 2 → beat 66
              window.__driftElapsed = performance.now() - startTime
              window.__driftDone = true
              return
            }
          }
        }
        requestAnimationFrame(poll)
      }
      requestAnimationFrame(poll)
    })

    await page.getByTitle("Start playback").click()

    await page.waitForFunction(() => window.__driftDone, { timeout: 25000 })
    const elapsed = await page.evaluate(() => window.__driftElapsed)

    // 64 intervals × 200ms = 12800ms expected.
    // With old cumulative-drift bug and ~8ms/beat rAF delay, total ≈ 13312ms.
    // Tight tolerance catches drift while allowing headless timing jitter.
    expect(elapsed).toBeGreaterThan(12400)
    expect(elapsed).toBeLessThan(13200)
  })
})
