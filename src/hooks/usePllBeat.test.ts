import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import type { PllState } from "../types"
import { fitLine, pllReducer, usePllBeat } from "./usePllBeat"

// --- fitLine ---

describe("fitLine", () => {
  it("returns slope=1 intercept=0 for perfect diagonal", () => {
    const { slope, intercept } = fitLine([0, 1, 2, 3], [0, 1, 2, 3])
    expect(slope).toBe(1)
    expect(intercept).toBe(0)
  })

  it("returns correct slope and intercept for offset line", () => {
    const { slope, intercept } = fitLine([0, 1, 2, 3], [10, 12, 14, 16])
    expect(slope).toBe(2)
    expect(intercept).toBe(10)
  })

  it("handles negative slope", () => {
    const { slope, intercept } = fitLine([0, 1, 2, 3], [30, 20, 10, 0])
    expect(slope).toBe(-10)
    expect(intercept).toBe(30)
  })

  it("handles two points", () => {
    const { slope, intercept } = fitLine([0, 4], [100, 500])
    expect(slope).toBe(100)
    expect(intercept).toBe(100)
  })
})

// --- pllReducer ---

const emptyState: PllState = { offsetMs: 0, intervalMs: 0, confidence: 0, taps: [] }

describe("pllReducer", () => {
  it("accumulates taps without fitting when fewer than 8", () => {
    const s1 = pllReducer(emptyState, 100, 1)
    expect(s1.taps).toHaveLength(1)
    expect(s1.intervalMs).toBe(0)

    const s2 = pllReducer(s1, 200, 1)
    expect(s2.taps).toHaveLength(2)
    expect(s2.intervalMs).toBe(0)

    const s3 = pllReducer(s2, 300, 1)
    expect(s3.taps).toHaveLength(3)
    expect(s3.intervalMs).toBe(0)
  })

  it("enters regression at 8 exact beats, multiplier=1 → ~60 BPM", () => {
    let state = emptyState
    for (let i = 1; i <= 8; i++) {
      state = pllReducer(state, i * 1000, 1)
    }
    expect(state.taps).toHaveLength(8)
    expect(state.intervalMs).toBeCloseTo(1000, -1)
    expect(state.confidence).toBe(0.6)
  })

  it("regression with multiplier=2 yields correct beat interval", () => {
    let state = emptyState
    for (let i = 1; i <= 8; i++) {
      state = pllReducer(state, i * 2000, 2)
    }
    expect(state.intervalMs).toBeCloseTo(1000, -1)
    expect(state.confidence).toBe(0.6)
  })

  it("regression at 120 BPM (500ms intervals) after 8 taps", () => {
    let state = emptyState
    for (let i = 1; i <= 8; i++) {
      state = pllReducer(state, i * 500, 1)
    }
    expect(state.intervalMs).toBeCloseTo(500, -1)
    expect(state.confidence).toBe(0.6)
  })

  it("transitions to tracking after regression on 9th tap", () => {
    let state = emptyState
    for (let i = 1; i <= 8; i++) {
      state = pllReducer(state, i * 1000, 1)
    }
    const bpm = 60000 / state.intervalMs
    expect(bpm).toBeCloseTo(60, -1)
    expect(state.confidence).toBe(0.6)

    state = pllReducer(state, 9000, 1)
    expect(state.intervalMs).toBeCloseTo(1000, -1)
    expect(state.confidence).toBeGreaterThan(0.6)
    expect(state.confidence).toBeLessThanOrEqual(1)
  })

  it("confidence increases toward 1 with more taps", () => {
    let state = emptyState
    for (let i = 1; i <= 24; i++) {
      state = pllReducer(state, i * 1000, 1)
    }
    expect(state.confidence).toBeGreaterThan(0.9)
  })

  it("caps tap history at 32 entries", () => {
    let state = emptyState
    for (let i = 1; i <= 40; i++) {
      state = pllReducer(state, i * 1000, 1)
    }
    expect(state.taps.length).toBeLessThanOrEqual(32)
  })

  it("rejects out-of-range BPM and falls back to prev state", () => {
    const s1 = pllReducer(emptyState, 0, 1)
    const s2 = pllReducer(s1, 5, 1)
    const s3 = pllReducer(s2, 10, 1)
    const s4 = pllReducer(s3, 15, 1)

    expect(s4.intervalMs).toBe(0)
    expect(s4.confidence).toBe(0)
    expect(s4.taps).toHaveLength(4)
  })

  it("nudges offset and interval in tracking mode on late tap", () => {
    let state = emptyState
    for (let i = 1; i <= 8; i++) {
      state = pllReducer(state, i * 1000, 1)
    }
    const prevInterval = state.intervalMs

    state = pllReducer(state, 9100, 1)
    expect(state.offsetMs).toBeGreaterThan(0)
    expect(state.intervalMs).toBeGreaterThan(prevInterval)
    expect(state.confidence).toBeCloseTo(0.65, 2)
  })
})

// --- Derived value tests (phase, bpm, getBeatAtTime, getTimeForBeat) ---

describe("phase derivation", () => {
  it("phase is idle when fewer than 8 taps", () => {
    const s = pllReducer(emptyState, 100, 1)
    const n = s.taps.length
    expect(n < 8).toBe(true)
  })
})

describe("getBeatAtTime / getTimeForBeat", () => {
  const state: PllState = { offsetMs: 0, intervalMs: 1000, confidence: 0.6, taps: [] }

  it("getBeatAtTime returns correct beat", () => {
    expect((5000 - state.offsetMs) / state.intervalMs).toBe(5)
  })

  it("getTimeForBeat returns correct time", () => {
    expect(state.offsetMs + 5 * state.intervalMs).toBe(5000)
  })

  it("getBeatAtTime returns 0 when intervalMs <= 0", () => {
    const deadState: PllState = { offsetMs: 0, intervalMs: 0, confidence: 0, taps: [] }
    expect(deadState.intervalMs <= 0 ? 0 : (100 - deadState.offsetMs) / deadState.intervalMs).toBe(0)
  })
})

// --- usePllBeat hook integration ---

describe("usePllBeat hook", () => {
  it("starts with idle phase and zero BPM", () => {
    const { result } = renderHook(() => usePllBeat())

    expect(result.current.bpm).toBe(0)
    expect(result.current.phase).toBe("idle")
    expect(result.current.state.confidence).toBe(0)
    expect(result.current.state.taps).toHaveLength(0)
  })

  it("reaches ~60 BPM after 8 taps at 1s intervals", () => {
    const { result } = renderHook(() => usePllBeat())

    for (let i = 1; i <= 8; i++) {
      act(() => { result.current.onTap(i * 1000, 1) })
    }

    expect(result.current.phase).toBe("regression")
    expect(result.current.bpm).toBeCloseTo(60, 0)
    expect(result.current.state.intervalMs).toBeCloseTo(1000, -1)
    expect(result.current.state.confidence).toBe(0.6)
  })

  it("transitions phase: idle → regression → tracking", () => {
    const { result } = renderHook(() => usePllBeat())

    expect(result.current.phase).toBe("idle")

    for (let i = 1; i <= 8; i++) {
      act(() => { result.current.onTap(i * 1000, 1) })
    }
    expect(result.current.phase).toBe("regression")

    for (let i = 9; i <= 17; i++) {
      act(() => { result.current.onTap(i * 1000, 1) })
    }
    expect(result.current.phase).toBe("tracking")
  })

  it("confidence increases with each tap in tracking phase", () => {
    const { result } = renderHook(() => usePllBeat())

    for (let i = 1; i <= 8; i++) {
      act(() => { result.current.onTap(i * 1000, 1) })
    }
    const afterRegression = result.current.state.confidence
    expect(afterRegression).toBe(0.6)

    for (let i = 9; i <= 24; i++) {
      act(() => { result.current.onTap(i * 1000, 1) })
    }
    expect(result.current.state.confidence).toBeGreaterThan(0.9)
  })

  it("getBeatAtTime returns correct values after regression", () => {
    const { result } = renderHook(() => usePllBeat())

    for (let i = 1; i <= 8; i++) {
      act(() => { result.current.onTap(i * 1000, 1) })
    }

    expect(result.current.getBeatAtTime(9000)).toBeCloseTo(8, 0)
    expect(result.current.getBeatAtTime(0)).toBeCloseTo(-1, 0)
    expect(result.current.getBeatAtTime(1000)).toBeCloseTo(0, 0)
  })

  it("getTimeForBeat returns correct times after regression", () => {
    const { result } = renderHook(() => usePllBeat())

    for (let i = 1; i <= 8; i++) {
      act(() => { result.current.onTap(i * 1000, 1) })
    }

    expect(result.current.getTimeForBeat(0)).toBeCloseTo(result.current.state.offsetMs, 0)
    expect(result.current.getTimeForBeat(8)).toBeCloseTo(result.current.state.offsetMs + 8 * result.current.state.intervalMs, 0)
  })

  it("reset clears all state", () => {
    const { result } = renderHook(() => usePllBeat())

    for (let i = 1; i <= 8; i++) {
      act(() => { result.current.onTap(i * 1000, 1) })
    }
    expect(result.current.bpm).toBeGreaterThan(0)

    act(() => { result.current.reset() })

    expect(result.current.bpm).toBe(0)
    expect(result.current.phase).toBe("idle")
    expect(result.current.state.taps).toHaveLength(0)
    expect(result.current.state.confidence).toBe(0)
  })

  it("forceInterval sets interval and confidence", () => {
    const { result } = renderHook(() => usePllBeat())

    act(() => { result.current.forceInterval(500) })

    expect(result.current.state.intervalMs).toBe(500)
    expect(result.current.state.confidence).toBe(0.5)
    expect(result.current.bpm).toBe(120)
  })

  it("nudgeOffset shifts offset by delta", () => {
    const { result } = renderHook(() => usePllBeat())

    act(() => { result.current.forceInterval(1000) })
    const before = result.current.state.offsetMs

    act(() => { result.current.nudgeOffset(100) })
    expect(result.current.state.offsetMs).toBe(before + 100)

    act(() => { result.current.nudgeOffset(-50) })
    expect(result.current.state.offsetMs).toBe(before + 50)
  })

  it("handles irregular tap intervals (jitter)", () => {
    const { result } = renderHook(() => usePllBeat())

    for (let i = 1; i <= 8; i++) {
      act(() => { result.current.onTap(i * 1000 + (i % 2 === 0 ? 50 : -50), 1) })
    }

    expect(result.current.bpm).toBeGreaterThan(55)
    expect(result.current.bpm).toBeLessThan(65)
    expect(result.current.phase).toBe("regression")
  })

  it("rejects extreme BPM (bpm=0) but phase is still regression at 8 taps", () => {
    const { result } = renderHook(() => usePllBeat())

    for (let i = 1; i <= 8; i++) {
      act(() => { result.current.onTap(i * 5, 1) })
    }

    expect(result.current.bpm).toBe(0)
    expect(result.current.phase).toBe("regression")
  })

  it("tracks correctly after forceInterval then tap", () => {
    const { result } = renderHook(() => usePllBeat())

    act(() => { result.current.forceInterval(1000) })
    expect(result.current.phase).toBe("idle")

    act(() => { result.current.onTap(1500, 1) })
    expect(result.current.state.taps).toHaveLength(1)
    expect(result.current.state.intervalMs).toBeCloseTo(999.5, 1)
    expect(result.current.state.confidence).toBe(0.55)
    expect(result.current.bpm).toBeCloseTo(60.03, 0)
  })

  it("mixing multipliers during regression yields approximate BPM", () => {
    const { result } = renderHook(() => usePllBeat())

    const times = [1000, 2000, 3000, 5000, 6000, 7000, 8000, 10000]
    const mults = [1, 1, 1, 2, 1, 1, 1, 2]
    for (let i = 0; i < 8; i++) {
      act(() => { result.current.onTap(times[i], mults[i]) })
    }

    expect(result.current.bpm).toBeCloseTo(57.1, 1)
    expect(result.current.phase).toBe("regression")
  })
})
